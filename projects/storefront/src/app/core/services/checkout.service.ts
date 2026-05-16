import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { CartItem } from '../models/catalog.model';

import { API_BASE_URL } from '@shared/api';
import {
  CheckoutPayload,
  SetCheckoutDetailsPayload,
  PaymentInitResponse,
  OrderConfirmation,
  PaymentMethodOption,
  StorefrontBranch,
  DeliveryZone,
} from '../models/checkout.model';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getBranches(): Observable<StorefrontBranch[]> {
    return this.http
      .get<StorefrontBranch[]>(`${this.baseUrl}/storefront/branches`, {
        withCredentials: true,
      })
      .pipe(catchError(() => of([])));
  }

  getDeliveryZones(branchId: string): Observable<DeliveryZone[]> {
    return this.http
      .get<DeliveryZone[]>(`${this.baseUrl}/storefront/delivery-zones?branchId=${branchId}`, {
        withCredentials: true,
      })
      .pipe(catchError(() => of([])));
  }

  setCheckoutDetails(payload: SetCheckoutDetailsPayload): Observable<{ checkoutStep: string } | null> {
    return this.http
      .post<{ checkoutStep: string }>(`${this.baseUrl}/storefront/checkout/details`, payload, {
        withCredentials: true,
      })
      .pipe(catchError(() => of(null)));
  }

  getPaymentMethods(): Observable<PaymentMethodOption[]> {
    return this.http
      .get<PaymentMethodOption[]>(`${this.baseUrl}/storefront/payment-methods`, {
        withCredentials: true,
      })
      .pipe(catchError(() => of([])));
  }

  initiatePayment(payload: CheckoutPayload): Observable<PaymentInitResponse> {
    return this.http.post<PaymentInitResponse>(
      `${this.baseUrl}/storefront/checkout/payment`,
      payload,
      { withCredentials: true },
    );
  }

  getConfirmation(orderId: string): Observable<OrderConfirmation | null> {
    return this.http
      .get<{ checkoutStep: string; order: Record<string, unknown> }>(
        `${this.baseUrl}/storefront/checkout/confirmation/${orderId}`,
        { withCredentials: true },
      )
      .pipe(
        map(res => {
          if (!res?.order) return null;
          const o = res.order;
          const items: CartItem[] = ((o['items'] ?? []) as Record<string, unknown>[]).map(i => ({
            itemId: (i['productId'] ?? i['id']) as string,
            slug: '',
            categorySlug: '',
            nameEn: (i['nameEn'] ?? '') as string,
            nameAr: (i['nameAr'] ?? '') as string,
            imageUrl: i['imageUrl'] as string | undefined,
            price: (i['unitPrice'] ?? 0) as number,
            quantity: (i['quantity'] ?? 0) as number,
          }));
          return {
            orderId: o['id'] as string,
            orderNumber: o['orderNumber'] as string,
            status: o['status'] as string,
            estimatedMinutes: o['estimatedMinutes'] as number | undefined,
            items,
            subtotal: o['subtotal'] as number,
            deliveryFee: o['deliveryFee'] as number,
            discount: (o['discountAmount'] ?? 0) as number,
            total: (o['totalAmount'] ?? 0) as number,
            orderType: o['orderType'] as string,
            paymentMethod: o['paymentMethod'] as string,
            createdAt: (o['placedAt'] ?? '') as string,
            trackingToken: o['trackingToken'] as string | undefined,
          } satisfies OrderConfirmation;
        }),
        catchError(() => of(null)),
      );
  }
}
