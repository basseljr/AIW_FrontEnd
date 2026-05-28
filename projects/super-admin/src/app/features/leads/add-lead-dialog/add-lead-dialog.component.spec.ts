import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { AddLeadDialogComponent } from './add-lead-dialog.component';
import { Lead } from '../../../core/models/super-admin-api.models';
import { TestTranslateLoader } from '../../../testing/test-translate-loader';

const makeLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: 'lead-new',
  name: 'Sara',
  email: 'sara@example.com',
  phone: '+96599000000',
  businessName: 'Café Bloom',
  businessType: 'restaurant',
  notes: null,
  status: 'new',
  source: 'website',
  assignedTo: null,
  assignedToName: null,
  daysInStage: 0,
  lostReason: null,
  createdAt: '2026-05-27T10:00:00Z',
  updatedAt: '2026-05-27T10:00:00Z',
  ...overrides,
});

describe('AddLeadDialogComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AddLeadDialogComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
      ],
      providers: [{ provide: API_BASE_URL, useValue: '/api/v1' }],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the component', () => {
    const fixture = TestBed.createComponent(AddLeadDialogComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('form is invalid when empty', () => {
    const fixture = TestBed.createComponent(AddLeadDialogComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.invalid).toBeTrue();
  });

  it('submit() marks all fields touched when form is invalid', () => {
    const fixture = TestBed.createComponent(AddLeadDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.form.controls.businessName.touched).toBeTrue();
    expect(fixture.componentInstance.form.controls.name.touched).toBeTrue();
    expect(fixture.componentInstance.form.controls.email.touched).toBeTrue();
  });

  it('submit() does not POST when form is invalid', () => {
    const fixture = TestBed.createComponent(AddLeadDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.submit();
    const reqs = httpMock.match('/api/v1/admin/leads');
    expect(reqs.length).toBe(0);
  });

  it('submit() POSTs and emits saved on success', (done) => {
    const fixture = TestBed.createComponent(AddLeadDialogComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    comp.form.setValue({
      businessName: 'Café Bloom',
      name: 'Sara',
      email: 'sara@example.com',
      phone: '+96599000000',
      businessType: 'restaurant',
      source: 'website',
      notes: '',
    });

    comp.saved.subscribe((lead: Lead) => {
      expect(lead.id).toBe('lead-new');
      done();
    });

    comp.submit();
    expect(comp.saving()).toBeTrue();

    const req = httpMock.expectOne('/api/v1/admin/leads');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.businessName).toBe('Café Bloom');
    req.flush(makeLead());
  });

  it('submit() sets serverError on API failure', () => {
    const fixture = TestBed.createComponent(AddLeadDialogComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    comp.form.setValue({
      businessName: 'Test Co',
      name: 'Ali',
      email: 'ali@test.com',
      phone: '+96512345678',
      businessType: 'retail',
      source: 'referral',
      notes: '',
    });

    comp.submit();

    httpMock.expectOne('/api/v1/admin/leads').flush(
      { message: 'Server error' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(comp.serverError()).toBeTrue();
    expect(comp.saving()).toBeFalse();
  });

  it('omits empty notes from POST body', () => {
    const fixture = TestBed.createComponent(AddLeadDialogComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    comp.form.setValue({
      businessName: 'Test Co',
      name: 'Ali',
      email: 'ali@test.com',
      phone: '+96512345678',
      businessType: 'retail',
      source: 'cold',
      notes: '',
    });

    comp.submit();

    const req = httpMock.expectOne('/api/v1/admin/leads');
    expect(req.request.body.notes).toBeUndefined();
    req.flush(makeLead({ businessName: 'Test Co' }));
  });

  it('emits close when backdrop is clicked', () => {
    const fixture = TestBed.createComponent(AddLeadDialogComponent);
    fixture.detectChanges();

    let closedEmitted = false;
    fixture.componentInstance.close.subscribe(() => { closedEmitted = true; });

    const backdropEl = fixture.nativeElement.querySelector('.sa-dialog-backdrop') as HTMLElement;
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: backdropEl });
    fixture.componentInstance.onBackdropClick(event);

    expect(closedEmitted).toBeTrue();
  });

  it('email validator rejects invalid email', () => {
    const fixture = TestBed.createComponent(AddLeadDialogComponent);
    fixture.detectChanges();
    const ctrl = fixture.componentInstance.form.controls.email;
    ctrl.setValue('not-an-email');
    expect(ctrl.errors?.['email']).toBeTruthy();
  });
});
