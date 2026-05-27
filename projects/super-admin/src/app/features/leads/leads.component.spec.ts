import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { LeadsComponent } from './leads.component';
import { Lead } from '../../core/models/super-admin-api.models';
import { TestTranslateLoader } from '../../testing/test-translate-loader';

const makeLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: 'lead-1',
  name: 'Ahmed',
  email: 'a@b.com',
  phone: '+96599999999',
  businessName: 'Pizza Palace',
  businessType: 'restaurant',
  notes: null,
  status: 'new',
  source: 'website',
  assignedTo: null,
  assignedToName: 'Jane',
  daysInStage: 2,
  lostReason: null,
  createdAt: '2026-05-01T10:00:00Z',
  updatedAt: '2026-05-02T10:00:00Z',
  ...overrides,
});

describe('LeadsComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LeadsComponent,
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

  it('creates the component', () => {
    const fixture = TestBed.createComponent(LeadsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/leads').flush([]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads leads on init', () => {
    const fixture = TestBed.createComponent(LeadsComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/v1/admin/leads');
    req.flush([makeLead({ id: 'l1' }), makeLead({ id: 'l2', status: 'contacted' })]);
    expect(fixture.componentInstance.leads().length).toBe(2);
  });

  it('groups leads into columns by stage', () => {
    const fixture = TestBed.createComponent(LeadsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/leads').flush([
      makeLead({ id: 'l1', status: 'new' }),
      makeLead({ id: 'l2', status: 'new' }),
      makeLead({ id: 'l3', status: 'contacted' }),
    ]);
    const cols = fixture.componentInstance.columns();
    const newCol = cols.find((c) => c.stage === 'new');
    expect(newCol?.items.length).toBe(2);
    expect(cols.find((c) => c.stage === 'contacted')?.items.length).toBe(1);
  });

  it('filters list view by search', () => {
    const fixture = TestBed.createComponent(LeadsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/leads').flush([
      makeLead({ id: 'l1', businessName: 'Pizza Palace' }),
      makeLead({ id: 'l2', businessName: 'Burger Hut' }),
    ]);
    fixture.componentInstance.searchQuery.set('burger');
    expect(fixture.componentInstance.filteredList().length).toBe(1);
    expect(fixture.componentInstance.filteredList()[0].businessName).toBe('Burger Hut');
  });

  it('filters list view by stage', () => {
    const fixture = TestBed.createComponent(LeadsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/leads').flush([
      makeLead({ id: 'l1', status: 'new' }),
      makeLead({ id: 'l2', status: 'contacted' }),
    ]);
    fixture.componentInstance.stageFilter.set('contacted');
    expect(fixture.componentInstance.filteredList().length).toBe(1);
  });

  it('toggles between kanban and list view', () => {
    const fixture = TestBed.createComponent(LeadsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/leads').flush([]);
    fixture.componentInstance.setView('list');
    expect(fixture.componentInstance.view()).toBe('list');
    fixture.componentInstance.setView('kanban');
    expect(fixture.componentInstance.view()).toBe('kanban');
  });
});
