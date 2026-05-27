import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { HealthComponent } from './health.component';
import { TestTranslateLoader } from '../../testing/test-translate-loader';

describe('HealthComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HealthComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
      ],
      providers: [
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('hits /admin/system-health on init', () => {
    const fixture = TestBed.createComponent(HealthComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/v1/admin/system-health');
    expect(req.request.method).toBe('GET');
    req.flush({
      services: [{ service: 'API', status: 'healthy', uptime30d: 0.9997, lastIncident: null }],
      performance: {
        apiP50: 80, apiP95: 200, apiP99: 500, requestsPerMinute: 1200, errorRate: 0.4,
        activeConnections: 42, redisHitRate: 98.5, dbConnectionUtilization: 45,
      },
      jobs: { enqueued: 0, processing: 1, succeeded: 100, failed: 2, servers: 1 },
      checkedAt: '2026-05-23T10:00:00Z',
    });
    fixture.componentInstance.ngOnDestroy();
  });

  it('maps service status to color classes', () => {
    const fixture = TestBed.createComponent(HealthComponent);
    expect(fixture.componentInstance.statusColor('healthy')).toBe('sa-health__dot--healthy');
    expect(fixture.componentInstance.statusColor('degraded')).toBe('sa-health__dot--warn');
    expect(fixture.componentInstance.statusColor('down')).toBe('sa-health__dot--down');
    fixture.componentInstance.ngOnDestroy();
  });
});
