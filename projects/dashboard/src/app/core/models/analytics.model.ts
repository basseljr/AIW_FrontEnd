export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  newCustomers: number;
}

export interface SalesByPeriodPoint {
  periodStartUtc: string;
  revenue: number;
  ordersCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface OrdersByStatus {
  status: string;
  ordersCount: number;
}

export interface RevenueByPaymentMethod {
  paymentMethod: string;
  revenue: number;
  ordersCount: number;
}

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

// --- Detail DTOs ---

export interface RevenueOverTimePoint {
  date: string;
  total: number;
  net: number;
  refunds: number;
}

export interface RevenueByCategoryItem {
  categoryName: string;
  revenue: number;
  percentage: number;
}

export interface RevenueDetail {
  totalRevenue: number;
  deliveryRevenue: number;
  deliveryRevenuePercent: number;
  pickupRevenue: number;
  pickupRevenuePercent: number;
  dineInRevenue: number;
  dineInRevenuePercent: number;
  totalDiscounts: number;
  netRevenue: number;
  taxCollected: number;
  refundsIssued: number;
  revenueOverTime: RevenueOverTimePoint[];
  revenueByCategory: RevenueByCategoryItem[];
}

export interface CancellationReason {
  reason: string;
  count: number;
}

export interface OrdersDetail {
  totalOrders: number;
  completedOrders: number;
  completedPercent: number;
  cancelledOrders: number;
  cancelledPercent: number;
  avgOrderValue: number;
  busiestDay: string;
  busiestHour: number;
  deliveryOrders: number;
  pickupOrders: number;
  dineInOrders: number;
  cancellationReasons: CancellationReason[];
}

export interface TopCustomer {
  name: string;
  orders: number;
  totalSpent: number;
  lastOrder: string | null;
}

export interface CustomersDetail {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  returningPercent: number;
  guestOrders: number;
  guestPercent: number;
  avgOrdersPerCustomer: number;
  customerLifetimeValue: number;
  topCustomers: TopCustomer[];
}

export interface ProductSalesItem {
  itemName: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
}

export interface CategoryPerformanceItem {
  categoryName: string;
  revenue: number;
  orderCount: number;
}

export interface ProductsDetail {
  topSellers: ProductSalesItem[];
  slowMovers: ProductSalesItem[];
  categoryPerformance: CategoryPerformanceItem[];
}

export type AnalyticsTab = 'revenue' | 'orders' | 'customers' | 'products';
