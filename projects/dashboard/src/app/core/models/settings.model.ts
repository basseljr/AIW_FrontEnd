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
  googleAnalyticsId: string | null;
  facebookPixelId: string | null;
  canonicalUrl: string | null;
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

// ── Order Settings ─────────────────────────────────────────────────────────────

export interface OrderSettings {
  autoConfirmOrders: boolean;
  allowDelivery: boolean;
  allowPickup: boolean;
  allowDineIn: boolean;
  orderNumberPrefix: string | null;
  schedulingEnabled: boolean;
}

// ── Loyalty ────────────────────────────────────────────────────────────────────

export interface LoyaltySettings {
  isEnabled: boolean;
  pointsName: string;
  earnRate: number;
  redeemRate: number;
  minRedeemPoints: number;
}

// ── Tax Settings ────────────────────────────────────────────────────────────────

export interface TaxSettings {
  isEnabled: boolean;
  taxNameEn: string | null;
  taxNameAr: string | null;
  taxRate: number;
  taxInclusive: boolean;
  registrationNumber: string | null;
}

// ── Notification Settings ──────────────────────────────────────────────────────

export interface NotificationChannelSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface NotificationSettings {
  newOrder: NotificationChannelSettings;
  orderStatusUpdate: NotificationChannelSettings;
  newCustomer: NotificationChannelSettings;
  lowStock: NotificationChannelSettings;
  paymentReceived: NotificationChannelSettings;
  orderCancelled: NotificationChannelSettings;
}

// ── Payment Settings ───────────────────────────────────────────────────────────

export interface PaymentMethod {
  key: string;
  isEnabled: boolean;
}

export interface PaymentSettings {
  methods: PaymentMethod[];
}
