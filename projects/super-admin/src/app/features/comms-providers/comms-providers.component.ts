import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { CommsProviderConfig } from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-comms-providers',
  standalone: true,
  imports: [DecimalPipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comms-providers.component.html',
  styleUrls: ['./comms-providers.component.css'],
})
export class CommsProvidersComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly providers = signal<CommsProviderConfig[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.listCommsProviders().subscribe({
      next: (res) => {
        this.providers.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggle(p: CommsProviderConfig): void {
    this.api.toggleCommsProvider(p.key, !p.isEnabled).subscribe(() => this.load());
  }

  iconForType(type: string): string {
    switch (type) {
      case 'email': return '✉️';
      case 'sms': return '💬';
      case 'push': return '🔔';
      default: return '📡';
    }
  }
}
