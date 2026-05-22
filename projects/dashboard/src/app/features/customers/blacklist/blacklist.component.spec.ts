import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { CustomersService } from '../../../core/services/customers.service';
import { BlacklistComponent } from './blacklist.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

function buildFixture() {
  const mockCustomers = {
    getBlacklist: jasmine.createSpy('getBlacklist').and.returnValue(of([])),
    addToBlacklist: jasmine.createSpy('addToBlacklist').and.returnValue(of({})),
    removeFromBlacklist: jasmine.createSpy('removeFromBlacklist').and.returnValue(of(void 0)),
  };

  TestBed.configureTestingModule({
    imports: [
      BlacklistComponent,
      RouterTestingModule,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: CustomersService, useValue: mockCustomers },
    ],
  });

  return { fixture: TestBed.createComponent(BlacklistComponent), mockCustomers };
}

describe('BlacklistComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads blacklist on init', fakeAsync(() => {
    const { fixture, mockCustomers } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockCustomers.getBlacklist).toHaveBeenCalled();
  }));

  it('items() starts empty', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.items().length).toBe(0);
  }));
});
