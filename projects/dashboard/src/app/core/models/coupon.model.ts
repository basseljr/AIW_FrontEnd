// ── Coupon ─────────────────────────────────────────────────────────────────────

export type CouponDiscountType = 'percentage' | 'fixed' | 'free_delivery';

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  appliesTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponRequest {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
}
