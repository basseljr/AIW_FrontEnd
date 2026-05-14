import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageToggleService } from '@shared/i18n';
import { inject } from '@angular/core';

/**
 * Platform-level 404 page.  Rendered by the SSR server when the Host header
 * does not resolve to any known tenant domain, or when Angular's router hits
 * the wildcard catch-all route.
 *
 * Uses generic platform branding (not tenant branding) because there is no
 * resolved tenant.
 */
@Component({
  selector: 'sf-not-found',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="sf-404" id="main-content" role="main">
      <div class="sf-404__inner">
        <div class="sf-404__code" aria-hidden="true">
          {{ 'shell.not_found.subtitle' | translate }}
        </div>
        <h1 class="sf-404__title">{{ 'shell.not_found.title' | translate }}</h1>
        <p class="sf-404__desc">{{ 'shell.not_found.description' | translate }}</p>
        <a class="sf-404__cta" [routerLink]="['/', lang(), '']">
          {{ 'shell.not_found.go_home' | translate }}
        </a>
      </div>
    </main>
  `,
  styles: [
    `
      .sf-404 {
        min-block-size: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-inline: 1.5rem;
        background: var(--color-background, #fff8f1);
        font-family: var(--font-family-primary, 'Inter', sans-serif);
      }
      .sf-404__inner {
        text-align: center;
        max-inline-size: 36rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      .sf-404__code {
        font-size: clamp(5rem, 15vw, 8rem);
        font-weight: 900;
        line-height: 1;
        color: var(--color-primary, #805600);
        opacity: 0.18;
        letter-spacing: -0.06em;
      }
      .sf-404__title {
        font-size: clamp(1.5rem, 4vw, 2.25rem);
        font-weight: 800;
        color: var(--color-primary, #805600);
        margin: 0;
        letter-spacing: -0.03em;
      }
      .sf-404__desc {
        font-size: 1rem;
        color: var(--color-on-surface-variant, #514534);
        line-height: 1.7;
        margin: 0;
      }
      .sf-404__cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding-block: 0.75rem;
        padding-inline: 2rem;
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        border-radius: var(--border-radius-full, 9999px);
        font-size: 0.9375rem;
        font-weight: 700;
        text-decoration: none;
        margin-block-start: 0.5rem;
        transition: background-color 0.2s;
      }
      .sf-404__cta:hover {
        background: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }
    `,
  ],
})
export class NotFoundComponent {
  private readonly langToggle = inject(LanguageToggleService);
  readonly lang = this.langToggle.current;
}
