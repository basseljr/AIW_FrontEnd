import { ChangeDetectionStrategy, Component, Input, TemplateRef, contentChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { TableValuePipe } from './table-value.pipe';

export interface TableColumn<T = unknown> {
  /** Stable identifier used as the trackBy key for the column header row. */
  key: string;
  /** Translated column header text. */
  label: string;
  /**
   * Property path on the row used to render a default cell. Ignored when the
   * consumer supplies a custom `<ng-template #cell let-row let-col="col">`.
   */
  field?: keyof T & string;
  /** Optional CSS width — e.g. `'12rem'`, `'30%'`. */
  width?: string;
  /** Logical alignment: start (default), end, or center. RTL-safe. */
  align?: 'start' | 'end' | 'center';
}

/**
 * Themed data table. Consumers supply `columns` and `rows`; cells default to
 * `row[column.field]` but can be customized by projecting a template named
 * `cell`. Empty states are shown when rows.length is 0 unless `loading` is
 * true, in which case skeleton rows are rendered.
 */
@Component({
  selector: 'ui-table',
  standalone: true,
  imports: [NgTemplateOutlet, TableValuePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-table__scroll" role="region" [attr.aria-label]="ariaLabel || null">
      <table class="ui-table">
        <thead>
          <tr>
            @for (col of columns; track col.key) {
              <th
                scope="col"
                [style.width]="col.width || null"
                [class]="'ui-table__th ui-table__cell--' + (col.align || 'start')"
              >
                {{ col.label }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @if (loading) {
            @for (i of skeletonRows; track i) {
              <tr class="ui-table__row ui-table__row--skeleton">
                @for (col of columns; track col.key) {
                  <td [class]="'ui-table__td ui-table__cell--' + (col.align || 'start')">
                    <span class="ui-table__skeleton-bar"></span>
                  </td>
                }
              </tr>
            }
          } @else if (rows.length === 0) {
            <tr>
              <td [attr.colspan]="columns.length" class="ui-table__empty">
                {{ emptyMessage }}
              </td>
            </tr>
          } @else {
            @for (row of rows; track trackBy(row, $index)) {
              <tr class="ui-table__row">
                @for (col of columns; track col.key) {
                  <td [class]="'ui-table__td ui-table__cell--' + (col.align || 'start')">
                    @if (cellTemplate()) {
                      <ng-container
                        *ngTemplateOutlet="cellTemplate()!; context: { $implicit: row, col: col }"
                      />
                    } @else {
                      {{ col.field ? (row | tableValue: col.field) : '' }}
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ui-table__scroll {
        inline-size: 100%;
        overflow-x: auto;
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        background: var(--surface-elevated);
      }
      .ui-table {
        inline-size: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
        color: var(--text);
      }
      .ui-table__th {
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted);
        background: var(--surface-alt);
        padding-block: 0.75rem;
        padding-inline: 1rem;
        border-block-end: 1px solid var(--border);
      }
      .ui-table__td {
        padding-block: 0.875rem;
        padding-inline: 1rem;
        border-block-end: 1px solid var(--border);
        color: var(--text);
      }
      .ui-table__row:last-child .ui-table__td {
        border-block-end: none;
      }
      .ui-table__row:hover .ui-table__td {
        background: var(--surface-alt);
      }

      .ui-table__cell--start {
        text-align: start;
      }
      .ui-table__cell--end {
        text-align: end;
      }
      .ui-table__cell--center {
        text-align: center;
      }

      .ui-table__empty {
        text-align: center;
        padding-block: 3rem;
        color: var(--text-subtle);
        font-style: italic;
      }

      .ui-table__row--skeleton:hover .ui-table__td {
        background: transparent;
      }
      .ui-table__skeleton-bar {
        display: inline-block;
        inline-size: 70%;
        block-size: 0.875rem;
        border-radius: var(--radius-control);
        background: linear-gradient(
          90deg,
          var(--surface-alt) 0%,
          var(--border) 50%,
          var(--surface-alt) 100%
        );
        background-size: 200% 100%;
        animation: ui-table-shimmer 1.4s linear infinite;
      }
      @keyframes ui-table-shimmer {
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
export class TableComponent<T = unknown> {
  @Input() columns: TableColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No results';
  @Input() ariaLabel?: string;
  @Input() trackBy: (row: T, index: number) => unknown = (_row, index) => index;

  readonly cellTemplate = contentChild<TemplateRef<unknown>>('cell');
  readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);
}
