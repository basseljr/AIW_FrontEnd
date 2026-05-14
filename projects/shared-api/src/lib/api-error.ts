/**
 * Standardized error returned by the API layer to component code. Mirrors the
 * `{ data, meta, errors }` envelope defined in PRD §25 — only the `errors`
 * array is surfaced here, with HTTP status + a normalized code attached so
 * callers do not need to inspect HttpErrorResponse directly.
 */
export interface ApiErrorDetail {
  code: string;
  message: string;
  field?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];
  readonly correlationId?: string;

  constructor(args: {
    status: number;
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    correlationId?: string;
  }) {
    super(args.message);
    this.name = 'ApiError';
    this.status = args.status;
    this.code = args.code;
    this.details = args.details ?? [];
    this.correlationId = args.correlationId;
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isValidation(): boolean {
    return this.status === 400 || this.status === 422;
  }

  isRateLimited(): boolean {
    return this.status === 429;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}
