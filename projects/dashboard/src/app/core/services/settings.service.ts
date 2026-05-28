import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import {
  GeneralSettings,
  DeliverySettings,
  SeoSettings,
  SocialLinks,
  BrandingSettings,
  OrderSettings,
  NotificationSettings,
  TaxSettings,
  PaymentSettings,
} from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getGeneral(): Observable<GeneralSettings> {
    return this.http.get<GeneralSettings>(
      `${this.baseUrl}/tenant-admin/settings/general`,
      { withCredentials: true },
    );
  }

  updateGeneral(body: GeneralSettings): Observable<GeneralSettings> {
    return this.http.put<GeneralSettings>(
      `${this.baseUrl}/tenant-admin/settings/general`,
      body,
      { withCredentials: true },
    );
  }

  getDelivery(): Observable<DeliverySettings> {
    return this.http.get<DeliverySettings>(
      `${this.baseUrl}/tenant-admin/settings/delivery`,
      { withCredentials: true },
    );
  }

  updateDelivery(body: DeliverySettings): Observable<DeliverySettings> {
    return this.http.put<DeliverySettings>(
      `${this.baseUrl}/tenant-admin/settings/delivery`,
      body,
      { withCredentials: true },
    );
  }

  getSeo(): Observable<SeoSettings> {
    return this.http.get<SeoSettings>(
      `${this.baseUrl}/tenant-admin/settings/seo`,
      { withCredentials: true },
    );
  }

  updateSeo(body: SeoSettings): Observable<SeoSettings> {
    return this.http.put<SeoSettings>(
      `${this.baseUrl}/tenant-admin/settings/seo`,
      body,
      { withCredentials: true },
    );
  }

  getSocialLinks(): Observable<SocialLinks> {
    return this.http.get<SocialLinks>(
      `${this.baseUrl}/tenant-admin/settings/social-links`,
      { withCredentials: true },
    );
  }

  updateSocialLinks(body: SocialLinks): Observable<SocialLinks> {
    return this.http.put<SocialLinks>(
      `${this.baseUrl}/tenant-admin/settings/social-links`,
      body,
      { withCredentials: true },
    );
  }

  getBranding(): Observable<BrandingSettings> {
    return this.http.get<BrandingSettings>(
      `${this.baseUrl}/tenant-admin/settings/branding`,
      { withCredentials: true },
    );
  }

  updateBranding(body: BrandingSettings): Observable<BrandingSettings> {
    return this.http.put<BrandingSettings>(
      `${this.baseUrl}/tenant-admin/settings/branding`,
      body,
      { withCredentials: true },
    );
  }

  getOrders(): Observable<OrderSettings> {
    return this.http.get<OrderSettings>(
      `${this.baseUrl}/tenant-admin/settings/orders`,
      { withCredentials: true },
    );
  }

  updateOrders(body: OrderSettings): Observable<OrderSettings> {
    return this.http.put<OrderSettings>(
      `${this.baseUrl}/tenant-admin/settings/orders`,
      body,
      { withCredentials: true },
    );
  }

  getNotifications(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(
      `${this.baseUrl}/tenant-admin/settings/notifications`,
      { withCredentials: true },
    );
  }

  updateNotifications(body: NotificationSettings): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(
      `${this.baseUrl}/tenant-admin/settings/notifications`,
      body,
      { withCredentials: true },
    );
  }

  getTax(): Observable<TaxSettings> {
    return this.http.get<TaxSettings>(
      `${this.baseUrl}/tenant-admin/settings/tax`,
      { withCredentials: true },
    );
  }

  updateTax(body: TaxSettings): Observable<TaxSettings> {
    return this.http.put<TaxSettings>(
      `${this.baseUrl}/tenant-admin/settings/tax`,
      body,
      { withCredentials: true },
    );
  }

  getPaymentMethods(): Observable<PaymentSettings> {
    return this.http.get<PaymentSettings>(
      `${this.baseUrl}/tenant-admin/settings/payment-methods`,
      { withCredentials: true },
    );
  }

  updatePaymentMethods(body: PaymentSettings): Observable<PaymentSettings> {
    return this.http.put<PaymentSettings>(
      `${this.baseUrl}/tenant-admin/settings/payment-methods`,
      body,
      { withCredentials: true },
    );
  }
}
