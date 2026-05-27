import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { SuperAdminUserRow } from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-users',
  standalone: true,
  imports: [FormsModule, DatePipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly users = signal<SuperAdminUserRow[]>([]);
  readonly loading = signal(true);

  readonly showInvite = signal(false);
  readonly inviteName = signal('');
  readonly inviteEmail = signal('');
  readonly inviteRole = signal<string>('support_agent');

  readonly editingUser = signal<SuperAdminUserRow | null>(null);

  readonly roles = ['super_admin', 'support_agent', 'finance', 'developer'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.listSuperAdminUsers().subscribe({
      next: (res) => {
        this.users.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  sendInvite(): void {
    if (!this.inviteEmail() || !this.inviteName()) return;
    this.api
      .inviteSuperAdmin({
        name: this.inviteName(),
        email: this.inviteEmail(),
        role: this.inviteRole(),
      })
      .subscribe({
        next: () => {
          this.showInvite.set(false);
          this.inviteName.set('');
          this.inviteEmail.set('');
          this.inviteRole.set('support_agent');
          this.load();
        },
      });
  }

  openEdit(user: SuperAdminUserRow): void {
    this.editingUser.set({ ...user });
  }

  saveEdit(): void {
    const u = this.editingUser();
    if (!u) return;
    this.api
      .updateSuperAdmin(u.id, { name: u.name, role: u.role, status: u.status })
      .subscribe({
        next: () => {
          this.editingUser.set(null);
          this.load();
        },
      });
  }

  resetMfa(user: SuperAdminUserRow): void {
    if (!confirm(`Reset MFA for ${user.email}?`)) return;
    this.api.resetMfa(user.id).subscribe(() => this.load());
  }

  forceLogout(user: SuperAdminUserRow): void {
    if (!confirm(`Force logout all sessions for ${user.email}?`)) return;
    this.api.forceLogout(user.id).subscribe();
  }

  updateEditing<K extends keyof SuperAdminUserRow>(key: K, value: SuperAdminUserRow[K]): void {
    this.editingUser.update((u) => (u ? { ...u, [key]: value } : u));
  }
}
