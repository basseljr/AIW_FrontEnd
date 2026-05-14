import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { ApiError, ApiErrorDetail } from './api-error';

/**
 * Error interceptor — normalizes every transport-level failure into an
 * ApiError so component code never has to inspect HttpErrorResponse directly.
 *
 * Response envelope (PRD §25): `{ data, meta, errors }`. The `errors` array,
 * when present, is `{ code, message, field? }[]`. We collapse it into a
 * single ApiError with the first item promoted to the top-level message and
 * the full array preserved as `details` so multi-field validation errors are
 * still available.
 *
 * Order matters: this interceptor sits AFTER the auth interceptor in the
 * chain. That way 401-driven silent refresh runs first; only failures that
 * survive refresh land here.
 */
function isStructuredErrorBody(value: unknown): value is {
  errors?: ApiErrorDetail[];
  message?: string;
  code?: string;
  correlationId?: string;
} {
  // Only objects that look like our `{ errors, message, code }` envelope are
  // treated as structured. ProgressEvent and Error instances reaching us as
  // `error.error` are transport-level signals, not server payloads, so they
  // fall through to the status-based fallback paths.
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof ProgressEvent) &&
    !(value instanceof Error) &&
    !(value instanceof Event)
  );
}

function extractMessage(error: HttpErrorResponse): {
  message: string;
  code: string;
  details: ApiErrorDetail[];
  correlationId?: string;
} {
  // status === 0 = the browser never got a response. Treat as a network error
  // regardless of what `error.error` happens to be (often a ProgressEvent).
  if (error.status === 0) {
    return {
      message: 'Network error — please check your connection.',
      code: 'NETWORK_ERROR',
      details: [],
    };
  }

  const body = error.error;
  if (isStructuredErrorBody(body)) {
    const details = Array.isArray(body.errors) ? body.errors : [];
    const first = details[0];
    return {
      message: first?.message ?? body.message ?? error.message,
      code: first?.code ?? body.code ?? `HTTP_${error.status}`,
      details,
      correlationId: body.correlationId,
    };
  }

  return {
    message: error.statusText || error.message,
    code: `HTTP_${error.status}`,
    details: [],
  };
}

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const { message, code, details, correlationId } = extractMessage(error);

      return throwError(
        () => new ApiError({ status: error.status, code, message, details, correlationId }),
      );
    }),
  );
};
