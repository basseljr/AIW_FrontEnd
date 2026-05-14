import { TestBed } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';
import { SkeletonComponent } from './skeleton.component';
import { EmptyStateComponent } from './empty-state.component';

describe('SpinnerComponent', () => {
  it('renders with default md size and no aria-label', () => {
    const fixture = TestBed.configureTestingModule({ imports: [SpinnerComponent] }).createComponent(
      SpinnerComponent,
    );
    fixture.detectChanges();
    const span: HTMLElement = fixture.nativeElement.querySelector('.ui-spinner');
    expect(span.classList).toContain('ui-spinner--md');
    expect(span.getAttribute('aria-label')).toBeNull();
  });

  it('exposes role="status" when aria-label is provided', () => {
    const fixture = TestBed.configureTestingModule({ imports: [SpinnerComponent] }).createComponent(
      SpinnerComponent,
    );
    fixture.componentRef.setInput('ariaLabel', 'Loading');
    fixture.detectChanges();
    const span: HTMLElement = fixture.nativeElement.querySelector('.ui-spinner');
    expect(span.getAttribute('role')).toBe('status');
    expect(span.getAttribute('aria-label')).toBe('Loading');
  });
});

describe('SkeletonComponent', () => {
  it('applies variant class', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [SkeletonComponent],
    }).createComponent(SkeletonComponent);
    fixture.componentRef.setInput('variant', 'circle');
    fixture.detectChanges();
    const span: HTMLElement = fixture.nativeElement.querySelector('.ui-skeleton');
    expect(span.classList).toContain('ui-skeleton--circle');
  });
});

describe('EmptyStateComponent', () => {
  it('renders title and description when provided', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).createComponent(EmptyStateComponent);
    fixture.componentRef.setInput('title', 'No items');
    fixture.componentRef.setInput('description', 'Add one to get started.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-empty__title').textContent.trim()).toBe(
      'No items',
    );
    expect(fixture.nativeElement.querySelector('.ui-empty__description').textContent.trim()).toBe(
      'Add one to get started.',
    );
  });
});
