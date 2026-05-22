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
}
