import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { CartItem, SelectedModifier } from '../models/catalog.model';
import { ApiCartResponse, ApiCartItemResponse } from '../models/checkout.model';

function sameItem(
  a: CartItem,
  variantId: string | undefined,
  modifiers: SelectedModifier[] | undefined,
): boolean {
  if (a.selectedVariantId !== variantId) return false;
  const aMods = JSON.stringify(
    (a.selectedModifiers ?? []).map((m) => m.optionId).sort(),
  );
  const bMods = JSON.stringify(
    (modifiers ?? []).map((m) => m.optionId).sort(),
  );
  return aMods === bMods;
}

function mapApiItem(api: ApiCartItemResponse): CartItem {
  return {
    cartItemId: api.cartItemId,
    itemId: api.productId,
    slug: '',
    categorySlug: '',
    nameEn: api.name,
    nameAr: api.nameAr,
    imageUrl: api.imageUrl,
    price: api.unitPrice,
    quantity: api.quantity,
    selectedVariantId: api.variantId ?? undefined,
    specialInstructions: api.notes ?? undefined,
    selectedModifiers: api.modifiersJson
      ? (() => { try { return JSON.parse(api.modifiersJson!); } catch { return undefined; } })()
      : undefined,
  };
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _items = signal<CartItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _cartId = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly cartId = this._cartId.asReadonly();

  readonly count = computed(() =>
    this._items().reduce((s, i) => s + i.quantity, 0),
  );

  readonly total = computed(() =>
    this._items().reduce((s, i) => {
      const modTotal = (i.selectedModifiers ?? []).reduce(
        (m, mod) => m + mod.price,
        0,
      );
      return s + (i.price + modTotal) * i.quantity;
    }, 0),
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromApi();
    }
  }

  private applyApiResponse(res: ApiCartResponse | null): void {
    if (res?.items) {
      this._items.set(res.items.map(mapApiItem));
    }
    if (res?.cartId) {
      this._cartId.set(res.cartId);
    }
  }

  private loadFromApi(): void {
    this._loading.set(true);
    this.http
      .get<ApiCartResponse>(`${this.baseUrl}/storefront/cart`, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        this.applyApiResponse(res);
        this._loading.set(false);
      });
  }

  /** Reloads cart from the API (e.g. after login to merge guest cart). */
  reload(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromApi();
    }
  }

  addItem(item: CartItem): void {
    // Optimistic local update
    this._items.update((current) => {
      const idx = current.findIndex(
        (c) =>
          c.itemId === item.itemId &&
          sameItem(c, item.selectedVariantId, item.selectedModifiers),
      );
      if (idx >= 0) {
        const updated = [...current];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
        return updated;
      }
      return [...current, item];
    });

    if (isPlatformBrowser(this.platformId)) {
      const payload: Record<string, unknown> = {
        productId: item.itemId,
        quantity: item.quantity,
      };
      if (item.selectedVariantId != null) payload['variantId'] = item.selectedVariantId;
      if (item.selectedModifiers?.length) payload['selectedModifiers'] = item.selectedModifiers;
      if (item.specialInstructions) payload['notes'] = item.specialInstructions;

      this.http
        .post<ApiCartResponse>(`${this.baseUrl}/storefront/cart/items`, payload, { withCredentials: true })
        .pipe(catchError(() => of(null)))
        .subscribe((res) => this.applyApiResponse(res));
    }
  }

  removeItem(itemId: string, variantId?: string): void {
    const target = this._items().find(
      (c) => c.itemId === itemId && c.selectedVariantId === variantId,
    );

    this._items.update((current) =>
      current.filter(
        (c) => !(c.itemId === itemId && c.selectedVariantId === variantId),
      ),
    );

    if (isPlatformBrowser(this.platformId) && target?.cartItemId) {
      this.http
        .delete<ApiCartResponse>(
          `${this.baseUrl}/storefront/cart/items/${target.cartItemId}`,
          { withCredentials: true },
        )
        .pipe(catchError(() => of(null)))
        .subscribe((res) => this.applyApiResponse(res));
    }
  }

  updateQuantity(itemId: string, quantity: number, variantId?: string): void {
    if (quantity <= 0) {
      this.removeItem(itemId, variantId);
      return;
    }
    const target = this._items().find(
      (c) => c.itemId === itemId && c.selectedVariantId === variantId,
    );

    this._items.update((current) =>
      current.map((c) =>
        c.itemId === itemId && c.selectedVariantId === variantId
          ? { ...c, quantity }
          : c,
      ),
    );

    if (isPlatformBrowser(this.platformId) && target?.cartItemId) {
      this.http
        .put<ApiCartResponse>(
          `${this.baseUrl}/storefront/cart/items/${target.cartItemId}`,
          { quantity },
          { withCredentials: true },
        )
        .pipe(catchError(() => of(null)))
        .subscribe((res) => this.applyApiResponse(res));
    }
  }

  clear(): void {
    this._items.set([]);
    if (isPlatformBrowser(this.platformId)) {
      this.http
        .delete<void>(`${this.baseUrl}/storefront/cart`, { withCredentials: true })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }
}
