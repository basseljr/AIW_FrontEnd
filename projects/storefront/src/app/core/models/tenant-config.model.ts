export type BusinessType = 'restaurant' | 'retail' | 'service';
export type TenantStatus = 'active' | 'suspended' | 'building' | 'preview' | 'cancelled';

export interface TenantTheme {
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorHeaderFooter: string;
  fontFamily: string;
  borderRadius: 'sm' | 'md' | 'lg';
}

export interface TenantBranding {
  logoUrl: string | null;
  faviconUrl: string | null;
  businessName: string;
  businessNameAr: string;
  tagline: string | null;
  taglineAr: string | null;
  coverPhotoUrl: string | null;
}

export interface TenantSocialLinks {
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  whatsapp: string | null;
  tiktok: string | null;
}

export interface TenantNavLink {
  labelEn: string;
  labelAr: string;
  path: string;
}

export interface TenantContact {
  phone: string | null;
  email: string | null;
  address: string | null;
  addressAr: string | null;
  workingHours: string | null;
  workingHoursAr: string | null;
}

export interface TenantSeoSettings {
  metaDescriptionEn: string | null;
  metaDescriptionAr: string | null;
  ogImageUrl: string | null;
  googleAnalyticsId: string | null;
}

export interface TenantConfig {
  tenantId: string;
  slug: string;
  businessType: BusinessType;
  status: TenantStatus;
  defaultLanguage: 'en' | 'ar';
  template: string;
  theme: TenantTheme;
  branding: TenantBranding;
  socialLinks: TenantSocialLinks;
  navLinks: TenantNavLink[];
  contact: TenantContact;
  seo: TenantSeoSettings;
  featuresJson: Record<string, boolean>;
  primaryDomain: string;
}

/** Default tenant used in development when the API is unreachable. */
export const DEFAULT_DEV_TENANT: TenantConfig = {
  tenantId: '00000000-0000-0000-0000-000000000001',
  slug: 'golden-oasis',
  businessType: 'restaurant',
  status: 'active',
  defaultLanguage: 'en',
  template: 'restaurant-classic',
  theme: {
    colorPrimary: '#805600',
    colorSecondary: '#457B9D',
    colorBackground: '#fff8f1',
    colorHeaderFooter: '#1e1b17',
    fontFamily: 'Inter',
    borderRadius: 'lg',
  },
  branding: {
    logoUrl: null,
    faviconUrl: null,
    businessName: 'The Golden Oasis',
    businessNameAr: 'الواحة الذهبية',
    tagline: 'Authentic Middle Eastern Cuisine',
    taglineAr: 'مطبخ شرق أوسطي أصيل',
    coverPhotoUrl: null,
  },
  socialLinks: {
    instagram: '#',
    twitter: '#',
    facebook: '#',
    whatsapp: null,
    tiktok: null,
  },
  navLinks: [
    { labelEn: 'Home', labelAr: 'الرئيسية', path: '' },
    { labelEn: 'Menu', labelAr: 'القائمة', path: 'menu' },
    { labelEn: 'About', labelAr: 'من نحن', path: 'about' },
    { labelEn: 'Contact', labelAr: 'اتصل بنا', path: 'contact' },
  ],
  contact: {
    phone: '+965 1234 5678',
    email: 'info@goldenoasis.kw',
    address: 'Kuwait City, Kuwait',
    addressAr: 'مدينة الكويت، الكويت',
    workingHours: 'Daily: 12PM — 12AM',
    workingHoursAr: 'يومياً: 12 ظهراً — 12 منتصف الليل',
  },
  seo: {
    metaDescriptionEn: 'Authentic Middle Eastern cuisine with the finest ingredients. Order online for delivery or pickup.',
    metaDescriptionAr: 'مطبخ شرق أوسطي أصيل بأجود المكونات. اطلب عبر الإنترنت للتوصيل أو الاستلام.',
    ogImageUrl: null,
    googleAnalyticsId: null,
  },
  featuresJson: {},
  primaryDomain: 'test-tenant.localhost',
};

/** Derives CSS custom properties string from tenant theme for inline injection. */
export function buildTenantThemeCSS(theme: TenantTheme): string {
  const { colorPrimary, colorSecondary, colorBackground, colorHeaderFooter } = theme;
  return [
    `:root {`,
    `  --color-primary: ${colorPrimary};`,
    `  --color-primary-container: ${lighten(colorPrimary, 0.35)};`,
    `  --color-secondary: ${colorSecondary};`,
    `  --color-background: ${colorBackground};`,
    `  --color-header-footer: ${colorHeaderFooter};`,
    `  --color-on-header-footer: #ffffff;`,
    `}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// API response shape — actual contract from GET /api/v1/storefront/config
// ---------------------------------------------------------------------------

export interface ApiTenantConfigResponse {
  tenantId: string;
  slug: string;
  businessType: BusinessType;
  status: TenantStatus;
  defaultLanguage: 'en' | 'ar';
  templateId: string;
  branding: {
    businessNameEn: string;
    businessNameAr: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    coverPhotoUrl: string | null;
    primaryColor: string;
    headerFooterColor: string;
  };
  socialLinks: {
    instagram: string | null;
    tikTok: string | null;
    facebook: string | null;
    twitterX: string | null;
    whatsApp: string | null;
  };
  seo: {
    metaTitleEn: string | null;
    metaTitleAr: string | null;
    metaDescriptionEn: string | null;
    metaDescriptionAr: string | null;
    googleAnalyticsId: string | null;
  };
  featureFlags: Record<string, boolean>;
}

function defaultNavLinks(businessType: string): TenantNavLink[] {
  const home: TenantNavLink = { labelEn: 'Home', labelAr: 'الرئيسية', path: '' };
  const about: TenantNavLink = { labelEn: 'About', labelAr: 'من نحن', path: 'about' };
  const contact: TenantNavLink = { labelEn: 'Contact', labelAr: 'اتصل بنا', path: 'contact' };
  if (businessType === 'retail') {
    return [home, { labelEn: 'Shop', labelAr: 'تسوق', path: 'shop' }, about, contact];
  }
  if (businessType === 'service') {
    return [home, { labelEn: 'Services', labelAr: 'الخدمات', path: 'services' }, about, contact];
  }
  return [home, { labelEn: 'Menu', labelAr: 'القائمة', path: 'menu' }, about, contact];
}

/** Maps the raw API response to the frontend TenantConfig shape. */
export function mapApiTenantConfig(r: ApiTenantConfigResponse): TenantConfig {
  return {
    tenantId: r.tenantId,
    slug: r.slug,
    businessType: r.businessType,
    status: r.status,
    defaultLanguage: r.defaultLanguage,
    template: r.templateId,
    theme: {
      colorPrimary: r.branding.primaryColor,
      colorSecondary: r.branding.primaryColor,
      colorBackground: '#ffffff',
      colorHeaderFooter: r.branding.headerFooterColor,
      fontFamily: 'Inter',
      borderRadius: 'md',
    },
    branding: {
      logoUrl: r.branding.logoUrl,
      faviconUrl: r.branding.faviconUrl,
      businessName: r.branding.businessNameEn,
      businessNameAr: r.branding.businessNameAr,
      tagline: null,
      taglineAr: null,
      coverPhotoUrl: r.branding.coverPhotoUrl,
    },
    socialLinks: {
      instagram: r.socialLinks.instagram,
      twitter: r.socialLinks.twitterX,
      facebook: r.socialLinks.facebook,
      whatsapp: r.socialLinks.whatsApp,
      tiktok: r.socialLinks.tikTok,
    },
    navLinks: defaultNavLinks(r.businessType),
    contact: {
      phone: null,
      email: null,
      address: null,
      addressAr: null,
      workingHours: null,
      workingHoursAr: null,
    },
    seo: {
      metaDescriptionEn: r.seo.metaDescriptionEn,
      metaDescriptionAr: r.seo.metaDescriptionAr,
      ogImageUrl: null,
      googleAnalyticsId: r.seo.googleAnalyticsId,
    },
    featuresJson: r.featureFlags,
    primaryDomain: `${r.slug}.localhost`,
  };
}

/** Naive lightening: adds opacity via mix with white. Used only for CSS generation. */
function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const m = Math.round(amount * 255);
  const nr = Math.min(255, r + m);
  const ng = Math.min(255, g + m);
  const nb = Math.min(255, b + m);
  return `rgb(${nr}, ${ng}, ${nb})`;
}
