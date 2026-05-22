// ── General Settings ───────────────────────────────────────────────────────────

export interface BusinessHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface GeneralSettings {
  preparationTime: number;
  businessHours: BusinessHour[];
}

// ── Delivery Settings ──────────────────────────────────────────────────────────

export interface DeliverySettings {
  minOrderAmount: number;
  freeDeliveryThreshold: number | null;
}

// ── SEO Settings ───────────────────────────────────────────────────────────────

export interface SeoSettings {
  metaTitleEn: string | null;
  metaTitleAr: string | null;
  metaDescriptionEn: string | null;
  metaDescriptionAr: string | null;
  keywords: string | null;
}

// ── Social Links ───────────────────────────────────────────────────────────────

export interface SocialLinks {
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  whatsapp: string | null;
  tiktok: string | null;
}

// ── Branding ───────────────────────────────────────────────────────────────────

export interface BrandingSettings {
  logoUrl: string | null;
  faviconUrl: string | null;
  coverPhotoUrl: string | null;
  primaryColor: string | null;
  headerFooterColor: string | null;
}

// ── Loyalty ────────────────────────────────────────────────────────────────────

export interface LoyaltySettings {
  earnRate: number;
  redeemRate: number;
  minRedeemPoints: number;
}
