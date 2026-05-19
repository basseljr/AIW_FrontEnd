import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { NotificationHubService } from '../../../core/services/notification-hub.service';

@Component({
  selector: 'db-notification-bell',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-notif" [attr.aria-label]="'topbar.notifications' | translate">
      <button
        class="db-notif__btn"
        type="button"
        [attr.aria-label]="'topbar.notifications' | translate"
        [attr.aria-expanded]="open"
        (click)="toggleOpen()"
      >
        <svg class="db-notif__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        @if (hub.unreadCount() > 0) {
          <span class="db-notif__badge" aria-hidden="true">
            {{ hub.unreadCount() > 99 ? '99+' : hub.unreadCount() }}
          </span>
        }
      </button>

      @if (open) {
        <div class="db-notif__panel" role="region" [attr.aria-label]="'topbar.notifications' | translate">
          <div class="db-notif__panel-header">
            <span class="db-notif__panel-title">{{ 'topbar.notifications' | translate }}</span>
            @if (hub.unreadCount() > 0) {
              <button class="db-notif__mark-read" type="button" (click)="markAllRead()">
                {{ 'topbar.mark_all_read' | translate }}
              </button>
            }
          </div>

          <div class="db-notif__list">
            @if (hub.notifications().length === 0) {
              <p class="db-notif__empty">{{ 'topbar.no_notifications' | translate }}</p>
            } @else {
              @for (n of hub.notifications(); track n.id) {
                <div class="db-notif__item" [class.db-notif__item--unread]="!n.isRead">
                  <p class="db-notif__item-title">
                    {{ lang() === 'ar' ? n.titleAr : n.titleEn }}
                  </p>
                  <p class="db-notif__item-body">
                    {{ lang() === 'ar' ? n.bodyAr : n.bodyEn }}
                  </p>
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .db-notif {
        position: relative;
      }

      .db-notif__btn {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 2.25rem;
        block-size: 2.25rem;
        border: none;
        background: transparent;
        color: var(--text-muted);
        border-radius: var(--radius-control);
        cursor: pointer;
        transition: background-color var(--motion-fast);
      }

      .db-notif__btn:hover {
        background: var(--surface-alt);
        color: var(--text);
      }

      .db-notif__badge {
        position: absolute;
        inset-block-start: 2px;
        inset-inline-end: 2px;
        min-inline-size: 1rem;
        block-size: 1rem;
        padding-inline: 0.25rem;
        background: var(--danger);
        color: var(--on-accent);
        font-size: 0.625rem;
        font-weight: 700;
        border-radius: var(--radius-pill);
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }

      .db-notif__panel {
        position: absolute;
        inset-block-start: calc(100% + 0.5rem);
        inset-inline-end: 0;
        inline-size: 22rem;
        max-block-size: 28rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12);
        overflow: hidden;
        z-index: 200;
        display: flex;
        flex-direction: column;
      }

      .db-notif__panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem 0.75rem;
        border-block-end: 1px solid var(--border);
      }

      .db-notif__panel-title {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text);
      }

      .db-notif__mark-read {
        font-size: 0.8125rem;
        color: var(--accent);
        background: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
        padding: 0;
      }

      .db-notif__mark-read:hover {
        text-decoration: underline;
      }

      .db-notif__list {
        overflow-y: auto;
        flex: 1;
      }

      .db-notif__empty {
        padding: 2rem 1.25rem;
        text-align: center;
        color: var(--text-subtle);
        font-size: 0.875rem;
        margin: 0;
      }

      .db-notif__item {
        padding: 0.875rem 1.25rem;
        border-block-end: 1px solid var(--border);
        transition: background-color var(--motion-fast);
      }

      .db-notif__item:last-child {
        border-block-end: none;
      }

      .db-notif__item:hover {
        background: var(--surface-alt);
      }

      .db-notif__item--unread {
        border-inline-start: 3px solid var(--accent);
        background: color-mix(in srgb, var(--accent) 4%, transparent);
      }

      .db-notif__item-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text);
        margin: 0 0 0.25rem;
      }

      .db-notif__item-body {
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin: 0;
      }
    `,
  ],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly hub = inject(NotificationHubService);
  readonly lang = inject(LanguageToggleService).current;

  open = false;

  ngOnInit(): void {
    this.hub.connect();
  }

  ngOnDestroy(): void {
    this.hub.disconnect();
  }

  toggleOpen(): void {
    this.open = !this.open;
  }

  markAllRead(): void {
    this.hub.markAllRead();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const el = event.target as HTMLElement;
    if (!el.closest('db-notification-bell')) {
      this.open = false;
    }
  }
}
