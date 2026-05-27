import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { DeliveryProvider } from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-delivery-providers',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delivery-providers.component.html',
  styleUrls: ['./delivery-providers.component.css'],
})
export class DeliveryProvidersComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly providers = signal<DeliveryProvider[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.listDeliveryProviders().subscribe({
      next: (res) => {
        this.providers.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggle(p: DeliveryProvider): void {
    this.api.toggleDeliveryProvider(p.key, !p.isEnabled).subscribe(() => this.load());
  }
}
