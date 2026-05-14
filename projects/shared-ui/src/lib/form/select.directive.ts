import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: 'select[uiSelect]',
  standalone: true,
})
export class SelectDirective {
  @HostBinding('class.ui-input') readonly hostInputClass = true;
  @HostBinding('class.ui-input--select') readonly hostSelectClass = true;
}
