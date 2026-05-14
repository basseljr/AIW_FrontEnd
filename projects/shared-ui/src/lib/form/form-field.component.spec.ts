import { TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';

describe('FormFieldComponent', () => {
  function build(): ReturnType<typeof TestBed.createComponent<FormFieldComponent>> {
    return TestBed.configureTestingModule({ imports: [FormFieldComponent] }).createComponent(
      FormFieldComponent,
    );
  }

  it('renders the label when provided', () => {
    const fixture = build();
    fixture.componentRef.setInput('label', 'Email');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.ui-field__label').textContent.trim(),
    ).toContain('Email');
  });

  it('shows the required asterisk when required is true', () => {
    const fixture = build();
    fixture.componentRef.setInput('label', 'Email');
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-field__required')).toBeTruthy();
  });

  it('shows the error message when invalid', () => {
    const fixture = build();
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('error', 'Required');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-field__error').textContent.trim()).toBe(
      'Required',
    );
    expect(fixture.nativeElement.querySelector('.ui-field__hint')).toBeNull();
  });

  it('shows the hint when valid and no error is shown', () => {
    const fixture = build();
    fixture.componentRef.setInput('hint', 'We never share your email.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-field__hint').textContent.trim()).toBe(
      'We never share your email.',
    );
  });
});
