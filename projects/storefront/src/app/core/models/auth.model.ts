export interface AuthResponse {
  customerId: string;
  tenantId: string;
  role: string;
  isEmailVerified: boolean;
  accessTokenExpiresAt: string;
  cartId: string | null;
}

export interface CustomerProfile {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  phone: string | null;
  phoneCountryCode: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletionRequestedAt: string | null;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string;
  fullName: string | null;
  phone: string | null;
  country: string;
  governorate: string;
  street: string;
  block: string;
  building: string | null;
  apartment: string | null;
  area: string;
  city: string;
  additionalInfo: string | null;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  totalAmount: number;
  currency: string;
  placedAt: string;
}

export interface OrderHistoryResponse {
  items: OrderSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
}
