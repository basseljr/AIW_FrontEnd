import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'sf-privacy',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legal">
      <div class="legal__inner">
        <header class="legal__header">
          <h1 class="legal__title">{{ 'privacy.title' | translate }}</h1>
          <p class="legal__subtitle">{{ 'privacy.subtitle' | translate }}</p>
        </header>
        <div class="legal__content">
          <section class="legal__section">
            <h2 class="legal__section-title">{{ 'privacy.collection' | translate }}</h2>
            <p class="legal__body">{{ 'privacy.collection_text' | translate }}</p>
          </section>
          <section class="legal__section">
            <h2 class="legal__section-title">{{ 'privacy.use' | translate }}</h2>
            <p class="legal__body">{{ 'privacy.use_text' | translate }}</p>
          </section>
          <section class="legal__section">
            <h2 class="legal__section-title">{{ 'privacy.sharing' | translate }}</h2>
            <p class="legal__body">{{ 'privacy.sharing_text' | translate }}</p>
          </section>
          <section class="legal__section">
            <h2 class="legal__section-title">{{ 'privacy.rights' | translate }}</h2>
            <p class="legal__body">{{ 'privacy.rights_text' | translate }}</p>
          </section>
          <section class="legal__section">
            <h2 class="legal__section-title">{{ 'privacy.contact' | translate }}</h2>
            <p class="legal__body">{{ 'privacy.contact_text' | translate }}</p>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .legal {
      background: var(--color-background, #fff8f1);
      min-block-size: 70vh;
      padding-block: 3rem;
      padding-inline: 1.5rem;
    }
    .legal__inner {
      max-inline-size: 52rem;
      margin-inline: auto;
    }
    .legal__header { margin-block-end: 2.5rem; }
    .legal__title {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 800;
      color: var(--color-primary, #805600);
      margin: 0 0 0.5rem;
      letter-spacing: -0.02em;
    }
    .legal__subtitle {
      font-size: 0.9375rem;
      color: var(--color-on-surface, #1e1b17);
      opacity: 0.6;
      margin: 0;
    }
    .legal__content { display: flex; flex-direction: column; gap: 0; }
    .legal__section {
      border-block-end: 1px solid var(--color-outline-variant, #d6c4ad);
      padding-block: 1.5rem;
    }
    .legal__section:last-child { border-block-end: none; }
    .legal__section-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--color-on-surface, #1e1b17);
      margin: 0 0 0.625rem;
    }
    .legal__body {
      font-size: 0.9375rem;
      color: var(--color-on-surface, #1e1b17);
      opacity: 0.8;
      line-height: 1.75;
      margin: 0;
    }
  `],
})
export class PrivacyComponent {}
