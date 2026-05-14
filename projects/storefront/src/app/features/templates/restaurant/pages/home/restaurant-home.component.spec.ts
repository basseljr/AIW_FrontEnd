import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { LanguageToggleService, SupportedLang } from '@shared/i18n';
import { TenantConfigService } from '../../../../../core/services/tenant-config.service';
import { SeoService } from '../../../../../core/services/seo.service';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { CartService } from '../../../../../core/services/cart.service';
import { DEFAULT_DEV_TENANT } from '../../../../../core/models/tenant-config.model';
import { RestaurantHomeComponent } from './restaurant-home.component';
import { CatalogItem } from '../../../../../core/models/catalog.model';

class MockLoader implements TranslateLoader {
  getTranslation() {
    return of({
      home: {
        hero_badge: 'Authentic Flavors',
        hero_title: 'A Sensory Journey',
        hero_subtitle: 'Experience the finest fusion.',
        order_now: 'Order Now',
        view_menu: 'View Menu',
        view_all_dishes: 'View All Dishes',
        popular_dishes: 'Popular Dishes',
        popular_dishes_sub: 'Our most-loved dishes.',
        what_makes_us_special: 'What Makes Us Special',
        special_subtitle: 'Experience the difference.',
        fresh_ingredients: 'Fresh Ingredients',
        fresh_ingredients_desc: 'Farm fresh.',
        fast_delivery: 'Fast Delivery',
        fast_delivery_desc: 'Hot food fast.',
        premium_quality: 'Premium Quality',
        premium_quality_desc: 'Every dish crafted.',
        open_now: 'Open',
      },
      catalog: { view_item: 'View Item', out_of_stock: 'Out of Stock', add_to_cart: 'Add to Cart', free: 'Free' },
      common: { currency: 'KD' },
      nav: { menu: 'Menu' },
    });
  }
}

const mockItems: CatalogItem[] = [
  {
    id: '1',
    slug: 'shawarma',
    categoryId: 'c1',
    categorySlug: 'mains',
    categoryNameEn: 'Mains',
    categoryNameAr: 'الرئيسية',
    nameEn: 'Shawarma',
    nameAr: 'شاورما',
    price: 2.5,
    isAvailable: true,
    isPublished: true,
  },
];

function buildFixture(featuredItems = mockItems) {
  const mockLang = signal<SupportedLang>('en');
  const mockConfig = signal(DEFAULT_DEV_TENANT);
  const mockCatalog = {
    getFeaturedItems: jasmine.createSpy('getFeaturedItems').and.returnValue(of(featuredItems)),
    getCategories: jasmine.createSpy('getCategories').and.returnValue(of([])),
  };
  const mockSeo = { setPageMeta: jasmine.createSpy('setPageMeta') };

  TestBed.configureTestingModule({
    imports: [
      RestaurantHomeComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      provideRouter([]),
      { provide: TenantConfigService, useValue: { config: mockConfig.asReadonly(), isReady: signal(true).asReadonly() } },
      { provide: LanguageToggleService, useValue: { current: mockLang.asReadonly(), isRtl: signal(false).asReadonly() } },
      { provide: SeoService, useValue: mockSeo },
      { provide: CatalogService, useValue: mockCatalog },
      CartService,
    ],
  });

  const fixture = TestBed.createComponent(RestaurantHomeComponent);
  fixture.detectChanges();
  return { fixture, mockCatalog, mockSeo };
}

describe('RestaurantHomeComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders hero CTA', () => {
    const { fixture } = buildFixture();
    const btn = fixture.nativeElement.querySelector('.sf-home-hero__btn--primary');
    expect(btn).toBeTruthy();
    // Button renders translate key or translated text — just check element exists and has text
    expect(btn.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('calls getFeaturedItems', () => {
    const { mockCatalog } = buildFixture();
    expect(mockCatalog.getFeaturedItems).toHaveBeenCalledTimes(1);
  });

  it('shows skeleton while loading', () => {
    const { fixture } = buildFixture();
    // Manually set loading back to true to verify skeleton renders
    fixture.componentInstance.loading.set(true);
    fixture.componentInstance.featuredItems.set([]);
    fixture.detectChanges();

    const skeletons = fixture.nativeElement.querySelectorAll('.sf-home-dishes__skeleton-card');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows featured items after load', () => {
    const { fixture } = buildFixture();
    const cards = fixture.nativeElement.querySelectorAll('sf-restaurant-menu-item-card');
    expect(cards.length).toBe(mockItems.length);
  });
});
