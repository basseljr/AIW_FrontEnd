import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Skeleton placeholder. Use for loading states where dimensions can be
 * predicted (avatar, line of text, card). Variants:
 *   - text: thin bar, default
 *   - block: full-height rectangle for image/card placeholders
 *   - circle: round, for avatars
 */
@Component({
  selector: 'ui-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="ui-skeleton"
      [class.ui-skeleton--text]="variant === 'text'"
      [class.ui-skeleton--block]="variant === 'block'"
      [class.ui-skeleton--circle]="variant === 'circle'"
      [style.inline-size]="width || null"
      [style.block-size]="height || null"
      role="status"
      aria-hidden="true"
    ></span>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ui-skeleton {
        display: block;
        background: linear-gradient(
          90deg,
          var(--surface-alt) 0%,
          var(--border) 50%,
          var(--surface-alt) 100%
        );
        background-size: 200% 100%;
        animation: ui-skeleton-shimmer 1.4s linear infinite;
        border-radius: var(--radius-control);
      }
      .ui-skeleton--text {
        block-size: 0.875rem;
        inline-size: 100%;
      }
      .ui-skeleton--block {
        inline-size: 100%;
        block-size: 8rem;
      }
      .ui-skeleton--circle {
        border-radius: 50%;
        inline-size: 2.5rem;
        block-size: 2.5rem;
      }
      @keyframes ui-skeleton-shimmer {
        from {
          background-position: 200% 0;
        }
        to {
          background-position: -200% 0;
        }
      }
    `,
  ],
})
export class SkeletonComponent {
  @Input() variant: 'text' | 'block' | 'circle' = 'text';
  @Input() width?: string;
  @Input() height?: string;
}
