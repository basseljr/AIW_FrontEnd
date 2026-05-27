import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { JobsComponent } from './jobs.component';
import { TestTranslateLoader } from '../../testing/test-translate-loader';

describe('JobsComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        JobsComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
      ],
      providers: [{ provide: API_BASE_URL, useValue: '/api/v1' }],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('loads job summary and failures', () => {
    const fixture = TestBed.createComponent(JobsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/jobs').flush({
      summary: { enqueued: 1, processing: 0, succeeded: 100, failed: 2, servers: 1 },
      failed: [
        {
          id: 'j-1', name: 'DailyBilling', queue: 'default', state: 'failed',
          enqueuedAt: '2026-05-23T00:00:00Z', startedAt: null,
          failedAt: '2026-05-23T00:01:00Z', exceptionMessage: 'Boom',
        },
      ],
    });
    expect(fixture.componentInstance.summary()?.failed).toBe(2);
    expect(fixture.componentInstance.failed().length).toBe(1);
  });

  it('retry POSTs to retry endpoint', () => {
    const fixture = TestBed.createComponent(JobsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/jobs').flush({
      summary: { enqueued: 0, processing: 0, succeeded: 0, failed: 1, servers: 1 },
      failed: [{
        id: 'j-1', name: 'X', queue: 'default', state: 'failed',
        enqueuedAt: '2026-05-23T00:00:00Z', startedAt: null,
        failedAt: '2026-05-23T00:01:00Z', exceptionMessage: '',
      }],
    });
    fixture.componentInstance.retry(fixture.componentInstance.failed()[0]);
    const retryReq = httpMock.expectOne('/api/v1/admin/jobs/j-1/retry');
    expect(retryReq.request.method).toBe('POST');
    retryReq.flush(null, { status: 204, statusText: '' });
    const refreshReq = httpMock.expectOne('/api/v1/admin/jobs');
    expect(refreshReq.request.method).toBe('GET');
    refreshReq.flush({
      summary: { enqueued: 0, processing: 0, succeeded: 0, failed: 0, servers: 1 }, failed: [],
    });
  });
});
