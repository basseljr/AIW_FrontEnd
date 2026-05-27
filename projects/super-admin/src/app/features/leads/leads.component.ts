import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { Lead, LeadStage } from '../../core/models/super-admin-api.models';
import { AddLeadDialogComponent } from './add-lead-dialog/add-lead-dialog.component';

interface KanbanColumn {
  stage: LeadStage;
  titleKey: string;
  items: Lead[];
}

const PIPELINE_STAGES: { stage: LeadStage; titleKey: string }[] = [
  { stage: 'new', titleKey: 'leads.stage.new' },
  { stage: 'contacted', titleKey: 'leads.stage.contacted' },
  { stage: 'meeting_scheduled', titleKey: 'leads.stage.meeting_scheduled' },
  { stage: 'building', titleKey: 'leads.stage.building' },
  { stage: 'preview_sent', titleKey: 'leads.stage.preview_sent' },
  { stage: 'approved', titleKey: 'leads.stage.approved' },
  { stage: 'live', titleKey: 'leads.stage.live' },
  { stage: 'lost', titleKey: 'leads.stage.lost' },
];

@Component({
  selector: 'sa-leads',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    TranslateModule,
    CdkDropList,
    CdkDropListGroup,
    CdkDrag,
    AddLeadDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.css'],
})
export class LeadsComponent implements OnInit, OnDestroy {
  private readonly api = inject(SuperAdminApiService);
  private readonly destroy$ = new Subject<void>();

  readonly view = signal<'kanban' | 'list'>('kanban');
  readonly stageFilter = signal<LeadStage | ''>('');
  readonly sourceFilter = signal<string>('');
  readonly businessTypeFilter = signal<string>('');
  readonly searchQuery = signal<string>('');

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly leads = signal<Lead[]>([]);
  readonly addDialogOpen = signal(false);
  readonly showSuccess = signal(false);

  readonly stages = PIPELINE_STAGES;
  readonly stageIds = PIPELINE_STAGES.map((s) => `col-${s.stage}`);

  readonly columns = computed<KanbanColumn[]>(() => {
    const all = this.leads();
    return this.stages.map((s) => ({
      stage: s.stage,
      titleKey: s.titleKey,
      items: all.filter((l) => l.status === s.stage),
    }));
  });

  readonly filteredList = computed<Lead[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    return this.leads().filter((l) => {
      if (this.stageFilter() && l.status !== this.stageFilter()) return false;
      if (this.sourceFilter() && l.source !== this.sourceFilter()) return false;
      if (this.businessTypeFilter() && l.businessType !== this.businessTypeFilter()) return false;
      if (q && !`${l.businessName} ${l.name} ${l.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.listLeads().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.leads.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  setView(view: 'kanban' | 'list'): void {
    this.view.set(view);
  }

  onLeadCreated(lead: Lead): void {
    this.leads.update((all) => [lead, ...all]);
    this.addDialogOpen.set(false);
    this.showSuccess.set(true);
    setTimeout(() => this.showSuccess.set(false), 3000);
  }

  onDrop(event: CdkDragDrop<Lead[]>, toStage: LeadStage): void {
    if (event.previousContainer === event.container) return;
    const lead = event.previousContainer.data[event.previousIndex];
    if (!lead || lead.status === toStage) return;

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    const updated = { ...lead, status: toStage };
    this.leads.update((all) => all.map((l) => (l.id === lead.id ? updated : l)));

    this.api.updateLeadStage(lead.id, { status: toStage }).subscribe({
      error: () => {
        // Revert
        this.leads.update((all) => all.map((l) => (l.id === lead.id ? lead : l)));
      },
    });
  }

  badgeForSource(source: string): string {
    switch (source) {
      case 'website': return 'sa-badge--info';
      case 'referral': return 'sa-badge--success';
      case 'event': return 'sa-badge--accent';
      case 'cold': return 'sa-badge--neutral';
      default: return 'sa-badge--neutral';
    }
  }

  iconForType(type: string): string {
    switch (type) {
      case 'restaurant': return '🍽️';
      case 'retail': return '🛍️';
      case 'service': return '🛠️';
      default: return '🏢';
    }
  }
}
