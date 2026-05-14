import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  it('renders with default primary variant', () => {
    const fixture = TestBed.configureTestingModule({ imports: [ButtonComponent] }).createComponent(
      ButtonComponent,
    );
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.classList).toContain('ui-btn--primary');
    expect(btn.classList).toContain('ui-btn--md');
    expect(btn.disabled).toBe(false);
  });

  it('disables when loading is true and sets aria-busy', () => {
    const fixture = TestBed.configureTestingModule({ imports: [ButtonComponent] }).createComponent(
      ButtonComponent,
    );
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.ui-btn__spinner')).toBeTruthy();
  });

  it('applies variant and size classes', () => {
    const fixture = TestBed.configureTestingModule({ imports: [ButtonComponent] }).createComponent(
      ButtonComponent,
    );
    fixture.componentRef.setInput('variant', 'danger');
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('fullWidth', true);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.classList).toContain('ui-btn--danger');
    expect(btn.classList).toContain('ui-btn--lg');
    expect(btn.classList).toContain('ui-btn--full');
  });
});
