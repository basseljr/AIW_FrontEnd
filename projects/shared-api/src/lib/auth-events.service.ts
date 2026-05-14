import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type AuthEvent =
  | { type: 'refresh-failed' }
  | { type: 'unauthenticated' }
  | { type: 'session-expired' };

/**
 * Bus the auth interceptor uses to signal session-level state changes to
 * application code. Components subscribe (e.g., to navigate to the login page
 * when a silent refresh fails) instead of consuming HttpErrorResponse directly.
 */
@Injectable({ providedIn: 'root' })
export class AuthEventsService {
  private readonly events$ = new Subject<AuthEvent>();

  readonly stream$: Observable<AuthEvent> = this.events$.asObservable();

  emit(event: AuthEvent): void {
    this.events$.next(event);
  }
}
