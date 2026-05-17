import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageToggleService } from '@shared/i18n';
import { API_BASE_URL } from '@shared/api';

@Component({
  selector: 'sf-account-data',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="acct-data">
      <h1 class="acct-data__title">{{ 'account.data_title' | translate }}</h1>

      <!-- Download section -->
      <div class="acct-data__card">
        <div class="acct-data__card-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <div class="acct-data__card-body">
          <h2 class="acct-data__card-title">{{ 'account.data_download_title' | translate }}</h2>
          <p class="acct-data__card-desc">{{ 'account.data_download_desc' | translate }}</p>

          @if (downloadSuccess()) {
            <div class="acct-data__success" role="status">
              {{ 'account.data_download_success' | translate }}
            </div>
          } @else if (downloadError()) {
            <div class="acct-data__error" role="alert">{{ downloadError() | translate }}</div>
          }
        </div>
        <button
          class="acct-data__download-btn"
          type="button"
          [disabled]="downloading()"
          (click)="downloadData()"
        >
          @if (downloading()) {
            {{ 'account.data_downloading' | translate }}
          } @else {
            {{ 'account.data_download_btn' | translate }}
          }
        </button>
      </div>

      <!-- Delete section -->
      <div class="acct-data__card acct-data__card--danger">
        <div class="acct-data__card-icon acct-data__card-icon--danger" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <div class="acct-data__card-body">
          <h2 class="acct-data__card-title">{{ 'account.data_delete_title' | translate }}</h2>
          <p class="acct-data__card-desc">{{ 'account.data_delete_desc' | translate }}</p>
        </div>
        <a
          class="acct-data__delete-link"
          [routerLink]="['/', lang(), 'account', 'settings']"
        >
          {{ 'account.data_delete_link' | translate }}
        </a>
      </div>
    </div>
  `,
  styles: [`
    .acct-data { padding-block-end: 2rem; }
    .acct-data__title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-on-surface, #1e1b17);
      margin-block-end: 1.5rem;
      letter-spacing: -0.02em;
    }
    .acct-data__card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      background: #fff;
      border: 1px solid var(--color-outline-variant, #d6c4ad);
      border-radius: var(--border-radius-md, 8px);
      padding: 1.5rem;
      margin-block-end: 1rem;
      flex-wrap: wrap;
    }
    .acct-data__card--danger {
      border-color: #fecaca;
      background: #fef2f2;
    }
    .acct-data__card-icon {
      inline-size: 2.5rem;
      block-size: 2.5rem;
      border-radius: 50%;
      background: var(--color-surface-container, #f4ede5);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--color-primary);
    }
    .acct-data__card-icon--danger {
      background: #fecaca;
      color: var(--color-error, #dc2626);
    }
    .acct-data__card-icon svg {
      inline-size: 1.25rem;
      block-size: 1.25rem;
    }
    .acct-data__card-body { flex: 1; min-inline-size: 0; }
    .acct-data__card-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-on-surface, #1e1b17);
      margin: 0 0 0.375rem;
    }
    .acct-data__card-desc {
      font-size: 0.875rem;
      color: var(--color-on-surface, #1e1b17);
      opacity: 0.7;
      line-height: 1.6;
      margin: 0;
    }
    .acct-data__success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
      border-radius: var(--border-radius-md, 8px);
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
      margin-block-start: 0.75rem;
    }
    .acct-data__error {
      background: #fef2f2;
      color: var(--color-error, #dc2626);
      border: 1px solid #fecaca;
      border-radius: var(--border-radius-md, 8px);
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
      margin-block-start: 0.75rem;
    }
    .acct-data__download-btn {
      background: var(--color-primary);
      color: var(--color-on-primary, #fff);
      border: none;
      border-radius: var(--border-radius-full, 9999px);
      font-size: 0.875rem;
      font-weight: 700;
      padding-block: 0.625rem;
      padding-inline: 1.5rem;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }
    .acct-data__download-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .acct-data__download-btn:not(:disabled):hover { opacity: 0.9; }
    .acct-data__delete-link {
      display: inline-block;
      color: var(--color-error, #dc2626);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      border: 1.5px solid var(--color-error, #dc2626);
      border-radius: var(--border-radius-full, 9999px);
      padding-block: 0.5rem;
      padding-inline: 1.25rem;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background-color 0.2s;
    }
    .acct-data__delete-link:hover { background: #fecaca; }
  `],
})
export class AccountDataComponent {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly langToggle = inject(LanguageToggleService);

  readonly lang = this.langToggle.current;
  readonly downloading = signal(false);
  readonly downloadSuccess = signal(false);
  readonly downloadError = signal('');

  downloadData(): void {
    this.downloading.set(true);
    this.downloadError.set('');
    this.downloadSuccess.set(false);

    this.http
      .get(`${this.baseUrl}/storefront/account/data-export`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.downloading.set(false);
          this.downloadSuccess.set(true);
        },
        error: () => {
          this.downloading.set(false);
          this.downloadError.set('errors.generic');
        },
      });
  }
}
