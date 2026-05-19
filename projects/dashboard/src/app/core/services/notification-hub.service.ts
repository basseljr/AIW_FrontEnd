import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';

import { API_BASE_URL } from '@shared/api';

export interface DashboardNotification {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationHubService implements OnDestroy {
  private readonly baseUrl = inject(API_BASE_URL);
  private connection: signalR.HubConnection | null = null;

  readonly unreadCount = signal(0);
  readonly notifications = signal<DashboardNotification[]>([]);
  readonly connected = signal(false);

  connect(): void {
    if (this.connection) return;

    const hubUrl = this.baseUrl.replace('/api/v1', '') + '/hubs/notifications';

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on('ReceiveNotification', (notification: DashboardNotification) => {
      this.notifications.update((list) => [notification, ...list]);
      this.unreadCount.update((n) => n + 1);
    });

    this.connection.on('UnreadCount', (count: number) => {
      this.unreadCount.set(count);
    });

    this.connection.on('reconnectpolicy', (_data: unknown) => {});

    this.connection.onreconnected(() => this.connected.set(true));
    this.connection.onclose(() => this.connected.set(false));

    this.connection.start().then(() => this.connected.set(true)).catch(() => {
      this.connected.set(false);
    });
  }

  disconnect(): void {
    if (!this.connection) return;
    this.connection.stop().then(() => {
      this.connection = null;
      this.connected.set(false);
    });
  }

  markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
    this.unreadCount.set(0);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
