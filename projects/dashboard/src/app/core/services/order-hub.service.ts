import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';

import { API_BASE_URL } from '@shared/api';
import { OrderListItem, OrderStatus } from '../models/order.model';
import { DashboardAuthService } from '../services/dashboard-auth.service';

export interface OrderHubNewOrderEvent {
  orderId: string;
  tenantId: string;
  branchId: string;
  orderNumber: string;
  orderType: string;
  customerName: string | null;
  itemCount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderHubStatusChangedEvent {
  orderId: string;
  tenantId: string;
  branchId: string;
  newStatus: OrderStatus;
  previousStatus: string | null;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class OrderHubService implements OnDestroy {
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly auth = inject(DashboardAuthService);
  private connection: signalR.HubConnection | null = null;

  readonly connected = signal(false);
  readonly newOrderEvents = signal<OrderHubNewOrderEvent[]>([]);
  readonly statusChangedEvents = signal<OrderHubStatusChangedEvent[]>([]);

  connect(branchId?: string): void {
    if (this.connection) return;

    let hubUrl = this.baseUrl.replace('/api/v1', '') + '/hubs/orders';
    if (branchId) hubUrl += `?branchId=${branchId}`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
        accessTokenFactory: () => this.auth.getToken(),
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on('NewOrder', (data: OrderHubNewOrderEvent) => {
      this.newOrderEvents.update((ev) => [data, ...ev]);
    });

    this.connection.on('OrderStatusChanged', (data: OrderHubStatusChangedEvent) => {
      this.statusChangedEvents.update((ev) => [data, ...ev]);
    });

    this.connection.on('ReconnectPolicy', (_data: unknown) => {});

    this.connection.onreconnected(() => this.connected.set(true));
    this.connection.onclose(() => this.connected.set(false));

    this.connection.start()
      .then(() => this.connected.set(true))
      .catch(() => this.connected.set(false));
  }

  disconnect(): void {
    if (!this.connection) return;
    this.connection.stop().then(() => {
      this.connection = null;
      this.connected.set(false);
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
