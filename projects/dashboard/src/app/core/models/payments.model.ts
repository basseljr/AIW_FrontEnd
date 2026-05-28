export interface PaymentTransaction {
  id: string;
  transactionId: string;
  orderId: string | null;
  orderNumber: string;
  customerName: string;
  amount: number;
  currency: string;
  gateway: string;
  operationType: string;
  status: string;
  gatewayPaymentId: string | null;
  gatewayTransactionId: string | null;
  processedAt: string | null;
}

export interface PaymentTransactionDetail extends PaymentTransaction {
  requestPayload: string | null;
  responsePayload: string | null;
  createdAt: string;
}

export interface PaymentListResult {
  items: PaymentTransaction[];
  totalCount: number;
  totalRevenue: number;
  successfulCount: number;
  failedCount: number;
  refundCount: number;
}

export interface PaymentFilters {
  startDate: string;
  endDate: string;
  method: string;
  status: string;
  search: string;
  page: number;
  pageSize: number;
}

export interface PaymentSummary {
  totalRevenue: number;
  successfulCount: number;
  failedCount: number;
  refundCount: number;
  totalCount: number;
}
