import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: 'textarea[uiTextarea]',
  standalone: true,
})
export class TextareaDirective {
  @HostBinding('class.ui-input') readonly hostInputClass = true;
  @HostBinding('class.ui-input--textarea') readonly hostTextareaClass = true;
}
