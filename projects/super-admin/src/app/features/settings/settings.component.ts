import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import {
  AnnouncementRow,
  BroadcastAnnouncementRequest,
  EmailTemplateRow,
  PlatformSettings,
  SmsTemplateRow,
} from '../../core/models/super-admin-api.models';

type Section = 'general' | 'email' | 'sms' | 'broadcast';

@Component({
  selector: 'sa-settings',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly section = signal<Section>('general');
  readonly settings = signal<PlatformSettings | null>(null);
  readonly emailTemplates = signal<EmailTemplateRow[]>([]);
  readonly smsTemplates = signal<SmsTemplateRow[]>([]);
  readonly loading = signal(true);
  readonly saved = signal(false);

  readonly editingEmail = signal<EmailTemplateRow | null>(null);
  readonly editingSms = signal<SmsTemplateRow | null>(null);

  readonly broadcast = signal<BroadcastAnnouncementRequest>({
    subjectEn: '',
    subjectAr: '',
    bodyEn: '',
    bodyAr: '',
    channels: ['email'],
    audience: 'all',
  });

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      settings: this.api.getSettings(),
      emails: this.api.listEmailTemplates(),
      sms: this.api.listSmsTemplates(),
    }).subscribe({
      next: ({ settings, emails, sms }) => {
        this.settings.set(settings);
        this.emailTemplates.set(emails);
        this.smsTemplates.set(sms);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setSection(s: Section): void { this.section.set(s); }

  updateSettings<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]): void {
    this.settings.update((s) => (s ? { ...s, [key]: value } : s));
  }

  saveSettings(): void {
    const s = this.settings();
    if (!s) return;
    this.api.updateSettings(s).subscribe({
      next: () => {
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2000);
      },
    });
  }

  openEmail(t: EmailTemplateRow): void { this.editingEmail.set({ ...t }); }
  openSms(t: SmsTemplateRow): void { this.editingSms.set({ ...t }); }

  saveEmail(): void {
    const t = this.editingEmail();
    if (!t) return;
    this.api.updateEmailTemplate(t.key, t).subscribe(() => {
      this.editingEmail.set(null);
      this.api.listEmailTemplates().subscribe((r) => this.emailTemplates.set(r));
    });
  }

  saveSms(): void {
    const t = this.editingSms();
    if (!t) return;
    this.api.updateSmsTemplate(t.key, t).subscribe(() => {
      this.editingSms.set(null);
      this.api.listSmsTemplates().subscribe((r) => this.smsTemplates.set(r));
    });
  }

  updateEmail<K extends keyof EmailTemplateRow>(key: K, value: EmailTemplateRow[K]): void {
    this.editingEmail.update((t) => (t ? { ...t, [key]: value } : t));
  }

  updateSms<K extends keyof SmsTemplateRow>(key: K, value: SmsTemplateRow[K]): void {
    this.editingSms.update((t) => (t ? { ...t, [key]: value } : t));
  }

  updateBroadcast<K extends keyof BroadcastAnnouncementRequest>(key: K, value: BroadcastAnnouncementRequest[K]): void {
    this.broadcast.update((b) => ({ ...b, [key]: value }));
  }

  toggleChannel(ch: 'email' | 'dashboard'): void {
    this.broadcast.update((b) => {
      const next = new Set(b.channels);
      if (next.has(ch)) next.delete(ch); else next.add(ch);
      return { ...b, channels: Array.from(next) };
    });
  }

  sendBroadcast(): void {
    const b = this.broadcast();
    if (!b.subjectEn || !b.bodyEn) return;
    if (!confirm('Send this announcement to all matching tenants?')) return;
    this.api.broadcastAnnouncement(b).subscribe({
      next: (res) => {
        alert(`Sent to ${res.recipients} recipients`);
        this.broadcast.set({
          subjectEn: '', subjectAr: '', bodyEn: '', bodyAr: '',
          channels: ['email'], audience: 'all',
        });
      },
    });
  }
}
