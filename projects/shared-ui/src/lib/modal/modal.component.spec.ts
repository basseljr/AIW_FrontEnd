import { TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  function build(): ReturnType<typeof TestBed.createComponent<ModalComponent>> {
    return TestBed.configureTestingModule({ imports: [ModalComponent] }).createComponent(
      ModalComponent,
    );
  }

  it('renders nothing when open is false', () => {
    const fixture = build();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-modal__scrim')).toBeNull();
  });

  it('renders the panel when open is true', () => {
    const fixture = build();
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Confirm');
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.ui-modal__panel');
    expect(panel).toBeTruthy();
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
  });

  it('emits closed when the close button is clicked', () => {
    const fixture = build();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.closed.subscribe(() => (emitted = true));

    const closeBtn = fixture.nativeElement.querySelector('.ui-modal__close') as HTMLButtonElement;
    closeBtn.click();
    expect(emitted).toBe(true);
  });

  it('emits closed when Escape is pressed', () => {
    const fixture = build();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.closed.subscribe(() => (emitted = true));

    fixture.componentInstance.onEscape();
    expect(emitted).toBe(true);
  });

  it('does not emit closed on Escape when closeOnEscape is false', () => {
    const fixture = build();
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('closeOnEscape', false);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.closed.subscribe(() => (emitted = true));

    fixture.componentInstance.onEscape();
    expect(emitted).toBe(false);
  });
});
