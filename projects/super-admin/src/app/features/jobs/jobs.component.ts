import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { JobInfo, JobsSummary } from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-jobs',
  standalone: true,
  imports: [DatePipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.css'],
})
export class JobsComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly summary = signal<JobsSummary | null>(null);
  readonly failed = signal<JobInfo[]>([]);
  readonly loading = signal(true);
  readonly expandedId = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getJobs().subscribe({
      next: (res) => {
        this.summary.set(res.summary);
        this.failed.set(res.failed);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  retry(job: JobInfo): void {
    this.api.retryJob(job.id).subscribe(() => this.load());
  }

  toggle(id: string): void {
    this.expandedId.update((e) => (e === id ? null : id));
  }
}
