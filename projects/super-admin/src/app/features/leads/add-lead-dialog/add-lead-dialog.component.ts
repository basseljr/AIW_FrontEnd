import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../../core/services/super-admin-api.service';
import { CreateLeadRequest, Lead, LeadSource } from '../../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-add-lead-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-lead-dialog.component.html',
  styleUrls: ['./add-lead-dialog.component.css'],
})
export class AddLeadDialogComponent {
  private readonly api = inject(SuperAdminApiService);
  private readonly fb = inject(FormBuilder);

  @Output() saved = new EventEmitter<Lead>();
  @Output() close = new EventEmitter<void>();

  readonly saving = signal(false);
  readonly serverError = signal(false);

  readonly form = this.fb.nonNullable.group({
    businessName: ['', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    businessType: ['', Validators.required],
    source: ['', Validators.required],
    notes: [''],
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.serverError.set(false);

    const v = this.form.getRawValue();
    const req: CreateLeadRequest = {
      businessName: v.businessName,
      name: v.name,
      email: v.email,
      phone: v.phone,
      businessType: v.businessType,
      source: v.source as LeadSource,
      notes: v.notes || undefined,
    };

    this.api.createLead(req).subscribe({
      next: (lead) => {
        this.saving.set(false);
        this.saved.emit(lead);
      },
      error: () => {
        this.saving.set(false);
        this.serverError.set(true);
      },
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('sa-dialog-backdrop')) {
      this.close.emit();
    }
  }
}
