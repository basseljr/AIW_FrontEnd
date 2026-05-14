import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

/**
 * Composable form-field wrapper. Provides label, hint text, and error display
 * around any input control (input/textarea/select/native) projected via
 * `<ng-content>`. Used together with the matching `uiInput` / `uiTextarea` /
 * `uiSelect` directives so the control inherits the themed input styles.
 *
 * Reactive Forms friendly: pass `[invalid]` and `[error]` from the parent
 * binding to the FormControl's state. The component itself does not subscribe
 * to FormControl — keeps it dumb and reusable.
 */
@Component({
  selector: 'ui-form-field',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="ui-field" [ngClass]="{ 'ui-field--invalid': invalid }">
      @if (label) {
        <span class="ui-field__label">
          {{ label }}
          @if (required) {
            <span class="ui-field__required" aria-hidden="true">*</span>
          }
        </span>
      }
      <ng-content />
      @if (hint && !invalid) {
        <span class="ui-field__hint">{{ hint }}</span>
      }
      @if (invalid && error) {
        <span class="ui-field__error" role="alert">{{ error }}</span>
      }
    </label>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ui-field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        font-size: 0.875rem;
      }
      .ui-field__label {
        color: var(--text);
        font-weight: 500;
        font-size: 0.8125rem;
      }
      .ui-field__required {
        color: var(--danger);
        margin-inline-start: 0.125rem;
      }
      .ui-field__hint {
        color: var(--text-subtle);
        font-size: 0.75rem;
      }
      .ui-field__error {
        color: var(--danger);
        font-size: 0.75rem;
      }
    `,
  ],
})
export class FormFieldComponent {
  @Input() label?: string;
  @Input() hint?: string;
  @Input() error?: string;
  @Input() invalid = false;
  @Input() required = false;
}
