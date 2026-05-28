import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';

export interface WishlistItem {
  id: string;
  productId: string;
  productNameEn: string;
  productNameAr: string;
  price: number;
  imageUrl?: string;
  slug: string;
  categorySlug: string;
}

export interface MoveToCartRequest {
  cartId?: string;
  variantId?: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getWishlist(): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(
      `${this.baseUrl}/storefront/wishlist`,
      { withCredentials: true },
    );
  }

  addItem(productId: string): Observable<WishlistItem> {
    return this.http.post<WishlistItem>(
      `${this.baseUrl}/storefront/wishlist/items`,
      { productId },
      { withCredentials: true },
    );
  }

  removeItem(productId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/storefront/wishlist/items/${productId}`,
      { withCredentials: true },
    );
  }

  moveToCart(productId: string, quantity: number, variantId?: string, cartId?: string): Observable<unknown> {
    const body: MoveToCartRequest = { quantity };
    if (variantId) body.variantId = variantId;
    if (cartId) body.cartId = cartId;
    return this.http.post<unknown>(
      `${this.baseUrl}/storefront/wishlist/items/${productId}/move-to-cart`,
      body,
      { withCredentials: true },
    );
  }
}
