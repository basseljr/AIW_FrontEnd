import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Themable button. All visual values come from CSS custom properties defined
 * on `:root` or the template body class (template-restaurant / -retail / -service),
 * so the same component renders differently per template without code changes.
 *
 * Variants:
 *   - primary: accent background, on-accent text
 *   - secondary: surface-elevated background, border + text
 *   - ghost: transparent, text only
 *   - danger: danger background, on-accent text
 */
@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [attr.aria-busy]="loading || null"
      [ngClass]="['ui-btn', 'ui-btn--' + variant, 'ui-btn--' + size, fullWidth ? 'ui-btn--full' : '']"
    >
      @if (loading) {
        <span class="ui-btn__spinner" aria-hidden="true"></span>
      }
      <span class="ui-btn__content" [class.ui-btn__content--hidden]="loading">
        <ng-content />
      </span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .ui-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        position: relative;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        border-radius: var(--radius-control);
        border: 1px solid transparent;
        transition: background-color var(--motion-base) ease, border-color var(--motion-base) ease,
          color var(--motion-base) ease, transform var(--motion-fast) ease;
        white-space: nowrap;
        text-decoration: none;
      }
      .ui-btn:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      .ui-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .ui-btn:not(:disabled):active {
        transform: translateY(1px);
      }

      .ui-btn--sm {
        font-size: 0.8125rem;
        padding-block: 0.4375rem;
        padding-inline: 0.875rem;
      }
      .ui-btn--md {
        font-size: 0.875rem;
        padding-block: 0.625rem;
        padding-inline: 1.25rem;
      }
      .ui-btn--lg {
        font-size: 0.9375rem;
        padding-block: 0.8125rem;
        padding-inline: 1.75rem;
      }
      .ui-btn--full {
        inline-size: 100%;
      }

      .ui-btn--primary {
        background: var(--accent);
        color: var(--on-accent);
      }
      .ui-btn--primary:not(:disabled):hover {
        background: var(--accent-hover);
      }

      .ui-btn--secondary {
        background: var(--surface-elevated);
        color: var(--text);
        border-color: var(--border);
      }
      .ui-btn--secondary:not(:disabled):hover {
        border-color: var(--border-strong);
        background: var(--surface-alt);
      }

      .ui-btn--ghost {
        background: transparent;
        color: var(--text-muted);
      }
      .ui-btn--ghost:not(:disabled):hover {
        color: var(--text);
        background: var(--surface-alt);
      }

      .ui-btn--danger {
        background: var(--danger);
        color: var(--on-accent);
      }
      .ui-btn--danger:not(:disabled):hover {
        filter: brightness(0.92);
      }

      .ui-btn__spinner {
        position: absolute;
        inset-block-start: 50%;
        inset-inline-start: 50%;
        inline-size: 1rem;
        block-size: 1rem;
        margin-block-start: -0.5rem;
        margin-inline-start: -0.5rem;
        border: 2px solid currentColor;
        border-block-end-color: transparent;
        border-radius: 50%;
        animation: ui-btn-spin var(--motion-slow) linear infinite;
      }
      .ui-btn__content--hidden {
        visibility: hidden;
      }

      @keyframes ui-btn-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
}
