export type DashboardRole = 'owner' | 'manager' | 'staff' | 'kitchen' | 'accountant';
export type BusinessType = 'restaurant' | 'retail' | 'service';

export interface DashboardUser {
  userId: string;
  tenantId: string;
  role: DashboardRole;
  email: string;
}

export interface LoginRequest {
  tenantId: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  tenantId: string;
  role: DashboardRole;
  accessTokenExpiresAt: string;
  cartId: string | null;
}
