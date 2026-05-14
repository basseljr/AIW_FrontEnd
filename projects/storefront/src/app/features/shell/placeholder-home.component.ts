import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Placeholder rendered at /:lang/home until M33 wires the actual restaurant /
 * retail / service home pages. This component exists solely to give the SSR
 * server a valid Angular route to render so build and curl tests work in M32.
 */
@Component({
  selector: 'sf-placeholder-home',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sf-placeholder">
      <div class="sf-placeholder__inner">
        <p class="sf-placeholder__label">M32 — SSR Shell</p>
        <h1 class="sf-placeholder__heading">Content pages land in M33</h1>
        <p class="sf-placeholder__body">
          The storefront shell (header, footer, SSR, i18n, theming) is complete.
          Restaurant, retail and service template pages will be wired up next.
        </p>
      </div>
    </section>
  `,
  styles: [
    `
      .sf-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        min-block-size: 70vh;
        padding-inline: 1.5rem;
        background: var(--color-background, #fff8f1);
      }
      .sf-placeholder__inner {
        text-align: center;
        max-inline-size: 32rem;
      }
      .sf-placeholder__label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-primary, #805600);
        margin-block-end: 0.75rem;
      }
      .sf-placeholder__heading {
        font-size: clamp(1.5rem, 4vw, 2.5rem);
        font-weight: 800;
        color: var(--color-primary, #805600);
        margin-block-end: 1rem;
        letter-spacing: -0.03em;
      }
      .sf-placeholder__body {
        font-size: 1rem;
        color: var(--color-on-surface-variant, #514534);
        line-height: 1.7;
        margin: 0;
      }
    `,
  ],
})
export class PlaceholderHomeComponent {}
