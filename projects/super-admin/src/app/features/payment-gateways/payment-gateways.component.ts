import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { PaymentGatewayConfig } from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-payment-gateways',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-gateways.component.html',
  styleUrls: ['./payment-gateways.component.css'],
})
export class PaymentGatewaysComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly gateways = signal<PaymentGatewayConfig[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.listPaymentGateways().subscribe({
      next: (res) => {
        this.gateways.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggle(g: PaymentGatewayConfig): void {
    this.api.togglePaymentGateway(g.key, !g.isEnabled).subscribe(() => this.load());
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'healthy': return 'sa-badge--success';
      case 'degraded': return 'sa-badge--warning';
      case 'down': return 'sa-badge--danger';
      default: return 'sa-badge--neutral';
    }
  }
}
