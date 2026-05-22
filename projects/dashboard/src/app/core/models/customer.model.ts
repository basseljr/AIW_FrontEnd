// ── Customer List ──────────────────────────────────────────────────────────────

export interface CustomerListItem {
  customerId: string;
  name: string;
  email: string;
  phone: string | null;
  blacklisted: boolean;
  orderCount: number;
  totalSpent: number;
}

export interface CustomerListResult {
  items: CustomerListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ── Customer Detail ────────────────────────────────────────────────────────────

export interface CustomerOrderHistoryItem {
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  createdAt: string;
}

export interface CustomerAddress {
  addressId: string;
  label: string | null;
  street: string | null;
  block: string | null;
  area: string | null;
  city: string | null;
  building: string | null;
  apartment: string | null;
  isDefault: boolean;
}

export interface CustomerDetail {
  customerId: string;
  name: string;
  email: string;
  phone: string | null;
  phoneCountryCode: string | null;
  isActive: boolean;
  blacklisted: boolean;
  blacklistReason: string | null;
  blacklistedAt: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  loyaltyBalance: number;
  orderHistory: CustomerOrderHistoryItem[];
  addresses: CustomerAddress[];
}

// ── Customer Notes ─────────────────────────────────────────────────────────────

export interface CustomerNote {
  id: string;
  text: string;
  staffName: string;
  createdAt: string;
}

// ── Blacklist ──────────────────────────────────────────────────────────────────

export interface BlacklistedCustomer {
  customerId: string;
  name: string;
  email: string;
  phone: string | null;
  reason: string;
  blacklistedAt: string;
  blacklistedByUserId: string | null;
  blacklistedByName: string | null;
}
