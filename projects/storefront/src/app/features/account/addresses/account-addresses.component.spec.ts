import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccountAddressesComponent } from './account-addresses.component';
import { AccountService } from '../../../core/services/account.service';
import { CustomerAddress } from '../../../core/models/auth.model';

const MOCK_ADDRESS: CustomerAddress = {
  id: 'a1',
  customerId: 'u1',
  label: 'Home',
  fullName: 'Alice',
  phone: '+96512345678',
  country: 'KW',
  governorate: 'Hawalli',
  street: '12',
  block: '5',
  building: null,
  apartment: null,
  area: 'Salmiya',
  city: 'Kuwait City',
  additionalInfo: null,
  lat: 0,
  lng: 0,
  isDefault: true,
};

describe('AccountAddressesComponent', () => {
  function createFixture(addresses: CustomerAddress[]) {
    const accountService = {
      getAddresses: jasmine.createSpy('getAddresses').and.returnValue(of(addresses)),
      createAddress: jasmine.createSpy('createAddress').and.returnValue(of(addresses[0])),
      updateAddress: jasmine.createSpy('updateAddress').and.returnValue(of(addresses[0])),
      deleteAddress: jasmine.createSpy('deleteAddress').and.returnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      imports: [AccountAddressesComponent, TranslateModule.forRoot()],
      providers: [{ provide: AccountService, useValue: accountService }],
    });

    const fixture = TestBed.createComponent(AccountAddressesComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders address list', () => {
    const fixture = createFixture([MOCK_ADDRESS]);
    fixture.detectChanges();
    const cards = fixture.debugElement.queryAll(By.css('.addr__card'));
    expect(cards.length).toBe(1);
    expect(cards[0].nativeElement.textContent).toContain('Home');
  });

  it('shows empty state when no addresses', () => {
    const fixture = createFixture([]);
    fixture.detectChanges();
    const empty = fixture.debugElement.query(By.css('.addr__empty'));
    expect(empty).toBeTruthy();
  });
});
