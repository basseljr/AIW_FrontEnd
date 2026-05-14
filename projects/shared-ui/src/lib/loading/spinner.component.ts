import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Indeterminate loading indicator. Color follows `currentColor` so the spinner
 * inherits whatever text color it's placed inside — works on light or dark
 * backgrounds without a separate "dark mode" prop.
 */
@Component({
  selector: 'ui-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="ui-spinner"
      [class.ui-spinner--sm]="size === 'sm'"
      [class.ui-spinner--md]="size === 'md'"
      [class.ui-spinner--lg]="size === 'lg'"
      [attr.aria-label]="ariaLabel || null"
      [attr.role]="ariaLabel ? 'status' : null"
    ></span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
      }
      .ui-spinner {
        display: inline-block;
        border-radius: 50%;
        border: 2px solid currentColor;
        border-block-end-color: transparent;
        animation: ui-spinner-rotate var(--motion-slow) linear infinite;
      }
      .ui-spinner--sm {
        inline-size: 0.875rem;
        block-size: 0.875rem;
      }
      .ui-spinner--md {
        inline-size: 1.25rem;
        block-size: 1.25rem;
      }
      .ui-spinner--lg {
        inline-size: 2rem;
        block-size: 2rem;
        border-width: 3px;
      }
      @keyframes ui-spinner-rotate {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() ariaLabel?: string;
}
