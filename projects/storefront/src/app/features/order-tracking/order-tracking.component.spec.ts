import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { OrderTrackingComponent } from './order-tracking.component';
import { OrderTrackingService } from '../../core/services/order-tracking.service';
import { LanguageToggleService } from '@shared/i18n';

class FakeTranslateLoader {
  getTranslation() { return of({}); }
}

const mockLangToggle = {
  current: signal<'en' | 'ar'>('en'),
  isRtl: signal(false),
  toggle: () => {},
};

describe('OrderTrackingComponent', () => {
  let component: OrderTrackingComponent;
  let fixture: ComponentFixture<OrderTrackingComponent>;

  const mockTrackingService = {
    connectionState$: of('connecting' as const),
    status$: of(null),
    connect: jasmine.createSpy('connect').and.returnValue(Promise.resolve()),
    disconnect: jasmine.createSpy('disconnect').and.returnValue(Promise.resolve()),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrderTrackingComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeTranslateLoader } }),
      ],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: LanguageToggleService, useValue: mockLangToggle },
        { provide: OrderTrackingService, useValue: mockTrackingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders without error', () => {
    expect(component).toBeTruthy();
  });

  it('calls connect on init with orderId and token', () => {
    expect(mockTrackingService.connect).toHaveBeenCalledWith('', '');
  });

  it('calls disconnect on destroy', () => {
    fixture.destroy();
    expect(mockTrackingService.disconnect).toHaveBeenCalled();
  });

  it('shows tracking content area', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.sf-tracking')).toBeTruthy();
  });
});
