import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'db-stat-widget',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-stat">
      <div class="db-stat__icon-wrap" [style.background]="iconBg">
        <span class="db-stat__icon" aria-hidden="true">{{ icon }}</span>
      </div>
      <div class="db-stat__body">
        <p class="db-stat__label">{{ labelKey | translate }}</p>
        <p class="db-stat__value">{{ value }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .db-stat {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: box-shadow var(--motion-base);
      }

      .db-stat:hover {
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.07);
      }

      .db-stat__icon-wrap {
        flex-shrink: 0;
        inline-size: 3rem;
        block-size: 3rem;
        border-radius: var(--radius-control);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.375rem;
      }

      .db-stat__body {
        flex: 1;
        min-inline-size: 0;
      }

      .db-stat__label {
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin: 0 0 0.25rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .db-stat__value {
        font-size: 1.625rem;
        font-weight: 700;
        color: var(--text);
        margin: 0;
        letter-spacing: -0.03em;
        line-height: 1.2;
      }
    `,
  ],
})
export class StatWidgetComponent {
  @Input({ required: true }) labelKey!: string;
  @Input({ required: true }) value!: string;
  @Input({ required: true }) icon!: string;
  @Input() iconBg = 'color-mix(in srgb, var(--accent) 10%, transparent)';
}
