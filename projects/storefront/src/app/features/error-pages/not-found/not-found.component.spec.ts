import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { LanguageToggleService, SupportedLang } from '@shared/i18n';
import { NotFoundComponent } from './not-found.component';

class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      shell: {
        not_found: {
          title: 'Page Not Found',
          subtitle: '404',
          description: "We couldn't find what you were looking for.",
          go_home: 'Go to Homepage',
        },
      },
    });
  }
}

describe('NotFoundComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NotFoundComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockTranslateLoader } }),
      ],
      providers: [
        provideRouter([]),
        {
          provide: LanguageToggleService,
          useValue: {
            current: signal<SupportedLang>('en').asReadonly(),
            isRtl: signal(false).asReadonly(),
            toggle: jasmine.createSpy(),
            set: jasmine.createSpy(),
            supported: ['en', 'ar'] as const,
            initialize: jasmine.createSpy(),
          },
        },
      ],
    });
  });

  it('renders the 404 subtitle and title', async () => {
    const translate = TestBed.inject(TranslateService);
    await translate.use('en').toPromise();

    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sf-404__code')?.textContent?.trim()).toContain('404');
    expect(fixture.nativeElement.querySelector('.sf-404__title')?.textContent?.trim()).toContain('Page Not Found');
  });

  it('renders a home link', () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
    const cta = fixture.nativeElement.querySelector('.sf-404__cta');
    expect(cta).toBeTruthy();
  });
});
