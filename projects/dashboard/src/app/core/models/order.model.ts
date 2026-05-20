export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type OrderType = 'delivery' | 'pickup' | 'dine_in';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface OrderListItem {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  itemsCount: number;
  totalAmount: number;
  createdAt: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  isGuestCustomer: boolean;
  paymentStatus: PaymentStatus;
}

export interface OrderListResult {
  items: OrderListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface OrderCustomer {
  customerId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  isGuestCustomer: boolean;
}

export interface OrderIncentives {
  couponCode: string | null;
  walletAmountApplied: number;
  loyaltyPointsRedeemed: number;
}

export interface OrderLineItem {
  orderItemId: string;
  productId: string;
  variantId: string | null;
  nameEn: string;
  nameAr: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiersJson: string | null;
  notes: string | null;
  itemStatus: string;
}

export interface PaymentDetail {
  paymentTransactionId: string;
  gateway: string;
  operationType: string;
  amount: number;
  currency: string;
  status: string;
  gatewayPaymentId: string | null;
  gatewayTransactionId: string | null;
  processedAt: string | null;
}

export interface OrderDetail {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  branchId: string;
  branchNameEn: string | null;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  notes: string | null;
  addressJson: string | null;
  createdAt: string;
  updatedAt: string;
  customer: OrderCustomer;
  incentives: OrderIncentives;
  lineItems: OrderLineItem[];
  paymentDetails: PaymentDetail[];
}

export interface OrderFilters {
  search?: string;
  status?: string;
  orderType?: string;
  paymentStatus?: string;
  branchId?: string;
  fromUtc?: string;
  toUtc?: string;
  cursor?: string;
  limit?: number;
}

export interface UpdateOrderStatusRequest {
  newStatus: string;
  cancellationReason?: string;
}

export interface ParsedAddress {
  customerName?: string;
  customerPhone?: string;
  block?: string;
  street?: string;
  area?: string;
  city?: string;
  apartment?: string;
  instructions?: string;
}
