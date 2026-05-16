import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { CartPageComponent } from './cart-page.component';
import { CartService } from '../../core/services/cart.service';
import { LanguageToggleService } from '@shared/i18n';
import { API_BASE_URL } from '@shared/api';

class FakeTranslateLoader {
  getTranslation() { return of({}); }
}

const mockLangToggle = {
  current: signal<'en' | 'ar'>('en'),
  isRtl: signal(false),
  toggle: () => {},
};

describe('CartPageComponent', () => {
  let component: CartPageComponent;
  let fixture: ComponentFixture<CartPageComponent>;
  let cartService: CartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CartPageComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeTranslateLoader } }),
      ],
      providers: [
        CartService,
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: API_BASE_URL, useValue: 'http://localhost' },
        { provide: LanguageToggleService, useValue: mockLangToggle },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartPageComponent);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    fixture.detectChanges();
  });

  it('renders without error', () => {
    expect(component).toBeTruthy();
  });

  it('shows empty state when no items', () => {
    expect(cartService.count()).toBe(0);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('ui-empty-state')).toBeTruthy();
  });

  it('shows items when cart has items', () => {
    cartService.addItem({
      itemId: 'item-1',
      slug: 'test',
      categorySlug: 'cat',
      nameEn: 'Test Item',
      nameAr: 'عنصر تجريبي',
      price: 2.5,
      quantity: 1,
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.sf-cart__item')).toBeTruthy();
  });

  it('lineTotal calculates correctly with modifiers', () => {
    const item = {
      itemId: 'i1',
      slug: 's',
      categorySlug: 'c',
      nameEn: 'N',
      nameAr: 'ن',
      price: 2,
      quantity: 3,
      selectedModifiers: [{ groupId: 'g', groupNameEn: 'G', groupNameAr: 'ج', optionId: 'o', optionNameEn: 'O', optionNameAr: 'أ', price: 0.5 }],
    };
    expect(component.lineTotal(item)).toBeCloseTo(7.5, 2);
  });
});
