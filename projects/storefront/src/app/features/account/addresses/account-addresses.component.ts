import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AccountService } from '../../../core/services/account.service';
import { CustomerAddress } from '../../../core/models/auth.model';

type FormMode = 'none' | 'add' | 'edit';

@Component({
  selector: 'sf-account-addresses',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="addr">
      <div class="addr__header">
        <h1 class="addr__title">{{ 'account.addresses_title' | translate }}</h1>
        @if (formMode() === 'none') {
          <button class="addr__add-btn" type="button" (click)="openAdd()">
            + {{ 'account.add_address' | translate }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="addr__loading">{{ 'common.loading' | translate }}</div>
      } @else {
        <!-- Form (add or edit) -->
        @if (formMode() !== 'none') {
          <form
            class="addr__form"
            [formGroup]="addrForm"
            (ngSubmit)="saveAddress()"
            novalidate
          >
            <h2 class="addr__form-title">
              @if (formMode() === 'add') {
                {{ 'account.add_address' | translate }}
              } @else {
                {{ 'account.edit_address' | translate }}
              }
            </h2>

            @if (formError()) {
              <div class="addr__form-error" role="alert">{{ formError() }}</div>
            }

            <div class="addr__form-grid">
              <!-- Label -->
              <div class="addr__field addr__field--full">
                <label class="addr__label" for="addr-label">{{ 'account.address_label' | translate }}</label>
                <input id="addr-label" class="addr__input" [class.addr__input--error]="touched() && addrForm.controls.label.invalid" type="text" formControlName="label" [placeholder]="'account.address_label' | translate" />
                @if (touched() && addrForm.controls.label.hasError('required')) {
                  <span class="addr__field-error">{{ 'errors.required' | translate }}</span>
                }
              </div>

              <!-- Full name -->
              <div class="addr__field">
                <label class="addr__label" for="addr-fullname">{{ 'account.address_fullname' | translate }}</label>
                <input id="addr-fullname" class="addr__input" type="text" formControlName="fullName" />
              </div>

              <!-- Phone -->
              <div class="addr__field">
                <label class="addr__label" for="addr-phone">{{ 'account.address_phone' | translate }}</label>
                <input id="addr-phone" class="addr__input" type="tel" formControlName="phone" />
              </div>

              <!-- Governorate -->
              <div class="addr__field">
                <label class="addr__label" for="addr-gov">{{ 'account.address_governorate' | translate }}</label>
                <input id="addr-gov" class="addr__input" [class.addr__input--error]="touched() && addrForm.controls.governorate.invalid" type="text" formControlName="governorate" [placeholder]="'account.address_governorate' | translate" />
                @if (touched() && addrForm.controls.governorate.hasError('required')) {
                  <span class="addr__field-error">{{ 'errors.required' | translate }}</span>
                }
              </div>

              <!-- Block -->
              <div class="addr__field">
                <label class="addr__label" for="addr-block">{{ 'account.address_block' | translate }}</label>
                <input id="addr-block" class="addr__input" [class.addr__input--error]="touched() && addrForm.controls.block.invalid" type="text" formControlName="block" [placeholder]="'account.address_block' | translate" />
                @if (touched() && addrForm.controls.block.hasError('required')) {
                  <span class="addr__field-error">{{ 'errors.required' | translate }}</span>
                }
              </div>

              <!-- Street -->
              <div class="addr__field">
                <label class="addr__label" for="addr-street">{{ 'account.address_street' | translate }}</label>
                <input id="addr-street" class="addr__input" [class.addr__input--error]="touched() && addrForm.controls.street.invalid" type="text" formControlName="street" [placeholder]="'account.address_street' | translate" />
                @if (touched() && addrForm.controls.street.hasError('required')) {
                  <span class="addr__field-error">{{ 'errors.required' | translate }}</span>
                }
              </div>

              <!-- Area -->
              <div class="addr__field">
                <label class="addr__label" for="addr-area">{{ 'account.address_area' | translate }}</label>
                <input id="addr-area" class="addr__input" [class.addr__input--error]="touched() && addrForm.controls.area.invalid" type="text" formControlName="area" [placeholder]="'account.address_area' | translate" />
                @if (touched() && addrForm.controls.area.hasError('required')) {
                  <span class="addr__field-error">{{ 'errors.required' | translate }}</span>
                }
              </div>

              <!-- City -->
              <div class="addr__field">
                <label class="addr__label" for="addr-city">{{ 'account.address_city' | translate }}</label>
                <input id="addr-city" class="addr__input" [class.addr__input--error]="touched() && addrForm.controls.city.invalid" type="text" formControlName="city" [placeholder]="'account.address_city' | translate" />
                @if (touched() && addrForm.controls.city.hasError('required')) {
                  <span class="addr__field-error">{{ 'errors.required' | translate }}</span>
                }
              </div>

              <!-- Building -->
              <div class="addr__field">
                <label class="addr__label" for="addr-building">{{ 'account.address_building' | translate }}</label>
                <input id="addr-building" class="addr__input" type="text" formControlName="building" />
              </div>

              <!-- Apartment -->
              <div class="addr__field">
                <label class="addr__label" for="addr-apt">{{ 'account.address_apartment' | translate }}</label>
                <input id="addr-apt" class="addr__input" type="text" formControlName="apartment" />
              </div>

              <!-- Additional info -->
              <div class="addr__field addr__field--full">
                <label class="addr__label" for="addr-notes">{{ 'account.address_notes' | translate }}</label>
                <textarea id="addr-notes" class="addr__textarea" rows="2" formControlName="additionalInfo"></textarea>
              </div>

              <!-- Default checkbox -->
              <div class="addr__field addr__field--full addr__field--check">
                <label class="addr__check-label">
                  <input type="checkbox" formControlName="isDefault" />
                  <span>{{ 'account.address_default' | translate }}</span>
                </label>
              </div>
            </div>

            <div class="addr__form-actions">
              <button type="button" class="addr__cancel-btn" (click)="closeForm()">
                {{ 'common.cancel' | translate }}
              </button>
              <button class="addr__save-btn" type="submit" [disabled]="saving()">
                @if (saving()) { {{ 'common.loading' | translate }} }
                @else { {{ 'account.save_address' | translate }} }
              </button>
            </div>
          </form>
        }

        <!-- Address list -->
        @if (addresses().length === 0 && formMode() === 'none') {
          <div class="addr__empty">
            <svg class="addr__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <p class="addr__empty-title">{{ 'account.no_addresses' | translate }}</p>
            <p class="addr__empty-sub">{{ 'account.no_addresses_sub' | translate }}</p>
            <button class="addr__empty-add" type="button" (click)="openAdd()">
              {{ 'account.add_address' | translate }}
            </button>
          </div>
        }

        @if (addresses().length > 0) {
          <div class="addr__list">
            @for (addr of addresses(); track addr.id) {
              <div class="addr__card" [class.addr__card--default]="addr.isDefault">
                <div class="addr__card-header">
                  <span class="addr__card-label">{{ addr.label }}</span>
                  @if (addr.isDefault) {
                    <span class="addr__default-badge">{{ 'account.default_badge' | translate }}</span>
                  }
                </div>
                <div class="addr__card-body">
                  @if (addr.fullName) {
                    <div>{{ addr.fullName }}</div>
                  }
                  <div>{{ addr.block }}, {{ addr.street }}, {{ addr.area }}</div>
                  <div>{{ addr.city }}, {{ addr.governorate }}</div>
                  @if (addr.building) {
                    <div>{{ addr.building }}{{ addr.apartment ? ', ' + addr.apartment : '' }}</div>
                  }
                  @if (addr.additionalInfo) {
                    <div class="addr__card-notes">{{ addr.additionalInfo }}</div>
                  }
                </div>
                <div class="addr__card-actions">
                  @if (!addr.isDefault) {
                    <button class="addr__action-btn" type="button" (click)="setDefault(addr)">
                      {{ 'account.set_default' | translate }}
                    </button>
                  }
                  <button class="addr__action-btn" type="button" (click)="openEdit(addr)">
                    {{ 'account.edit_address' | translate }}
                  </button>
                  <button
                    class="addr__action-btn addr__action-btn--danger"
                    type="button"
                    (click)="confirmDelete(addr)"
                  >
                    {{ 'account.delete_address' | translate }}
                  </button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Delete confirm overlay -->
        @if (deleteTarget()) {
          <div class="addr__confirm-overlay" role="dialog" aria-modal="true">
            <div class="addr__confirm-card">
              <p class="addr__confirm-text">{{ 'account.delete_address_confirm' | translate }}</p>
              <p class="addr__confirm-label">{{ deleteTarget()!.label }}</p>
              <div class="addr__confirm-actions">
                <button class="addr__cancel-btn" type="button" (click)="deleteTarget.set(null)">
                  {{ 'common.cancel' | translate }}
                </button>
                <button class="addr__delete-btn" type="button" [disabled]="saving()" (click)="deleteAddress()">
                  {{ 'common.delete' | translate }}
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .addr {
        padding-block-end: 2rem;
      }

      .addr__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-block-end: 1.5rem;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .addr__title {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-on-surface, #1e1b17);
        letter-spacing: -0.02em;
        margin: 0;
      }

      .addr__add-btn {
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        border: none;
        border-radius: var(--border-radius-full, 9999px);
        font-size: 0.875rem;
        font-weight: 700;
        padding-block: 0.5rem;
        padding-inline: 1.25rem;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      .addr__add-btn:hover { opacity: 0.9; }

      .addr__loading {
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.6;
        font-size: 0.9375rem;
      }

      /* Address form */
      .addr__form {
        background: #fff;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        padding: 1.5rem;
        margin-block-end: 1.5rem;
      }

      .addr__form-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        margin-block-end: 1.25rem;
      }

      .addr__form-error {
        background: #fef2f2;
        color: var(--color-error, #dc2626);
        border: 1px solid #fecaca;
        border-radius: var(--border-radius-md, 8px);
        padding-block: 0.625rem;
        padding-inline: 0.875rem;
        font-size: 0.875rem;
        margin-block-end: 1rem;
      }

      .addr__form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.875rem;
      }
      @media (max-width: 540px) {
        .addr__form-grid {
          grid-template-columns: 1fr;
        }
      }

      .addr__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .addr__field--full {
        grid-column: 1 / -1;
      }
      .addr__field--check {
        flex-direction: row;
        align-items: center;
      }

      .addr__label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
      }

      .addr__input {
        block-size: 2.5rem;
        padding-inline: 0.75rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        background: #fff;
        font-size: 0.9375rem;
        color: var(--color-on-surface, #1e1b17);
        transition: border-color 0.2s;
        font-family: inherit;
      }
      .addr__input:focus {
        outline: none;
        border-color: var(--color-primary);
      }
      .addr__input--error {
        border-color: var(--color-error, #dc2626);
      }

      .addr__textarea {
        padding: 0.625rem 0.75rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        background: #fff;
        font-size: 0.9375rem;
        color: var(--color-on-surface, #1e1b17);
        transition: border-color 0.2s;
        resize: vertical;
        font-family: inherit;
      }
      .addr__textarea:focus {
        outline: none;
        border-color: var(--color-primary);
      }

      .addr__check-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-on-surface, #1e1b17);
        cursor: pointer;
      }

      .addr__field-error {
        font-size: 0.75rem;
        color: var(--color-error, #dc2626);
      }

      .addr__form-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        margin-block-start: 1.25rem;
        padding-block-start: 1.25rem;
        border-block-start: 1px solid var(--color-outline-variant, #d6c4ad);
      }

      .addr__cancel-btn {
        background: transparent;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
        padding-block: 0.5rem;
        padding-inline: 1.25rem;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
      }
      .addr__cancel-btn:hover {
        background: var(--color-surface-container, #f4ede5);
      }

      .addr__save-btn {
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        border: none;
        border-radius: var(--border-radius-md, 8px);
        font-size: 0.875rem;
        font-weight: 700;
        padding-block: 0.5rem;
        padding-inline: 1.5rem;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      .addr__save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .addr__save-btn:not(:disabled):hover { opacity: 0.9; }

      /* Empty state */
      .addr__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-block: 4rem;
        text-align: center;
        gap: 0.75rem;
      }
      .addr__empty-icon {
        inline-size: 4rem;
        block-size: 4rem;
        color: var(--color-outline-variant, #d6c4ad);
        margin-block-end: 0.5rem;
      }
      .addr__empty-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        margin: 0;
      }
      .addr__empty-sub {
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.6;
        margin: 0;
      }
      .addr__empty-add {
        margin-block-start: 0.5rem;
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
        transition: opacity 0.2s;
      }
      .addr__empty-add:hover { opacity: 0.9; }

      /* Address list */
      .addr__list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .addr__card {
        background: #fff;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        padding: 1.25rem;
        transition: border-color 0.2s;
      }
      .addr__card--default {
        border-color: var(--color-primary);
      }

      .addr__card-header {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        margin-block-end: 0.625rem;
      }

      .addr__card-label {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
      }

      .addr__default-badge {
        display: inline-block;
        background: rgba(128, 86, 0, 0.12);
        color: var(--color-primary);
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        padding-block: 0.15rem;
        padding-inline: 0.5rem;
        border-radius: var(--border-radius-full, 9999px);
      }

      .addr__card-body {
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.75;
        line-height: 1.6;
        margin-block-end: 0.875rem;
      }

      .addr__card-notes {
        opacity: 0.6;
        font-style: italic;
        margin-block-start: 0.25rem;
      }

      .addr__card-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .addr__action-btn {
        background: transparent;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-full, 9999px);
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-primary);
        padding-block: 0.25rem;
        padding-inline: 0.75rem;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
      }
      .addr__action-btn:hover {
        background: var(--color-surface-container, #f4ede5);
      }
      .addr__action-btn--danger {
        color: var(--color-error, #dc2626);
        border-color: #fecaca;
      }
      .addr__action-btn--danger:hover {
        background: #fef2f2;
      }

      /* Delete confirm overlay */
      .addr__confirm-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 1rem;
      }

      .addr__confirm-card {
        background: #fff;
        border-radius: var(--border-radius-md, 8px);
        padding: 2rem;
        max-inline-size: 20rem;
        inline-size: 100%;
        text-align: center;
      }

      .addr__confirm-text {
        font-size: 1.0625rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        margin-block-end: 0.5rem;
      }

      .addr__confirm-label {
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.65;
        margin-block-end: 1.5rem;
      }

      .addr__confirm-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
      }

      .addr__delete-btn {
        background: var(--color-error, #dc2626);
        color: #fff;
        border: none;
        border-radius: var(--border-radius-md, 8px);
        font-size: 0.875rem;
        font-weight: 700;
        padding-block: 0.5rem;
        padding-inline: 1.5rem;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      .addr__delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .addr__delete-btn:not(:disabled):hover { opacity: 0.85; }
    `,
  ],
})
export class AccountAddressesComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly fb = inject(FormBuilder);

  readonly addresses = signal<CustomerAddress[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formMode = signal<FormMode>('none');
  readonly editId = signal<string | null>(null);
  readonly touched = signal(false);
  readonly formError = signal<string>('');
  readonly deleteTarget = signal<CustomerAddress | null>(null);

  readonly addrForm = this.fb.nonNullable.group({
    label: ['', Validators.required],
    fullName: [''],
    phone: [''],
    country: ['KW'],
    governorate: ['', Validators.required],
    block: ['', Validators.required],
    street: ['', Validators.required],
    area: ['', Validators.required],
    city: ['Kuwait City', Validators.required],
    building: [''],
    apartment: [''],
    additionalInfo: [''],
    isDefault: [false],
    lat: [0],
    lng: [0],
  });

  ngOnInit(): void {
    this.loadAddresses();
  }

  private loadAddresses(): void {
    this.accountService.getAddresses().subscribe({
      next: (list) => {
        this.addresses.set(list ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  openAdd(): void {
    this.addrForm.reset({
      label: '',
      fullName: '',
      phone: '',
      country: 'KW',
      governorate: '',
      block: '',
      street: '',
      area: '',
      city: 'Kuwait City',
      building: '',
      apartment: '',
      additionalInfo: '',
      isDefault: false,
      lat: 0,
      lng: 0,
    });
    this.editId.set(null);
    this.formMode.set('add');
    this.touched.set(false);
    this.formError.set('');
  }

  openEdit(addr: CustomerAddress): void {
    this.addrForm.setValue({
      label: addr.label,
      fullName: addr.fullName ?? '',
      phone: addr.phone ?? '',
      country: addr.country,
      governorate: addr.governorate,
      block: addr.block,
      street: addr.street,
      area: addr.area,
      city: addr.city,
      building: addr.building ?? '',
      apartment: addr.apartment ?? '',
      additionalInfo: addr.additionalInfo ?? '',
      isDefault: addr.isDefault,
      lat: addr.lat,
      lng: addr.lng,
    });
    this.editId.set(addr.id);
    this.formMode.set('edit');
    this.touched.set(false);
    this.formError.set('');
  }

  closeForm(): void {
    this.formMode.set('none');
    this.editId.set(null);
  }

  saveAddress(): void {
    this.touched.set(true);
    if (this.addrForm.invalid) return;

    const raw = this.addrForm.getRawValue();
    const payload: Omit<CustomerAddress, 'id' | 'customerId'> = {
      label: raw.label,
      fullName: raw.fullName || null,
      phone: raw.phone || null,
      country: raw.country,
      governorate: raw.governorate,
      block: raw.block,
      street: raw.street,
      area: raw.area,
      city: raw.city,
      building: raw.building || null,
      apartment: raw.apartment || null,
      additionalInfo: raw.additionalInfo || null,
      isDefault: raw.isDefault,
      lat: raw.lat,
      lng: raw.lng,
    };

    this.saving.set(true);
    this.formError.set('');

    const id = this.editId();
    const req =
      id
        ? this.accountService.updateAddress(id, payload)
        : this.accountService.createAddress(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.formMode.set('none');
        this.loadAddresses();
      },
      error: () => {
        this.saving.set(false);
        this.formError.set('errors.generic');
      },
    });
  }

  setDefault(addr: CustomerAddress): void {
    const payload: Omit<CustomerAddress, 'id' | 'customerId'> = {
      ...addr,
      isDefault: true,
    };
    this.accountService.updateAddress(addr.id, payload).subscribe({
      next: () => this.loadAddresses(),
    });
  }

  confirmDelete(addr: CustomerAddress): void {
    this.deleteTarget.set(addr);
  }

  deleteAddress(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.saving.set(true);
    this.accountService.deleteAddress(target.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.deleteTarget.set(null);
        this.addresses.update((list) => list.filter((a) => a.id !== target.id));
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
