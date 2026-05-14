import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Themed modal/dialog. Renders an overlay scrim and a centered panel; emits
 * `closed` when the user clicks the scrim, presses Escape, or clicks the
 * built-in close button. The host application owns the open/closed state via
 * `[open]` — this component is fully controlled, no internal toggle.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal="true"
 *   - Escape key closes (only when open)
 *   - aria-labelledby points at the title slot when provided
 *
 * Theming is via CSS custom properties from the active template; no hex
 * literals appear in this component.
 */
@Component({
  selector: 'ui-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open) {
      <div
        class="ui-modal__scrim"
        role="presentation"
        (click)="onScrimClick()"
      >
        <div
          class="ui-modal__panel"
          [class.ui-modal__panel--sm]="size === 'sm'"
          [class.ui-modal__panel--md]="size === 'md'"
          [class.ui-modal__panel--lg]="size === 'lg'"
          [class.ui-modal__panel--xl]="size === 'xl'"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="title ? 'ui-modal-title' : null"
          (click)="$event.stopPropagation()"
        >
          @if (title || showClose) {
            <header class="ui-modal__header">
              @if (title) {
                <h2 id="ui-modal-title" class="ui-modal__title">{{ title }}</h2>
              }
              @if (showClose) {
                <button
                  type="button"
                  class="ui-modal__close"
                  [attr.aria-label]="closeLabel"
                  (click)="emitClose()"
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              }
            </header>
          }
          <div class="ui-modal__body">
            <ng-content />
          </div>
          @if (footerContent) {
            <footer class="ui-modal__footer">
              <ng-content select="[modal-footer]" />
            </footer>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .ui-modal__scrim {
        position: fixed;
        inset: 0;
        background: var(--overlay-scrim);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        z-index: 1000;
        animation: ui-modal-fade var(--motion-base) ease;
      }
      .ui-modal__panel {
        background: var(--surface-elevated);
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        box-shadow: 0 24px 60px color-mix(in srgb, var(--text) 25%, transparent);
        display: flex;
        flex-direction: column;
        inline-size: 100%;
        max-block-size: 90vh;
        overflow: hidden;
        animation: ui-modal-pop var(--motion-base) ease;
      }
      .ui-modal__panel--sm {
        max-inline-size: 24rem;
      }
      .ui-modal__panel--md {
        max-inline-size: 32rem;
      }
      .ui-modal__panel--lg {
        max-inline-size: 48rem;
      }
      .ui-modal__panel--xl {
        max-inline-size: 64rem;
      }

      .ui-modal__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-block: 1rem;
        padding-inline: 1.25rem;
        border-block-end: 1px solid var(--border);
      }
      .ui-modal__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text);
      }
      .ui-modal__close {
        background: transparent;
        border: none;
        color: var(--text-muted);
        padding: 0.25rem;
        border-radius: var(--radius-control);
        cursor: pointer;
        display: inline-flex;
        line-height: 0;
      }
      .ui-modal__close:hover {
        color: var(--text);
        background: var(--surface-alt);
      }
      .ui-modal__close svg {
        inline-size: 1.125rem;
        block-size: 1.125rem;
      }

      .ui-modal__body {
        padding: 1.25rem;
        overflow-y: auto;
        flex: 1 1 auto;
      }
      .ui-modal__footer {
        padding-block: 0.875rem;
        padding-inline: 1.25rem;
        border-block-start: 1px solid var(--border);
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }

      @keyframes ui-modal-fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes ui-modal-pop {
        from {
          opacity: 0;
          transform: translateY(8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `,
  ],
})
export class ModalComponent {
  @Input() open = false;
  @Input() title?: string;
  @Input() size: ModalSize = 'md';
  @Input() showClose = true;
  @Input() closeOnScrim = true;
  @Input() closeOnEscape = true;
  @Input() closeLabel = 'Close';
  /**
   * Set to true when the consumer projects content into the
   * `[modal-footer]` slot so the footer container actually renders.
   */
  @Input() footerContent = false;

  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open && this.closeOnEscape) {
      this.emitClose();
    }
  }

  onScrimClick(): void {
    if (this.closeOnScrim) {
      this.emitClose();
    }
  }

  emitClose(): void {
    this.closed.emit();
  }
}
