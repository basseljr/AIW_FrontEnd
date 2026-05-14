import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Empty-state slot. Shows a centered icon (optional), title, description, and
 * an action area (project a button via `<ng-content>`). Used in list pages
 * when filters yield zero results and as the "no orders yet" / "no products"
 * fallback on dashboard tables.
 */
@Component({
  selector: 'ui-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-empty">
      @if (icon) {
        <div class="ui-empty__icon" aria-hidden="true">{{ icon }}</div>
      }
      @if (title) {
        <h3 class="ui-empty__title">{{ title }}</h3>
      }
      @if (description) {
        <p class="ui-empty__description">{{ description }}</p>
      }
      <div class="ui-empty__actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ui-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding-block: 3rem;
        padding-inline: 1.5rem;
        gap: 0.5rem;
        color: var(--text-muted);
      }
      .ui-empty__icon {
        font-size: 2.5rem;
        color: var(--text-subtle);
        margin-block-end: 0.25rem;
      }
      .ui-empty__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text);
      }
      .ui-empty__description {
        margin: 0;
        font-size: 0.875rem;
        max-inline-size: 28rem;
      }
      .ui-empty__actions {
        margin-block-start: 0.75rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        justify-content: center;
      }
      .ui-empty__actions:empty {
        display: none;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() title?: string;
  @Input() description?: string;
  @Input() icon?: string;
}
