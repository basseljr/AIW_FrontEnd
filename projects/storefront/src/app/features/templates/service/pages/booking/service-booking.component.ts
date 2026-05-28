import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DecimalPipe, SlicePipe, UpperCasePipe } from '@angular/common';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent } from '@shared/ui';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { CatalogItemDetail } from '../../../../../core/models/catalog.model';
import {
  BookingService,
  StaffMember,
  TimeSlot,
  AvailabilityResponse,
} from '../../../../../core/services/booking.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { BranchesService } from '../../../../../core/services/branches.service';

// ── Booking state ────────────────────────────────────────────────────────────

export interface BookingState {
  service: CatalogItemDetail | null;
  branchId: string | null;
  serviceId: string | null;
  selectedStaffId: string | null;    // null = "no preference"
  selectedDate: string | null;       // YYYY-MM-DD
  selectedSlot: TimeSlot | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  notes: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

@Component({
  selector: 'sf-service-booking',
  standalone: true,
  imports: [FormsModule, TranslateModule, DecimalPipe, SlicePipe, UpperCasePipe, SkeletonComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bk">
      <!-- ── Header ── -->
      <div class="bk__header">
        <div class="bk__header-inner">
          <a class="bk__back-link" [routerLink]="['/', lang(), 'services', serviceSlug]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>
            {{ 'booking.back' | translate }}
          </a>
          <h1 class="bk__title">{{ 'nav.bookings' | translate }}</h1>
        </div>
      </div>

      <!-- ── Step indicator ── -->
      <div class="bk__steps" role="list">
        @for (s of stepLabels; track $index) {
          <div
            class="bk__step"
            [class.bk__step--active]="currentStep() === ($index + 1)"
            [class.bk__step--done]="currentStep() > ($index + 1)"
            role="listitem"
            [attr.aria-current]="currentStep() === ($index + 1) ? 'step' : null"
          >
            <span class="bk__step-num" aria-hidden="true">{{ $index + 1 }}</span>
            <span class="bk__step-label">{{ s | translate }}</span>
          </div>
        }
      </div>

      <!-- ── Content area ── -->
      <div class="bk__content">

        <!-- ── STEP 1 — Service Summary ── -->
        @if (currentStep() === 1) {
          <section class="bk__section" aria-labelledby="step1-heading">
            <h2 id="step1-heading" class="bk__section-title">{{ 'booking.step_service' | translate }}</h2>

            @if (loadingService()) {
              <div class="bk__service-card bk__service-card--skeleton">
                <ui-skeleton variant="block" height="200px" />
                <div class="bk__service-card-body">
                  <ui-skeleton variant="text" width="60%" />
                  <ui-skeleton variant="text" width="40%" />
                  <ui-skeleton variant="text" />
                </div>
              </div>
            } @else if (bookingState().service) {
              <div class="bk__service-card">
                @if (bookingState().service!.imageUrl) {
                  <img
                    class="bk__service-img"
                    [src]="bookingState().service!.imageUrl"
                    [alt]="lang() === 'ar' ? bookingState().service!.nameAr : bookingState().service!.nameEn"
                    loading="eager"
                    width="600"
                    height="200"
                  />
                }
                <div class="bk__service-card-body">
                  <h3 class="bk__service-name">
                    {{ lang() === 'ar' ? bookingState().service!.nameAr : bookingState().service!.nameEn }}
                  </h3>
                  <div class="bk__service-meta">
                    @if (bookingState().service!.durationMinutes) {
                      <span class="bk__meta-pill">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {{ 'item_detail.minutes' | translate: { count: bookingState().service!.durationMinutes } }}
                      </span>
                    }
                    <span class="bk__meta-pill bk__meta-pill--price">
                      {{ bookingState().service!.price | number: '1.3-3' }} {{ 'common.currency' | translate }}
                    </span>
                  </div>
                  @if (bookingState().service!.descriptionEn || bookingState().service!.descriptionAr) {
                    <p class="bk__service-desc">
                      {{ lang() === 'ar' ? bookingState().service!.descriptionAr : bookingState().service!.descriptionEn }}
                    </p>
                  }
                </div>
              </div>
            } @else {
              <p class="bk__error">{{ 'errors.not_found' | translate }}</p>
            }

            <div class="bk__actions">
              <button
                class="bk__btn bk__btn--primary"
                type="button"
                [disabled]="!bookingState().service"
                (click)="goToStep(2)"
              >
                {{ 'booking.next' | translate }} →
              </button>
            </div>
          </section>
        }

        <!-- ── STEP 2 — Choose Staff ── -->
        @if (currentStep() === 2) {
          <section class="bk__section" aria-labelledby="step2-heading">
            <h2 id="step2-heading" class="bk__section-title">{{ 'booking.choose_staff' | translate }}</h2>

            @if (loadingStaff()) {
              <div class="bk__staff-grid">
                @for (_ of skeletons; track $index) {
                  <div class="bk__staff-card bk__staff-card--skeleton">
                    <ui-skeleton variant="block" height="80px" width="80px" />
                    <ui-skeleton variant="text" width="70%" />
                    <ui-skeleton variant="text" width="50%" />
                  </div>
                }
              </div>
            } @else {
              <div class="bk__staff-grid">
                <!-- "No preference" option -->
                <button
                  class="bk__staff-card"
                  [class.bk__staff-card--selected]="bookingState().selectedStaffId === null"
                  type="button"
                  (click)="selectStaff(null)"
                  [attr.aria-pressed]="bookingState().selectedStaffId === null"
                >
                  <div class="bk__staff-avatar bk__staff-avatar--any" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  </div>
                  <div class="bk__staff-info">
                    <span class="bk__staff-name">{{ 'booking.no_preference' | translate }}</span>
                  </div>
                </button>

                @for (member of staffList(); track member.id) {
                  <button
                    class="bk__staff-card"
                    [class.bk__staff-card--selected]="bookingState().selectedStaffId === member.id"
                    type="button"
                    (click)="selectStaff(member.id)"
                    [attr.aria-pressed]="bookingState().selectedStaffId === member.id"
                  >
                    <div class="bk__staff-avatar">
                      @if (member.photoUrl) {
                        <img [src]="member.photoUrl" [alt]="lang() === 'ar' ? member.fullNameAr : member.fullNameEn" width="80" height="80" />
                      } @else {
                        <span aria-hidden="true">{{ avatarInitials(member) }}</span>
                      }
                    </div>
                    <div class="bk__staff-info">
                      <span class="bk__staff-name">{{ lang() === 'ar' ? member.fullNameAr : member.fullNameEn }}</span>
                      @if (member.jobTitleEn) {
                        <span class="bk__staff-title">{{ lang() === 'ar' ? member.jobTitleAr : member.jobTitleEn }}</span>
                      }
                    </div>
                  </button>
                }
              </div>
            }

            <div class="bk__actions">
              <button class="bk__btn bk__btn--ghost" type="button" (click)="goToStep(1)">← {{ 'booking.back' | translate }}</button>
              <button class="bk__btn bk__btn--primary" type="button" (click)="goToStep(3)">{{ 'booking.next' | translate }} →</button>
            </div>
          </section>
        }

        <!-- ── STEP 3 — Date & Time ── -->
        @if (currentStep() === 3) {
          <section class="bk__section" aria-labelledby="step3-heading">
            <h2 id="step3-heading" class="bk__section-title">{{ 'booking.choose_date' | translate }}</h2>

            <div class="bk__datetime-layout">
              <!-- Date picker -->
              <div class="bk__date-section">
                <label class="bk__label" for="booking-date">{{ 'booking.date_label' | translate }}</label>
                <input
                  id="booking-date"
                  class="bk__date-input"
                  type="date"
                  [min]="minDate"
                  [value]="bookingState().selectedDate ?? ''"
                  (change)="onDateChange($event)"
                />
              </div>

              <!-- Time slots -->
              @if (bookingState().selectedDate) {
                <div class="bk__time-section">
                  <p class="bk__label">{{ 'booking.choose_time' | translate }}</p>

                  @if (loadingSlots()) {
                    <div class="bk__slots-grid">
                      @for (_ of skeletons; track $index) {
                        <ui-skeleton variant="text" height="40px" />
                      }
                    </div>
                  } @else if (availableSlots().length === 0) {
                    <p class="bk__no-slots">{{ 'booking.slot_unavailable' | translate }}</p>
                  } @else {
                    <div class="bk__slots-grid" role="group" [attr.aria-label]="'booking.choose_time' | translate">
                      @for (slot of availableSlots(); track slot.startTime) {
                        <button
                          class="bk__slot"
                          [class.bk__slot--selected]="bookingState().selectedSlot?.startTime === slot.startTime"
                          type="button"
                          (click)="selectSlot(slot)"
                          [attr.aria-pressed]="bookingState().selectedSlot?.startTime === slot.startTime"
                        >
                          {{ formatTime(slot.startTime) }}
                        </button>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <div class="bk__actions">
              <button class="bk__btn bk__btn--ghost" type="button" (click)="goToStep(2)">← {{ 'booking.back' | translate }}</button>
              <button
                class="bk__btn bk__btn--primary"
                type="button"
                [disabled]="!bookingState().selectedSlot"
                (click)="goToStep(4)"
              >
                {{ 'booking.next' | translate }} →
              </button>
            </div>
          </section>
        }

        <!-- ── STEP 4 — Customer Details ── -->
        @if (currentStep() === 4) {
          <section class="bk__section" aria-labelledby="step4-heading">
            <h2 id="step4-heading" class="bk__section-title">{{ 'booking.step_details' | translate }}</h2>

            @if (isAuthenticated()) {
              <div class="bk__auth-notice" role="note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {{ currentUser()?.fullName }} · {{ currentUser()?.email }}
              </div>
            } @else {
              <div class="bk__form">
                <div class="bk__form-field">
                  <label class="bk__label" for="guest-name">{{ 'booking.your_name' | translate }} <span class="bk__required" aria-hidden="true">*</span></label>
                  <input
                    id="guest-name"
                    class="bk__input"
                    type="text"
                    autocomplete="name"
                    [placeholder]="'checkout.full_name_placeholder' | translate"
                    [(ngModel)]="guestName"
                    required
                  />
                </div>
                <div class="bk__form-field">
                  <label class="bk__label" for="guest-email">{{ 'booking.your_email' | translate }} <span class="bk__required" aria-hidden="true">*</span></label>
                  <input
                    id="guest-email"
                    class="bk__input"
                    type="email"
                    autocomplete="email"
                    [placeholder]="'checkout.email_placeholder' | translate"
                    [(ngModel)]="guestEmail"
                    required
                  />
                </div>
                <div class="bk__form-field">
                  <label class="bk__label" for="guest-phone">{{ 'booking.your_phone' | translate }} <span class="bk__required" aria-hidden="true">*</span></label>
                  <input
                    id="guest-phone"
                    class="bk__input"
                    type="tel"
                    autocomplete="tel"
                    placeholder="+965 XXXX XXXX"
                    [(ngModel)]="guestPhone"
                    required
                  />
                </div>
              </div>
            }

            <div class="bk__form-field" style="margin-block-start: 1rem">
              <label class="bk__label" for="booking-notes">{{ 'booking.your_notes' | translate }}</label>
              <textarea
                id="booking-notes"
                class="bk__textarea"
                rows="3"
                [placeholder]="'item_detail.special_instructions_placeholder' | translate"
                [(ngModel)]="notes"
              ></textarea>
            </div>

            <div class="bk__actions">
              <button class="bk__btn bk__btn--ghost" type="button" (click)="goToStep(3)">← {{ 'booking.back' | translate }}</button>
              <button
                class="bk__btn bk__btn--primary"
                type="button"
                [disabled]="!guestDetailsValid()"
                (click)="goToStep(5)"
              >
                {{ 'booking.next' | translate }} →
              </button>
            </div>
          </section>
        }

        <!-- ── STEP 5 — Confirm ── -->
        @if (currentStep() === 5) {
          <section class="bk__section" aria-labelledby="step5-heading">

            @if (bookingSuccess()) {
              <!-- Success state -->
              <div class="bk__success">
                <div class="bk__success-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h2 class="bk__success-title">{{ 'booking.booking_success' | translate }}</h2>
                <p class="bk__success-ref">
                  {{ 'booking.booking_ref' | translate }}:
                  <strong>{{ confirmedBookingId() | slice: 0 : 8 | uppercase }}</strong>
                </p>
                <a
                  class="bk__btn bk__btn--primary"
                  [routerLink]="['/', lang(), '']"
                  style="margin-block-start: 1.5rem; display: inline-flex;"
                >
                  {{ 'shell.not_found.go_home' | translate }}
                </a>
              </div>

            } @else {
              <!-- Summary -->
              <h2 id="step5-heading" class="bk__section-title">{{ 'booking.confirm_title' | translate }}</h2>

              <dl class="bk__summary">
                <div class="bk__summary-row">
                  <dt>{{ 'booking.step_service' | translate }}</dt>
                  <dd>{{ lang() === 'ar' ? bookingState().service?.nameAr : bookingState().service?.nameEn }}</dd>
                </div>
                <div class="bk__summary-row">
                  <dt>{{ 'item_detail.duration' | translate }}</dt>
                  <dd>{{ 'item_detail.minutes' | translate: { count: bookingState().service?.durationMinutes } }}</dd>
                </div>
                <div class="bk__summary-row">
                  <dt>{{ 'booking.step_staff' | translate }}</dt>
                  <dd>
                    @if (bookingState().selectedStaffId) {
                      {{ selectedStaffName() }}
                    } @else {
                      {{ 'booking.no_preference' | translate }}
                    }
                  </dd>
                </div>
                <div class="bk__summary-row">
                  <dt>{{ 'booking.date_label' | translate }}</dt>
                  <dd>{{ bookingState().selectedDate }}</dd>
                </div>
                <div class="bk__summary-row">
                  <dt>{{ 'booking.time_label' | translate }}</dt>
                  <dd>{{ formatTime(bookingState().selectedSlot?.startTime ?? '') }}</dd>
                </div>
                <div class="bk__summary-row">
                  <dt>{{ 'billing.col_amount' | translate }}</dt>
                  <dd>{{ bookingState().service?.price | number: '1.3-3' }} {{ 'common.currency' | translate }}</dd>
                </div>
                @if (isAuthenticated()) {
                  <div class="bk__summary-row">
                    <dt>{{ 'checkout.full_name' | translate }}</dt>
                    <dd>{{ currentUser()?.fullName }}</dd>
                  </div>
                  <div class="bk__summary-row">
                    <dt>{{ 'checkout.email' | translate }}</dt>
                    <dd>{{ currentUser()?.email }}</dd>
                  </div>
                } @else {
                  <div class="bk__summary-row">
                    <dt>{{ 'checkout.full_name' | translate }}</dt>
                    <dd>{{ guestName }}</dd>
                  </div>
                  <div class="bk__summary-row">
                    <dt>{{ 'checkout.email' | translate }}</dt>
                    <dd>{{ guestEmail }}</dd>
                  </div>
                  <div class="bk__summary-row">
                    <dt>{{ 'checkout.phone' | translate }}</dt>
                    <dd>{{ guestPhone }}</dd>
                  </div>
                }
                @if (notes) {
                  <div class="bk__summary-row">
                    <dt>{{ 'booking.your_notes' | translate }}</dt>
                    <dd>{{ notes }}</dd>
                  </div>
                }
              </dl>

              @if (bookingError()) {
                <p class="bk__error" role="alert">{{ bookingError() }}</p>
              }

              <div class="bk__actions">
                <button class="bk__btn bk__btn--ghost" type="button" [disabled]="submitting()" (click)="goToStep(4)">← {{ 'booking.back' | translate }}</button>
                <button
                  class="bk__btn bk__btn--primary"
                  type="button"
                  [disabled]="submitting()"
                  (click)="confirmBooking()"
                >
                  @if (submitting()) {
                    {{ 'common.saving' | translate }}
                  } @else {
                    {{ 'booking.confirm_booking' | translate }}
                  }
                </button>
              </div>
            }
          </section>
        }

      </div><!-- /bk__content -->
    </div><!-- /bk -->
  `,
  styles: [`
    /* ── Layout ─────────────────────────────────────────── */
    .bk {
      background: var(--color-background, #fff8f1);
      min-block-size: 100vh;
      font-family: inherit;
    }

    .bk__header {
      background: var(--color-surface, #ffffff);
      border-block-end: 1px solid var(--color-border, #e5e7eb);
      padding-block: 1rem;
      padding-inline: 1.5rem;
    }
    .bk__header-inner {
      max-inline-size: 56rem;
      margin-inline: auto;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .bk__back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--color-primary, #805600);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
    }
    .bk__back-link svg { inline-size: 1rem; block-size: 1rem; }
    .bk__back-link:hover { text-decoration: underline; }
    .bk__title {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--color-on-surface, #1e1b17);
      margin: 0;
    }

    /* ── Step indicator ──────────────────────────────────── */
    .bk__steps {
      display: flex;
      justify-content: center;
      gap: 0;
      padding-block: 1.25rem;
      padding-inline: 1.5rem;
      background: var(--color-surface, #ffffff);
      border-block-end: 1px solid var(--color-border, #e5e7eb);
      overflow-x: auto;
    }
    .bk__step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding-inline: 1rem;
      opacity: 0.4;
      transition: opacity 0.2s;
      position: relative;
    }
    .bk__step:not(:last-child)::after {
      content: '';
      position: absolute;
      inset-block-start: 0.75rem;
      inset-inline-end: 0;
      inline-size: 1px;
      block-size: 1.25rem;
      background: var(--color-border, #e5e7eb);
    }
    .bk__step--active, .bk__step--done { opacity: 1; }
    .bk__step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 1.75rem;
      block-size: 1.75rem;
      border-radius: 50%;
      background: var(--color-border, #e5e7eb);
      color: var(--color-text-secondary, #6b7280);
      font-size: 0.8125rem;
      font-weight: 700;
    }
    .bk__step--active .bk__step-num {
      background: var(--color-primary, #805600);
      color: var(--color-on-primary, #ffffff);
    }
    .bk__step--done .bk__step-num {
      background: var(--color-success, #16a34a);
      color: #ffffff;
    }
    .bk__step-label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--color-text-secondary, #6b7280);
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .bk__step--active .bk__step-label { color: var(--color-primary, #805600); }
    .bk__step--done .bk__step-label { color: var(--color-success, #16a34a); }

    /* ── Content ─────────────────────────────────────────── */
    .bk__content {
      max-inline-size: 56rem;
      margin-inline: auto;
      padding: 2rem 1.5rem;
    }

    .bk__section-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--color-on-surface, #1e1b17);
      margin: 0 0 1.5rem;
      letter-spacing: -0.02em;
    }

    /* ── Service card (step 1) ───────────────────────────── */
    .bk__service-card {
      background: var(--color-surface, #ffffff);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      margin-block-end: 1.5rem;
    }
    .bk__service-img { inline-size: 100%; block-size: 220px; object-fit: cover; display: block; }
    .bk__service-card-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .bk__service-name { font-size: 1.5rem; font-weight: 800; color: var(--color-on-surface, #1e1b17); margin: 0; letter-spacing: -0.02em; }
    .bk__service-desc { font-size: 0.9375rem; color: var(--color-on-surface-variant, #514534); line-height: 1.7; margin: 0; }
    .bk__service-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .bk__meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      font-weight: 600;
      padding-block: 0.25rem;
      padding-inline: 0.75rem;
      background: var(--color-surface-container, #f4ede5);
      color: var(--color-on-surface-variant, #514534);
      border-radius: 9999px;
    }
    .bk__meta-pill svg { inline-size: 0.9375rem; block-size: 0.9375rem; color: var(--color-primary, #805600); }
    .bk__meta-pill--price { background: color-mix(in srgb, var(--color-primary-container, #f2a922) 20%, transparent); color: var(--color-on-primary-container, #634100); font-size: 1rem; font-weight: 900; }

    /* ── Staff grid (step 2) ─────────────────────────────── */
    .bk__staff-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
      margin-block-end: 1.5rem;
    }
    .bk__staff-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.625rem;
      padding: 1.125rem 0.75rem;
      background: var(--color-surface, #ffffff);
      border: 2px solid var(--color-border, #e5e7eb);
      border-radius: 14px;
      cursor: pointer;
      font-family: inherit;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
      text-align: center;
    }
    .bk__staff-card:hover { border-color: var(--color-primary, #805600); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .bk__staff-card--selected {
      border-color: var(--color-primary, #805600);
      background: color-mix(in srgb, var(--color-primary, #805600) 8%, transparent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #805600) 20%, transparent);
    }
    .bk__staff-avatar {
      inline-size: 4rem;
      block-size: 4rem;
      border-radius: 50%;
      overflow: hidden;
      background: var(--color-surface-container, #f4ede5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-primary, #805600);
      flex-shrink: 0;
    }
    .bk__staff-avatar img { inline-size: 100%; block-size: 100%; object-fit: cover; }
    .bk__staff-avatar--any svg { inline-size: 2rem; block-size: 2rem; color: var(--color-primary, #805600); }
    .bk__staff-info { display: flex; flex-direction: column; gap: 0.25rem; align-items: center; }
    .bk__staff-name { font-size: 0.875rem; font-weight: 700; color: var(--color-on-surface, #1e1b17); }
    .bk__staff-title { font-size: 0.75rem; color: var(--color-on-surface-variant, #514534); }

    /* ── Date/Time (step 3) ──────────────────────────────── */
    .bk__datetime-layout { display: flex; flex-direction: column; gap: 1.5rem; margin-block-end: 1.5rem; }
    @media (min-width: 640px) { .bk__datetime-layout { flex-direction: row; align-items: flex-start; } }

    .bk__date-section { display: flex; flex-direction: column; gap: 0.5rem; }
    .bk__date-input {
      padding: 0.75rem 1rem;
      border: 1.5px solid var(--color-border, #e5e7eb);
      border-radius: 10px;
      font-size: 1rem;
      font-family: inherit;
      color: var(--color-on-surface, #1e1b17);
      background: var(--color-surface, #ffffff);
      inline-size: 100%;
      max-inline-size: 220px;
    }
    .bk__date-input:focus { outline: none; border-color: var(--color-primary, #805600); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #805600) 20%, transparent); }

    .bk__time-section { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
    .bk__slots-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .bk__slot {
      padding-block: 0.625rem;
      padding-inline: 1rem;
      border: 1.5px solid var(--color-border, #e5e7eb);
      border-radius: 9999px;
      background: var(--color-surface, #ffffff);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-on-surface, #1e1b17);
      cursor: pointer;
      font-family: inherit;
      transition: border-color 0.15s, background-color 0.15s;
    }
    .bk__slot:hover { border-color: var(--color-primary, #805600); }
    .bk__slot--selected {
      background: var(--color-primary, #805600);
      border-color: var(--color-primary, #805600);
      color: var(--color-on-primary, #ffffff);
    }
    .bk__no-slots { font-size: 0.9375rem; color: var(--color-on-surface-variant, #514534); }

    /* ── Details form (step 4) ───────────────────────────── */
    .bk__auth-notice {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: color-mix(in srgb, var(--color-primary, #805600) 8%, transparent);
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-primary, #805600);
      margin-block-end: 1rem;
    }
    .bk__auth-notice svg { inline-size: 1.25rem; block-size: 1.25rem; flex-shrink: 0; }
    .bk__form { display: flex; flex-direction: column; gap: 1rem; }
    .bk__form-field { display: flex; flex-direction: column; gap: 0.375rem; }
    .bk__label { font-size: 0.875rem; font-weight: 600; color: var(--color-on-surface, #1e1b17); }
    .bk__required { color: var(--color-error, #dc2626); }
    .bk__input, .bk__textarea {
      padding: 0.75rem 1rem;
      border: 1.5px solid var(--color-border, #e5e7eb);
      border-radius: 10px;
      font-size: 0.9375rem;
      font-family: inherit;
      color: var(--color-on-surface, #1e1b17);
      background: var(--color-surface, #ffffff);
      inline-size: 100%;
      box-sizing: border-box;
    }
    .bk__input:focus, .bk__textarea:focus {
      outline: none;
      border-color: var(--color-primary, #805600);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #805600) 20%, transparent);
    }
    .bk__textarea { resize: vertical; min-block-size: 80px; }

    /* ── Confirm summary (step 5) ────────────────────────── */
    .bk__summary {
      background: var(--color-surface, #ffffff);
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid var(--color-border, #e5e7eb);
      margin-block-end: 1.5rem;
    }
    .bk__summary-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1.25rem;
      border-block-end: 1px solid var(--color-border, #e5e7eb);
    }
    .bk__summary-row:last-child { border-block-end: none; }
    .bk__summary dt { font-size: 0.875rem; color: var(--color-text-secondary, #6b7280); }
    .bk__summary dd { font-size: 0.9375rem; font-weight: 600; color: var(--color-on-surface, #1e1b17); margin: 0; text-align: end; }

    /* ── Success state ───────────────────────────────────── */
    .bk__success {
      text-align: center;
      padding-block: 3rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .bk__success-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      inline-size: 5rem;
      block-size: 5rem;
      border-radius: 50%;
      background: color-mix(in srgb, var(--color-success, #16a34a) 12%, transparent);
      color: var(--color-success, #16a34a);
    }
    .bk__success-icon svg { inline-size: 2.5rem; block-size: 2.5rem; }
    .bk__success-title { font-size: 1.5rem; font-weight: 800; color: var(--color-on-surface, #1e1b17); margin: 0; }
    .bk__success-ref { font-size: 1rem; color: var(--color-text-secondary, #6b7280); margin: 0; }
    .bk__success-ref strong { color: var(--color-primary, #805600); font-size: 1.125rem; }

    /* ── Actions row ─────────────────────────────────────── */
    .bk__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-block-start: 1.5rem;
    }

    .bk__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding-block: 0.8125rem;
      padding-inline: 1.75rem;
      border-radius: 9999px;
      font-size: 0.9375rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: background-color 0.2s, color 0.2s, opacity 0.2s;
      text-decoration: none;
    }
    .bk__btn--primary {
      background: var(--color-primary, #805600);
      color: var(--color-on-primary, #ffffff);
      border: none;
    }
    .bk__btn--primary:hover:not(:disabled) { background: var(--color-primary-container, #f2a922); color: var(--color-on-primary-container, #634100); }
    .bk__btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .bk__btn--ghost {
      background: transparent;
      color: var(--color-primary, #805600);
      border: 1.5px solid var(--color-primary, #805600);
    }
    .bk__btn--ghost:hover { background: color-mix(in srgb, var(--color-primary, #805600) 8%, transparent); }
    .bk__btn--ghost:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Shared ──────────────────────────────────────────── */
    .bk__error {
      color: var(--color-error, #dc2626);
      font-size: 0.9375rem;
      background: color-mix(in srgb, var(--color-error, #dc2626) 8%, transparent);
      padding: 0.75rem 1rem;
      border-radius: 10px;
      margin-block: 0.75rem;
    }
  `],
})
export class ServiceBookingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly langToggle = inject(LanguageToggleService);
  private readonly catalogService = inject(CatalogService);
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);
  private readonly branchesService = inject(BranchesService);

  // ── Routing ────────────────────────────────────────────

  readonly lang = this.langToggle.current;
  serviceSlug = '';

  // ── Step state ─────────────────────────────────────────

  readonly currentStep = signal<WizardStep>(1);

  readonly stepLabels = [
    'booking.step_service',
    'booking.step_staff',
    'booking.step_datetime',
    'booking.step_details',
    'booking.step_confirm',
  ];

  // ── Booking state ──────────────────────────────────────

  readonly bookingState = signal<BookingState>({
    service: null,
    branchId: null,
    serviceId: null,
    selectedStaffId: null,
    selectedDate: null,
    selectedSlot: null,
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    notes: '',
  });

  // ── Auth ───────────────────────────────────────────────

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;

  // ── Loading / async state ──────────────────────────────

  readonly loadingService = signal(true);
  readonly loadingStaff = signal(false);
  readonly loadingSlots = signal(false);
  readonly submitting = signal(false);
  readonly bookingSuccess = signal(false);
  readonly confirmedBookingId = signal('');
  readonly bookingError = signal<string | null>(null);

  readonly staffList = signal<StaffMember[]>([]);
  readonly availableSlots = signal<TimeSlot[]>([]);

  readonly skeletons = new Array(4);

  // ── Two-way ngModel bindings for guest form ────────────
  // (ngModel works best with plain properties rather than signal accessors)

  get guestName(): string { return this.bookingState().guestName; }
  set guestName(v: string) { this._patchState({ guestName: v }); }

  get guestEmail(): string { return this.bookingState().guestEmail; }
  set guestEmail(v: string) { this._patchState({ guestEmail: v }); }

  get guestPhone(): string { return this.bookingState().guestPhone; }
  set guestPhone(v: string) { this._patchState({ guestPhone: v }); }

  get notes(): string { return this.bookingState().notes; }
  set notes(v: string) { this._patchState({ notes: v }); }

  // ── Computed ───────────────────────────────────────────

  readonly selectedStaffName = computed(() => {
    const id = this.bookingState().selectedStaffId;
    if (!id) return '';
    const member = this.staffList().find((s) => s.id === id);
    if (!member) return '';
    return this.lang() === 'ar' ? member.fullNameAr : member.fullNameEn;
  });

  readonly guestDetailsValid = computed(() => {
    if (this.isAuthenticated()) return true;
    const s = this.bookingState();
    return (
      s.guestName.trim().length > 0 &&
      s.guestEmail.trim().length > 0 &&
      s.guestPhone.trim().length > 0
    );
  });

  readonly minDate = new Date().toISOString().slice(0, 10);

  // ── Lifecycle ──────────────────────────────────────────

  ngOnInit(): void {
    this.serviceSlug = this.route.snapshot.paramMap.get('serviceSlug') ?? '';

    // Pre-fill guest details if authenticated
    const user = this.currentUser();
    if (user) {
      this._patchState({
        guestName: user.fullName,
        guestEmail: user.email,
        guestPhone: user.phone ?? '',
      });
    }

    // Load service details
    this.catalogService.getItemDetail('', this.serviceSlug).subscribe({
      next: (item) => {
        // Fetch first branch for availability queries
        this.branchesService.getBranches().subscribe({
          next: (branches) => {
            const branchId = branches[0]?.id ?? null;
            this._patchState({ service: item, serviceId: item.id, branchId });
            this.loadingService.set(false);
          },
          error: () => {
            this._patchState({ service: item, serviceId: item.id });
            this.loadingService.set(false);
          },
        });
      },
      error: () => this.loadingService.set(false),
    });
  }

  // ── Navigation ─────────────────────────────────────────

  goToStep(step: WizardStep): void {
    if (step === 2 && this.staffList().length === 0) {
      this._fetchStaff();
    }
    if (step === 5) {
      this.bookingError.set(null);
    }
    this.currentStep.set(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Staff selection ────────────────────────────────────

  selectStaff(staffId: string | null): void {
    this._patchState({ selectedStaffId: staffId, selectedSlot: null });
  }

  // ── Date/slot selection ────────────────────────────────

  onDateChange(event: Event): void {
    const date = (event.target as HTMLInputElement).value;
    this._patchState({ selectedDate: date, selectedSlot: null });
    this.availableSlots.set([]);
    if (date) {
      this._fetchSlots(date);
    }
  }

  selectSlot(slot: TimeSlot): void {
    this._patchState({ selectedSlot: slot });
  }

  // ── Booking submission ─────────────────────────────────

  confirmBooking(): void {
    const state = this.bookingState();
    if (!state.service || !state.branchId || !state.selectedDate || !state.selectedSlot) return;

    this.submitting.set(true);
    this.bookingError.set(null);

    // Convert "HH:MM" → "HH:MM:SS" (TimeSpan format the backend expects)
    const startTimeStr = state.selectedSlot.startTime.includes(':')
      ? `${state.selectedSlot.startTime}:00`
      : state.selectedSlot.startTime;

    const request = {
      branchId: state.branchId,
      serviceId: state.serviceId!,
      staffId: state.selectedStaffId,
      guestName: this.isAuthenticated() ? null : state.guestName,
      guestEmail: this.isAuthenticated() ? null : state.guestEmail,
      guestPhone: this.isAuthenticated() ? null : state.guestPhone,
      appointmentDate: `${state.selectedDate}T00:00:00`,
      startTime: startTimeStr,
      customerNotes: state.notes || null,
    };

    this.bookingService.createBooking(request).subscribe({
      next: (confirmation) => {
        this.submitting.set(false);
        this.confirmedBookingId.set(confirmation.id);
        this.bookingSuccess.set(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message ?? 'errors.generic';
        this.bookingError.set(msg);
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────

  avatarInitials(member: StaffMember): string {
    const name = member.fullNameEn || member.fullNameAr || '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hourStr, minStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const min = minStr ?? '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${min} ${ampm}`;
  }

  // ── Private ────────────────────────────────────────────

  private _patchState(patch: Partial<BookingState>): void {
    this.bookingState.update((s) => ({ ...s, ...patch }));
  }

  private _fetchStaff(): void {
    this.loadingStaff.set(true);
    this.bookingService.getStaffForService(this.serviceSlug).subscribe({
      next: (staff) => { this.staffList.set(staff); this.loadingStaff.set(false); },
      error: () => this.loadingStaff.set(false),
    });
  }

  private _fetchSlots(date: string): void {
    const state = this.bookingState();
    if (!state.serviceId || !state.branchId) return;

    this.loadingSlots.set(true);
    this.bookingService
      .getAvailability(state.serviceId, state.branchId, date, state.selectedStaffId)
      .subscribe({
        next: (resp) => {
          this.availableSlots.set(resp.slots ?? []);
          this.loadingSlots.set(false);
        },
        error: () => { this.availableSlots.set([]); this.loadingSlots.set(false); },
      });
  }
}
