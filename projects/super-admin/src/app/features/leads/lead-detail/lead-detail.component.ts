import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../../core/services/super-admin-api.service';
import { LeadDetail, LeadStage } from '../../../core/models/super-admin-api.models';

const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'leads.stage.new',
  contacted: 'leads.stage.contacted',
  meeting_scheduled: 'leads.stage.meeting_scheduled',
  building: 'leads.stage.building',
  preview_sent: 'leads.stage.preview_sent',
  approved: 'leads.stage.approved',
  payment_received: 'leads.stage.approved',
  live: 'leads.stage.live',
  lost: 'leads.stage.lost',
};

const LOST_REASONS = ['price', 'competitor', 'not_ready', 'no_response', 'other'];

@Component({
  selector: 'sa-lead-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lead-detail.component.html',
  styleUrls: ['./lead-detail.component.css'],
})
export class LeadDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(SuperAdminApiService);

  readonly lead = signal<LeadDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly newNote = signal('');
  readonly addingNote = signal(false);

  readonly showConvertDialog = signal(false);
  readonly convertSubdomain = signal('');
  readonly convertPlanId = signal('');
  readonly converting = signal(false);

  readonly showLostDialog = signal(false);
  readonly lostReason = signal('');

  readonly stages = Object.keys(STAGE_LABELS) as LeadStage[];
  readonly stageLabels = STAGE_LABELS;
  readonly lostReasons = LOST_REASONS;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.api.getLead(id).subscribe({
      next: (l) => {
        this.lead.set(l);
        this.convertSubdomain.set(this.suggestSubdomain(l.businessName));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('lead.load_error');
        this.loading.set(false);
      },
    });
  }

  addNote(): void {
    const lead = this.lead();
    const text = this.newNote().trim();
    if (!lead || !text) return;
    this.addingNote.set(true);
    this.api.addLeadNote(lead.id, text).subscribe({
      next: (note) => {
        this.lead.update((l) => l ? { ...l, notesList: [note, ...l.notesList] } : l);
        this.newNote.set('');
        this.addingNote.set(false);
      },
      error: () => this.addingNote.set(false),
    });
  }

  transition(stage: LeadStage): void {
    const lead = this.lead();
    if (!lead || lead.status === stage) return;
    this.api.updateLeadStage(lead.id, { status: stage }).subscribe({
      next: () => this.load(),
    });
  }

  markWon(): void {
    this.showConvertDialog.set(true);
  }

  markLost(): void {
    this.showLostDialog.set(true);
  }

  confirmLost(): void {
    const lead = this.lead();
    const reason = this.lostReason();
    if (!lead || !reason) return;
    this.api.updateLeadStage(lead.id, { status: 'lost', lostReason: reason }).subscribe({
      next: () => {
        this.showLostDialog.set(false);
        this.load();
      },
    });
  }

  confirmConvert(): void {
    const lead = this.lead();
    if (!lead) return;
    const subdomain = this.convertSubdomain().trim();
    if (!subdomain) return;
    this.converting.set(true);
    this.api.convertLead(lead.id, {
      subdomain,
      planId: this.convertPlanId(),
      businessType: lead.businessType,
    }).subscribe({
      next: (res) => {
        this.converting.set(false);
        this.showConvertDialog.set(false);
        this.router.navigate(['/tenants', res.tenantId]);
      },
      error: () => this.converting.set(false),
    });
  }

  private suggestSubdomain(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  }
}
