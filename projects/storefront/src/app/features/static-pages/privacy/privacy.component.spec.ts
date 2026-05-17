import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  it('renders', () => {
    TestBed.configureTestingModule({
      imports: [PrivacyComponent, TranslateModule.forRoot()],
    });
    const fixture = TestBed.createComponent(PrivacyComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.legal__title')).toBeTruthy();
  });
});
