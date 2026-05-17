import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AccountDataComponent } from './account-data.component';
import { LanguageToggleService } from '@shared/i18n';
import { API_BASE_URL } from '@shared/api';

describe('AccountDataComponent', () => {
  it('renders', () => {
    TestBed.configureTestingModule({
      imports: [AccountDataComponent, TranslateModule.forRoot(), HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: LanguageToggleService, useValue: { current: signal('en'), isRtl: signal(false) } },
      ],
    });
    const fixture = TestBed.createComponent(AccountDataComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.acct-data__title')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.acct-data__download-btn')).toBeTruthy();
  });
});
