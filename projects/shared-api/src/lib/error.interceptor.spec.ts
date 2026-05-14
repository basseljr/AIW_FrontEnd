import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ApiError } from './api-error';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('normalizes a structured envelope error into ApiError with details', (done) => {
    http.get('/x').subscribe({
      next: () => done.fail(),
      error: (err: ApiError) => {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(422);
        expect(err.code).toBe('FIELD_REQUIRED');
        expect(err.message).toBe('Email is required');
        expect(err.details.length).toBe(1);
        expect(err.isValidation()).toBe(true);
        done();
      },
    });
    controller
      .expectOne('/x')
      .flush(
        { errors: [{ code: 'FIELD_REQUIRED', message: 'Email is required', field: 'email' }] },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
  });

  it('falls back to a network error message when status is 0', (done) => {
    http.get('/x').subscribe({
      next: () => done.fail(),
      error: (err: ApiError) => {
        expect(err.isNetworkError()).toBe(true);
        expect(err.code).toBe('NETWORK_ERROR');
        done();
      },
    });
    controller.expectOne('/x').error(new ProgressEvent('error'), { status: 0 });
  });

  it('normalizes a string-body 500 into a generic HTTP_500 ApiError', (done) => {
    http.get('/x').subscribe({
      next: () => done.fail(),
      error: (err: ApiError) => {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(500);
        expect(err.code).toBe('HTTP_500');
        expect(err.isServerError()).toBe(true);
        expect(err.details).toEqual([]);
        done();
      },
    });
    controller
      .expectOne('/x')
      .flush('catastrophic', { status: 500, statusText: 'Server Error' });
  });
});
