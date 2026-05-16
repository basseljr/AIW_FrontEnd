import { CartItem } from './catalog.model';

export type OrderType = 'delivery' | 'pickup';

export interface CheckoutDeliveryDetails {
  orderType: OrderType;
  fullName: string;
  phone: string;
  email: string;
  // Structured address fields (Kuwait format)
  block: string;
  street: string;
  area: string;
  city: string;
  apartment?: string;
  lat?: number;
  lng?: number;
  deliveryInstructions?: string;
  deliveryTime: 'asap' | string;
  orderNotes?: string;
}

export interface CheckoutAddress {
  street: string;
  block: string;
  area: string;
  city: string;
  apartment?: string;
  instructions?: string;
}

export interface StorefrontBranch {
  id: string;
  nameEn: string;
  nameAr: string;
  address?: string;
}

export interface DeliveryZone {
  id: string;
  nameEn: string;
  nameAr: string;
  deliveryFee: number;
  minOrder: number;
  estimatedTimeMinutes: number;
}

export interface PaymentMethodOption {
  key: string;
  label: string;
  labelAr?: string;
  iconUrl?: string;
}

export interface SetCheckoutDetailsPayload {
  cartId: string | null;
  orderType: OrderType;
  branchId: string;
  deliveryZoneId: string | null;
  deliveryAddress: CheckoutAddress | null;
  customerEmail?: string;
  notes?: string;
}

export interface CheckoutPayload {
  cartId: string | null;
  branchId: string;
  orderType: OrderType;
  deliveryZoneId: string | null;
  deliveryAddress?: CheckoutAddress;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  couponCode?: string;
  providerKey: string;
  successUrl: string;
  failUrl: string;
  webhookUrl: string;
  language: string;
}

export interface PaymentInitResponse {
  cartId: string;
  checkoutStep: string;
  paymentInitiated: boolean;
  paymentUrl: string | null;
  hostedFormToken: string | null;
  gatewayPaymentId: string | null;
  paymentErrorMessage: string | null;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: string;
    trackingToken?: string;
  };
}

export interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  status: string;
  estimatedMinutes?: number;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  deliveryAddress?: string;
  orderType: string;
  paymentMethod: string;
  createdAt: string;
  trackingToken?: string;
}

export interface TrackingTimelineStep {
  status: string;
  label: string;
  labelAr: string;
  completedAt: string | null;
}

export interface TrackingStatus {
  orderId: string;
  orderNumber: string;
  orderType: string;
  status: string;
  statusLabel: string;
  statusLabelAr: string;
  timeline: TrackingTimelineStep[];
  estimatedMinutes?: number;
  businessName?: string;
  businessPhone?: string;
}

export interface ApiCartItemResponse {
  cartItemId: string;
  productId: string;
  variantId: string | null;
  name: string;
  nameAr: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiersJson: string | null;
  notes: string | null;
}

export interface ApiCartResponse {
  cartId: string;
  items: ApiCartItemResponse[];
  subtotal: number;
  deliveryFee: number | null;
  discount: number;
  total: number;
}
