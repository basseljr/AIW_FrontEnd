import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { LoyaltyService } from '../../core/services/loyalty.service';
import { LoyaltyComponent } from './loyalty.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

const SETTINGS_RESPONSE = { isEnabled: true, pointsName: 'Stars', earnRate: 10, redeemRate: 100, minRedeemPoints: 50 };

function buildFixture(settingsResponse = SETTINGS_RESPONSE) {
  const mockLoyalty = {
    getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsResponse)),
    updateSettings: jasmine.createSpy('updateSettings').and.returnValue(of(settingsResponse)),
  };

  TestBed.configureTestingModule({
    imports: [
      LoyaltyComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: LoyaltyService, useValue: mockLoyalty },
    ],
  });

  return { fixture: TestBed.createComponent(LoyaltyComponent), mockLoyalty };
}

describe('LoyaltyComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads settings on init', fakeAsync(() => {
    const { fixture, mockLoyalty } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockLoyalty.getSettings).toHaveBeenCalled();
    expect(fixture.componentInstance.earnRate).toBe(10);
    expect(fixture.componentInstance.redeemRate).toBe(100);
    expect(fixture.componentInstance.minRedeemPoints).toBe(50);
    expect(fixture.componentInstance.isEnabled).toBeTrue();
    expect(fixture.componentInstance.pointsName).toBe('Stars');
  }));

  it('featureDisabled defaults to false on successful load', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.featureDisabled()).toBeFalse();
  }));

  it('save() calls updateSettings with current values including isEnabled and pointsName', fakeAsync(() => {
    const { fixture, mockLoyalty } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.earnRate = 20;
    fixture.componentInstance.redeemRate = 200;
    fixture.componentInstance.minRedeemPoints = 100;
    fixture.componentInstance.isEnabled = false;
    fixture.componentInstance.pointsName = 'Gems';
    fixture.componentInstance.save();
    tick(3000);
    expect(mockLoyalty.updateSettings).toHaveBeenCalledWith({
      isEnabled: false,
      pointsName: 'Gems',
      earnRate: 20,
      redeemRate: 200,
      minRedeemPoints: 100,
    });
  }));

  it('pointsName defaults to "Points" when save is called with empty string', fakeAsync(() => {
    const { fixture, mockLoyalty } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.pointsName = '';
    fixture.componentInstance.save();
    tick(3000);
    const callArg = mockLoyalty.updateSettings.calls.mostRecent().args[0];
    expect(callArg.pointsName).toBe('Points');
  }));
});
