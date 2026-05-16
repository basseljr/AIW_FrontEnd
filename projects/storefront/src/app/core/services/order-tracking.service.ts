import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { TrackingStatus } from '../models/checkout.model';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

@Injectable({ providedIn: 'root' })
export class OrderTrackingService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private connection: any = null;
  private readonly _status = new BehaviorSubject<TrackingStatus | null>(null);
  private readonly _connectionState = new BehaviorSubject<ConnectionState>('disconnected');

  readonly status$: Observable<TrackingStatus | null> = this._status.asObservable();
  readonly connectionState$: Observable<ConnectionState> = this._connectionState.asObservable();

  async connect(orderId: string, token: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    this._connectionState.next('connecting');

    // Run SignalR entirely outside Angular's zone so pending WebSocket
    // connections don't prevent the app from becoming stable (NG0506).
    await this.ngZone.runOutsideAngular(async () => {
      const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr');

      this.connection = new HubConnectionBuilder()
        .withUrl(`/hubs/tracking?orderId=${orderId}&token=${encodeURIComponent(token)}`)
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000, 60000])
        .configureLogging(LogLevel.Warning)
        .build();

      // Hub sends "OrderStatusChanged" — JS client normalizes names to lowercase
      this.connection.on('OrderStatusChanged', (update: TrackingStatus) => {
        this.ngZone.run(() => this._status.next(update));
      });

      // Acknowledge server reconnect policy without action (withAutomaticReconnect handles it)
      this.connection.on('ReconnectPolicy', () => { /* no-op */ });

      this.connection.on('error', (message: string) => {
        console.warn('SignalR error from server:', message);
      });

      this.connection.onreconnecting(() => {
        this.ngZone.run(() => this._connectionState.next('reconnecting'));
      });

      this.connection.onreconnected(async () => {
        this.ngZone.run(() => this._connectionState.next('connected'));
        await this.connection.invoke('SubscribeToOrder', token);
      });

      this.connection.onclose(() => {
        this.ngZone.run(() => this._connectionState.next('disconnected'));
      });

      try {
        await this.connection.start();
        this.ngZone.run(() => this._connectionState.next('connected'));
        await this.connection.invoke('SubscribeToOrder', token);
      } catch {
        this.ngZone.run(() => this._connectionState.next('failed'));
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
    this._status.next(null);
    this._connectionState.next('disconnected');
  }
}
