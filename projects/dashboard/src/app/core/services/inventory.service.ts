import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import {
  ProductVariant,
  VariantRequest,
  VariantInventory,
  InventoryUpdateRequest,
} from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  // ── Variants ────────────────────────────────────────────────────────────────

  getVariants(productId: string): Observable<ProductVariant[]> {
    return this.http.get<ProductVariant[]>(
      `${this.baseUrl}/tenant-admin/products/${productId}/variants`,
      { withCredentials: true },
    );
  }

  createVariant(productId: string, body: VariantRequest): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(
      `${this.baseUrl}/tenant-admin/products/${productId}/variants`,
      body,
      { withCredentials: true },
    );
  }

  updateVariant(productId: string, variantId: string, body: VariantRequest): Observable<ProductVariant> {
    return this.http.put<ProductVariant>(
      `${this.baseUrl}/tenant-admin/products/${productId}/variants/${variantId}`,
      body,
      { withCredentials: true },
    );
  }

  deleteVariant(productId: string, variantId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/tenant-admin/products/${productId}/variants/${variantId}`,
      { withCredentials: true },
    );
  }

  // ── Inventory ────────────────────────────────────────────────────────────────

  getInventory(productId: string, variantId: string, branchId?: string): Observable<VariantInventory> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<VariantInventory>(
      `${this.baseUrl}/tenant-admin/products/${productId}/variants/${variantId}/inventory`,
      { params, withCredentials: true },
    );
  }

  updateInventory(
    productId: string,
    variantId: string,
    body: InventoryUpdateRequest,
  ): Observable<VariantInventory> {
    return this.http.put<VariantInventory>(
      `${this.baseUrl}/tenant-admin/products/${productId}/variants/${variantId}/inventory`,
      body,
      { withCredentials: true },
    );
  }
}
