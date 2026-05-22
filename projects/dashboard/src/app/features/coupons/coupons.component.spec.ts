import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { CouponsService } from '../../core/services/coupons.service';
import { CouponsComponent } from './coupons.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

const MOCK_COUPON = {
  id: 'cp1',
  code: 'SAVE20',
  discountType: 'percentage' as const,
  discountValue: 20,
  minOrderAmount: 5,
  maxUses: null,
  usedCount: 3,
  validFrom: null,
  validUntil: null,
  isActive: true,
  appliesTo: 'all',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

function buildFixture() {
  const mockCoupons = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of([MOCK_COUPON])),
    create: jasmine.createSpy('create').and.returnValue(of(MOCK_COUPON)),
    update: jasmine.createSpy('update').and.returnValue(of(MOCK_COUPON)),
    delete: jasmine.createSpy('delete').and.returnValue(of(void 0)),
    toggle: jasmine.createSpy('toggle').and.returnValue(of({ ...MOCK_COUPON, isActive: false })),
  };

  TestBed.configureTestingModule({
    imports: [
      CouponsComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: CouponsService, useValue: mockCoupons },
    ],
  });

  return { fixture: TestBed.createComponent(CouponsComponent), mockCoupons };
}

describe('CouponsComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads coupons on init', fakeAsync(() => {
    const { fixture, mockCoupons } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockCoupons.getAll).toHaveBeenCalled();
    expect(fixture.componentInstance.allCoupons().length).toBe(1);
  }));

  it('openAdd() sets showForm to true', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.openAdd();
    expect(fixture.componentInstance.showForm()).toBeTrue();
  }));

  it('couponStatus() returns active for active non-expired coupon', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.couponStatus(MOCK_COUPON)).toBe('active');
  }));

  it('couponStatus() returns paused for inactive coupon', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    const inactive = { ...MOCK_COUPON, isActive: false };
    expect(fixture.componentInstance.couponStatus(inactive)).toBe('paused');
  });

  it('formatValue() formats percentage correctly', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    expect(fixture.componentInstance.formatValue(MOCK_COUPON)).toBe('20%');
  });
});
