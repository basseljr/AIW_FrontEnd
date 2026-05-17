import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { TermsComponent } from './terms.component';

describe('TermsComponent', () => {
  it('renders', () => {
    TestBed.configureTestingModule({
      imports: [TermsComponent, TranslateModule.forRoot()],
    });
    const fixture = TestBed.createComponent(TermsComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.legal__title')).toBeTruthy();
  });
});
