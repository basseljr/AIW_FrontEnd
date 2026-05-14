import { Directive, HostBinding } from '@angular/core';

/**
 * Attribute directive that themes a native `<input>`. Used as `<input uiInput
 * formControlName="...">`. Keeps focus on Angular's native form integration
 * (FormsModule, ReactiveFormsModule) — no custom ControlValueAccessor needed,
 * which means existing Angular forms patterns just work.
 */
@Directive({
  selector: 'input[uiInput]',
  standalone: true,
})
export class InputDirective {
  @HostBinding('class.ui-input') readonly hostClass = true;
}
