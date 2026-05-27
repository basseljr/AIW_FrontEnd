import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { TemplateDetail, TemplateSummary } from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-templates',
  standalone: true,
  imports: [TranslateModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.css'],
})
export class TemplatesComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly templates = signal<TemplateSummary[]>([]);
  readonly loading = signal(true);
  readonly selected = signal<TemplateDetail | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.listTemplates().subscribe({
      next: (res) => {
        this.templates.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(template: TemplateSummary): void {
    this.api.getTemplate(template.id).subscribe((d) => this.selected.set(d));
  }

  badgeForStatus(status: string): string {
    switch (status) {
      case 'active': return 'sa-badge--success';
      case 'draft': return 'sa-badge--warning';
      case 'deprecated': return 'sa-badge--danger';
      default: return 'sa-badge--neutral';
    }
  }
}
