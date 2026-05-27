import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { FeatureFlag } from '../../core/models/super-admin-api.models';

const CATEGORIES = ['Core', 'Restaurant', 'Retail', 'Service', 'Marketing', 'Advanced'];

@Component({
  selector: 'sa-feature-flags',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feature-flags.component.html',
  styleUrls: ['./feature-flags.component.css'],
})
export class FeatureFlagsComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly flags = signal<FeatureFlag[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly categoryFilter = signal<string>('');

  readonly showForm = signal(false);
  readonly editing = signal<FeatureFlag | null>(null);

  readonly form = signal<Partial<FeatureFlag>>({
    key: '',
    label: '',
    description: '',
    category: 'Core',
    defaultValue: false,
  });

  readonly categories = CATEGORIES;

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.flags().filter((f) => {
      if (this.categoryFilter() && f.category !== this.categoryFilter()) return false;
      if (q && !`${f.key} ${f.label} ${f.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.listFeatureFlags().subscribe({
      next: (res) => {
        this.flags.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.set({ key: '', label: '', description: '', category: 'Core', defaultValue: false });
    this.showForm.set(true);
  }

  openEdit(flag: FeatureFlag): void {
    this.editing.set(flag);
    this.form.set({ ...flag });
    this.showForm.set(true);
  }

  save(): void {
    const f = this.form();
    if (!f.key || !f.label) return;
    const op = this.editing()
      ? this.api.updateFeatureFlag(this.editing()!.key, f)
      : this.api.createFeatureFlag(f);
    op.subscribe({
      next: () => {
        this.showForm.set(false);
        this.load();
      },
    });
  }

  updateForm<K extends keyof FeatureFlag>(key: K, value: FeatureFlag[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }
}
