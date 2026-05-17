import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AccountLoyaltyComponent } from './account-loyalty.component';

describe('AccountLoyaltyComponent', () => {
  it('renders', () => {
    TestBed.configureTestingModule({
      imports: [AccountLoyaltyComponent, TranslateModule.forRoot()],
    });
    const fixture = TestBed.createComponent(AccountLoyaltyComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loyalty__title')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.loyalty__balance-card')).toBeTruthy();
  });
});
