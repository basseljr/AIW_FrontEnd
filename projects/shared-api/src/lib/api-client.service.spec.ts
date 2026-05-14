import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { provideApiBaseUrl } from './api-base-url.token';
import { ApiClient } from './api-client.service';

describe('ApiClient', () => {
  let client: ApiClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiBaseUrl('http://test/api/v1'),
        ApiClient,
      ],
    });
    client = TestBed.inject(ApiClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('prefixes paths with API_BASE_URL and unwraps the envelope', (done) => {
    client.get<number[]>('/products').subscribe((data) => {
      expect(data).toEqual([1, 2, 3]);
      done();
    });
    const req = controller.expectOne('http://test/api/v1/products');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ data: [1, 2, 3] });
  });

  it('skips null/undefined query params', (done) => {
    client.get('/x', { params: { a: 1, b: null, c: undefined, d: 'hi' } }).subscribe(() => done());
    const req = controller.expectOne((r) => r.url === 'http://test/api/v1/x');
    expect(req.request.params.get('a')).toBe('1');
    expect(req.request.params.has('b')).toBe(false);
    expect(req.request.params.has('c')).toBe(false);
    expect(req.request.params.get('d')).toBe('hi');
    req.flush({ data: null });
  });

  it('passes absolute URLs through untouched', (done) => {
    client.get('https://other.example/raw').subscribe(() => done());
    const req = controller.expectOne('https://other.example/raw');
    expect(req.request.url).toBe('https://other.example/raw');
    req.flush({ data: null });
  });
});
