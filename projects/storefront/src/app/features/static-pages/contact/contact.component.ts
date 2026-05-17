import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { TenantConfigService } from '../../../core/services/tenant-config.service';
import { BranchesService } from '../../../core/services/branches.service';
import { Branch } from '../../../core/models/branch.model';

@Component({
  selector: 'sf-contact',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contact">
      <div class="contact__inner">
        <header class="contact__header">
          <h1 class="contact__title">{{ 'contact.title' | translate }}</h1>
          <p class="contact__subtitle">{{ 'contact.subtitle' | translate }}</p>
        </header>

        <div class="contact__layout">
          <!-- Left: info + branches -->
          <div class="contact__info">
            <!-- Branches -->
            @if (branches().length > 0) {
              <div class="contact__card">
                <h2 class="contact__card-title">{{ 'contact.our_locations' | translate }}</h2>
                @for (branch of branches(); track branch.id) {
                  <div class="contact__branch">
                    <h3 class="contact__branch-name">
                      {{ lang() === 'ar' ? branch.nameAr : branch.nameEn }}
                    </h3>
                    @if (branch.address) {
                      <div class="contact__branch-row">
                        <svg class="contact__branch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                        <span>{{ branch.address }}</span>
                      </div>
                    }
                    @if (branch.phone) {
                      <div class="contact__branch-row">
                        <svg class="contact__branch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.59 2.72h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.46 17.46z"/></svg>
                        <a [href]="'tel:' + branch.phone" class="contact__link">{{ branch.phone }}</a>
                      </div>
                    }
                    @if (branch.workingHoursJson) {
                      <div class="contact__branch-row">
                        <svg class="contact__branch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>{{ branch.workingHoursJson }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            } @else if (!loadingBranches()) {
              <!-- Fallback: tenant contact info -->
              <div class="contact__card">
                <h2 class="contact__card-title">{{ 'contact.our_locations' | translate }}</h2>
                @if (phone()) {
                  <div class="contact__branch-row">
                    <svg class="contact__branch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.59 2.72h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.46 17.46z"/></svg>
                    <a [href]="'tel:' + phone()" class="contact__link">{{ phone() }}</a>
                  </div>
                }
                @if (address()) {
                  <div class="contact__branch-row">
                    <svg class="contact__branch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    <span>{{ address() }}</span>
                  </div>
                }
                @if (workingHours()) {
                  <div class="contact__branch-row">
                    <svg class="contact__branch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>{{ workingHours() }}</span>
                  </div>
                }
              </div>
            }

            <!-- WhatsApp -->
            @if (whatsapp()) {
              <a
                [href]="'https://wa.me/' + whatsapp()"
                class="contact__whatsapp-btn"
                target="_blank"
                rel="noopener"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                {{ 'contact.whatsapp' | translate }}
              </a>
            }
          </div>

          <!-- Right: contact form -->
          <div class="contact__form-wrap">
            <div class="contact__card">
              <h2 class="contact__card-title">{{ 'contact.send_message' | translate }}</h2>

              @if (submitted()) {
                <div class="contact__success" role="status">
                  {{ 'contact.success' | translate }}
                </div>
              } @else {
                <form
                  class="contact__form"
                  [formGroup]="form"
                  (ngSubmit)="submit()"
                  novalidate
                >
                  @if (formError()) {
                    <div class="contact__form-error" role="alert">{{ formError() | translate }}</div>
                  }

                  <div class="contact__field">
                    <label class="contact__label" for="c-name">{{ 'contact.name' | translate }}</label>
                    <input
                      id="c-name"
                      class="contact__input"
                      type="text"
                      formControlName="name"
                      [placeholder]="'contact.name_placeholder' | translate"
                    />
                    @if (touched() && form.controls.name.hasError('required')) {
                      <span class="contact__field-error">{{ 'errors.required' | translate }}</span>
                    }
                  </div>

                  <div class="contact__field">
                    <label class="contact__label" for="c-email">{{ 'contact.email' | translate }}</label>
                    <input
                      id="c-email"
                      class="contact__input"
                      type="email"
                      formControlName="email"
                      [placeholder]="'contact.email_placeholder' | translate"
                    />
                    @if (touched() && form.controls.email.hasError('required')) {
                      <span class="contact__field-error">{{ 'errors.required' | translate }}</span>
                    }
                    @if (touched() && form.controls.email.hasError('email')) {
                      <span class="contact__field-error">{{ 'errors.invalid_email' | translate }}</span>
                    }
                  </div>

                  <div class="contact__field">
                    <label class="contact__label" for="c-msg">{{ 'contact.message' | translate }}</label>
                    <textarea
                      id="c-msg"
                      class="contact__textarea"
                      formControlName="message"
                      rows="5"
                      [placeholder]="'contact.message_placeholder' | translate"
                    ></textarea>
                    @if (touched() && form.controls.message.hasError('required')) {
                      <span class="contact__field-error">{{ 'errors.required' | translate }}</span>
                    }
                  </div>

                  <button
                    class="contact__submit-btn"
                    type="submit"
                    [disabled]="submitting()"
                  >
                    @if (submitting()) {
                      {{ 'contact.sending' | translate }}
                    } @else {
                      {{ 'contact.send' | translate }}
                    }
                  </button>
                </form>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact {
      background: var(--color-background, #fff8f1);
      min-block-size: 70vh;
      padding-block: 3rem;
      padding-inline: 1.5rem;
    }
    .contact__inner {
      max-inline-size: 72rem;
      margin-inline: auto;
    }
    .contact__header {
      margin-block-end: 2.5rem;
    }
    .contact__title {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 800;
      color: var(--color-primary, #805600);
      margin: 0 0 0.5rem;
      letter-spacing: -0.02em;
    }
    .contact__subtitle {
      font-size: 1rem;
      color: var(--color-on-surface, #1e1b17);
      opacity: 0.7;
      margin: 0;
    }
    .contact__layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    @media (min-width: 768px) {
      .contact__layout {
        grid-template-columns: 1fr 1fr;
      }
    }
    .contact__card {
      background: #fff;
      border: 1px solid var(--color-outline-variant, #d6c4ad);
      border-radius: var(--border-radius-md, 8px);
      padding: 1.5rem;
      margin-block-end: 1rem;
    }
    .contact__card:last-child { margin-block-end: 0; }
    .contact__card-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--color-on-surface, #1e1b17);
      margin: 0 0 1.25rem;
    }
    .contact__branch {
      padding-block-end: 1.25rem;
      margin-block-end: 1.25rem;
      border-block-end: 1px solid var(--color-outline-variant, #d6c4ad);
    }
    .contact__branch:last-child {
      padding-block-end: 0;
      margin-block-end: 0;
      border-block-end: none;
    }
    .contact__branch-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-primary, #805600);
      margin: 0 0 0.75rem;
    }
    .contact__branch-row {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-block-end: 0.5rem;
      font-size: 0.875rem;
      color: var(--color-on-surface, #1e1b17);
    }
    .contact__branch-row:last-child { margin-block-end: 0; }
    .contact__branch-icon {
      inline-size: 1rem;
      block-size: 1rem;
      flex-shrink: 0;
      margin-block-start: 0.1rem;
      color: var(--color-primary, #805600);
    }
    .contact__link {
      color: var(--color-primary, #805600);
      text-decoration: none;
    }
    .contact__link:hover { text-decoration: underline; }
    .contact__whatsapp-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      background: #25d366;
      color: #fff;
      text-decoration: none;
      font-size: 0.9375rem;
      font-weight: 700;
      padding-block: 0.75rem;
      padding-inline: 1.5rem;
      border-radius: var(--border-radius-full, 9999px);
      transition: opacity 0.2s;
      margin-block-start: 0.5rem;
    }
    .contact__whatsapp-btn:hover { opacity: 0.9; }
    .contact__whatsapp-btn svg { inline-size: 1.25rem; block-size: 1.25rem; }
    .contact__success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
      border-radius: var(--border-radius-md, 8px);
      padding: 1rem;
      font-size: 0.9375rem;
    }
    .contact__form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .contact__form-error {
      background: #fef2f2;
      color: var(--color-error, #dc2626);
      border: 1px solid #fecaca;
      border-radius: var(--border-radius-md, 8px);
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
    }
    .contact__field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .contact__label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-on-surface, #1e1b17);
    }
    .contact__input {
      block-size: 2.75rem;
      padding-inline: 0.875rem;
      border: 1.5px solid var(--color-outline-variant, #d6c4ad);
      border-radius: var(--border-radius-md, 8px);
      background: #fff;
      font-size: 1rem;
      color: var(--color-on-surface, #1e1b17);
      transition: border-color 0.2s;
      font-family: inherit;
    }
    .contact__input:focus { outline: none; border-color: var(--color-primary); }
    .contact__textarea {
      padding: 0.75rem 0.875rem;
      border: 1.5px solid var(--color-outline-variant, #d6c4ad);
      border-radius: var(--border-radius-md, 8px);
      background: #fff;
      font-size: 1rem;
      color: var(--color-on-surface, #1e1b17);
      transition: border-color 0.2s;
      font-family: inherit;
      resize: vertical;
    }
    .contact__textarea:focus { outline: none; border-color: var(--color-primary); }
    .contact__field-error { font-size: 0.75rem; color: var(--color-error, #dc2626); }
    .contact__submit-btn {
      background: var(--color-primary);
      color: var(--color-on-primary, #fff);
      border: none;
      border-radius: var(--border-radius-full, 9999px);
      font-size: 1rem;
      font-weight: 700;
      padding-block: 0.75rem;
      padding-inline: 2rem;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.2s;
      align-self: flex-start;
    }
    .contact__submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .contact__submit-btn:not(:disabled):hover { opacity: 0.9; }
  `],
})
export class ContactComponent implements OnInit {
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly branchesService = inject(BranchesService);
  private readonly langToggle = inject(LanguageToggleService);
  private readonly fb = inject(FormBuilder);

  readonly lang = this.langToggle.current;

  readonly config = computed(() => this.tenantConfig.config());
  readonly phone = computed(() => this.config()?.contact.phone ?? null);
  readonly address = computed(() => {
    const c = this.config();
    if (!c) return null;
    return this.lang() === 'ar' ? (c.contact.addressAr ?? c.contact.address) : c.contact.address;
  });
  readonly workingHours = computed(() => {
    const c = this.config();
    if (!c) return null;
    return this.lang() === 'ar' ? (c.contact.workingHoursAr ?? c.contact.workingHours) : c.contact.workingHours;
  });
  readonly whatsapp = computed(() => this.config()?.socialLinks.whatsapp ?? null);

  readonly branches = signal<Branch[]>([]);
  readonly loadingBranches = signal(true);
  readonly submitted = signal(false);
  readonly submitting = signal(false);
  readonly touched = signal(false);
  readonly formError = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', Validators.required],
  });

  ngOnInit(): void {
    this.branchesService.getBranches().subscribe({
      next: (list) => {
        this.branches.set(list ?? []);
        this.loadingBranches.set(false);
      },
      error: () => this.loadingBranches.set(false),
    });
  }

  submit(): void {
    this.touched.set(true);
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.formError.set('');
    // No API endpoint yet — show success after brief delay
    setTimeout(() => {
      this.submitting.set(false);
      this.submitted.set(true);
    }, 800);
  }
}
