// Shared API model definitions for super admin endpoints. All field names match
// API-CONTRACTS.md exactly (camelCase).

// ============================================================================
// OVERVIEW
// ============================================================================

export interface OverviewKpis {
  totalTenants: number;
  totalTenantsActive: number;
  totalTenantsTrial: number;
  totalTenantsSuspended: number;
  newTenantsThisMonth: number;
  newTenantsLastMonth: number;
  totalGmv: number;
  totalGmvThisMonth: number;
  mrr: number;
  commissionEarnedThisMonth: number;
  totalEndCustomers: number;
  totalOrdersProcessed: number;
  activeTenantsLast30Days: number;
}

export interface OverviewChartPoint {
  periodMonth: string;
  mrr: number;
  gmv: number;
  commission: number;
}

export interface TenantGrowthPoint {
  periodMonth: string;
  newTrial: number;
  newActive: number;
  newChurned: number;
}

export interface BusinessTypeShare {
  businessType: string;
  tenantCount: number;
}

export interface TopTenantRow {
  tenantId: string;
  businessNameEn: string;
  businessType: string;
  gmv: number;
  orderCount: number;
}

export interface OverviewResponse {
  kpis: OverviewKpis;
  trend: OverviewChartPoint[];
  tenantGrowth: TenantGrowthPoint[];
  businessTypeDistribution: BusinessTypeShare[];
  topTenants: TopTenantRow[];
}

// ============================================================================
// LEADS
// ============================================================================

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'meeting_scheduled'
  | 'building'
  | 'preview_sent'
  | 'approved'
  | 'payment_received'
  | 'live'
  | 'lost';

export type LeadSource = 'website' | 'referral' | 'cold' | 'event' | 'other';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  notes: string | null;
  status: LeadStage;
  source: LeadSource;
  assignedTo: string | null;
  assignedToName: string | null;
  daysInStage: number;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

export interface LeadStageHistory {
  fromStage: LeadStage | null;
  toStage: LeadStage;
  changedBy: string;
  changedAt: string;
}

export interface LeadDetail extends Lead {
  notesList: LeadNote[];
  stageHistory: LeadStageHistory[];
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  notes?: string;
  source?: LeadSource;
  assignedTo?: string;
}

export interface TransitionStageRequest {
  status: LeadStage;
  lostReason?: string;
}

export interface ConvertLeadRequest {
  subdomain: string;
  planId: string;
  businessType: string;
}

// ============================================================================
// TENANTS
// ============================================================================

export type TenantStatus = 'active' | 'trial' | 'suspended' | 'cancelled' | 'archived' | 'deleted';

export interface TenantListItem {
  id: string;
  slug: string;
  businessNameEn: string;
  businessNameAr: string;
  businessType: string;
  status: TenantStatus;
  planId: string | null;
  planName: string | null;
  gmvThisMonth: number;
  ordersThisMonth: number;
  createdAt: string;
  lastActiveAt: string | null;
  country: string | null;
}

export interface TenantDetail extends TenantListItem {
  taxRate: number;
  taxInclusive: boolean;
  timezone: string;
  defaultCurrency: string;
  defaultLanguage: string;
  ownerEmail: string | null;
  ownerName: string | null;
}

export interface TenantImpersonationToken {
  token: string;
  expiresAt: string;
  tenantId: string;
}

export interface TenantOverviewKpis {
  gmvAllTime: number;
  gmvThisMonth: number;
  ordersAllTime: number;
  ordersThisMonth: number;
  customerCount: number;
  activeStaffCount: number;
}

export interface TenantRevenuePoint {
  periodStart: string;
  revenue: number;
  orders: number;
}

export interface TenantUserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

export interface TenantCustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orderCount: number;
  totalSpent: number;
  status: string;
}

export interface TenantDomainInfo {
  domain: string;
  domainType: 'subdomain' | 'custom';
  isVerified: boolean;
  sslIssued: boolean;
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  category: string;
  defaultValue: boolean;
  resolvedValue?: boolean | null;
  planDefaults?: Record<string, boolean>;
  tenantOverrideCount?: number;
}

export interface SetFeatureFlagOverrideRequest {
  isEnabled: boolean;
  reason?: string;
}

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

export type BillingModel = 'flat' | 'commission' | 'hybrid';

export interface PlanFeature {
  flagKey: string;
  value: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  isVisible: boolean;
  isHighlighted: boolean;
  billingModel: BillingModel;
  monthlyPrice: number | null;
  annualPrice: number | null;
  commissionRate: number | null;
  commissionThreshold: number | null;
  currency: string;
  trialDays: number;
  maxBranches: number | null;
  maxStaffUsers: number | null;
  maxProducts: number | null;
  tenantCount?: number;
  featureFlags: PlanFeature[];
}

export interface CreatePlanRequest {
  name: string;
  description?: string;
  isVisible: boolean;
  isHighlighted: boolean;
  billingModel: BillingModel;
  monthlyPrice?: number | null;
  annualPrice?: number | null;
  commissionRate?: number | null;
  commissionThreshold?: number | null;
  currency: string;
  trialDays: number;
  maxBranches?: number | null;
  maxStaffUsers?: number | null;
  maxProducts?: number | null;
  featureFlags: PlanFeature[];
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'suspended'
  | 'cancelled'
  | 'incomplete';

export type BillingCycle = 'monthly' | 'annual';

export interface TenantSubscription {
  id: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  monthlyAmount: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  cancelAtPeriodEnd: boolean;
  customMonthlyPrice: number | null;
  customCommissionRate: number | null;
}

export interface SubscriptionSummary {
  activeCount: number;
  trialCount: number;
  trialAvgDaysRemaining: number;
  mrr: number;
  arr: number;
  pastDueCount: number;
  cancelledThisMonth: number;
}

// ============================================================================
// BILLING & INVOICES
// ============================================================================

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'void' | 'written_off';
export type InvoiceType = 'subscription' | 'commission' | 'setup_fee' | 'custom';

export interface BillingSummary {
  subscriptionRevenue: number;
  commissionRevenue: number;
  totalRevenue: number;
  collectedRevenue: number;
  outstandingRevenue: number;
  overdueRevenue: number;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  type: InvoiceType;
  periodStart: string;
  periodEnd: string;
  total: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  pdfUrl: string | null;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceRequest {
  tenantId: string;
  type: InvoiceType;
  lineItems: InvoiceLineItem[];
  taxAmount: number;
  dueDate: string;
  notes?: string;
}

export interface WriteOffRequest {
  reason: string;
}

export interface PastDueTenant {
  tenantId: string;
  tenantSlug: string;
  businessNameEn: string;
  planName: string;
  amountDue: number;
  oldestDueDate: string | null;
  pastDueInvoices: number;
}

// ============================================================================
// COMMISSION
// ============================================================================

export interface CommissionSummary {
  totalGmv: number;
  totalCommissionEarned: number;
  collected: number;
  pending: number;
}

export interface CommissionTenantRow {
  tenantId: string;
  tenantName: string;
  planName: string;
  gmvThisMonth: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'invoiced' | 'paid';
}

// ============================================================================
// SYSTEM HEALTH
// ============================================================================

export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface ServiceHealthRow {
  service: string;
  status: ServiceStatus;
  uptime30d: number | null;
  lastIncident: string | null;
}

export interface PerformanceMetrics {
  apiP50: number;
  apiP95: number;
  apiP99: number;
  requestsPerMinute: number;
  errorRate: number;
  activeConnections: number;
  redisHitRate: number;
  dbConnectionUtilization: number;
}

export interface JobsSummary {
  enqueued: number;
  processing: number;
  succeeded: number;
  failed: number;
  servers: number;
}

export interface SystemHealthResponse {
  services: ServiceHealthRow[];
  performance: PerformanceMetrics;
  jobs: JobsSummary;
  checkedAt: string;
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string | null;
  actorEmail: string | null;
  actorType: 'super_admin' | 'tenant_user' | 'system';
  action: string;
  entityType: string | null;
  entityId: string | null;
  targetName: string | null;
  tenantId: string | null;
  tenantName: string | null;
  ipAddress: string | null;
  detailsJson: string;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// ============================================================================
// USERS (Super Admin)
// ============================================================================

export interface SuperAdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface InviteSuperAdminRequest {
  name: string;
  email: string;
  role: string;
}

export interface UpdateSuperAdminRequest {
  name: string;
  role: string;
  status: 'active' | 'suspended';
}

// ============================================================================
// JOBS
// ============================================================================

export interface JobInfo {
  id: string;
  name: string;
  queue: string;
  state: 'enqueued' | 'processing' | 'succeeded' | 'failed' | 'scheduled';
  enqueuedAt: string;
  startedAt: string | null;
  failedAt: string | null;
  exceptionMessage: string | null;
}

export interface JobsListResponse {
  summary: JobsSummary;
  failed: JobInfo[];
}

// ============================================================================
// ERRORS
// ============================================================================

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorEntry {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  service: string;
  message: string;
  stackTrace: string | null;
  tenantId: string | null;
  count: number;
}

// ============================================================================
// PROVIDERS
// ============================================================================

export interface DeliveryProvider {
  key: string;
  name: string;
  isEnabled: boolean;
  tenantCount: number;
  description: string;
}

export interface PaymentGatewayConfig {
  key: string;
  name: string;
  isEnabled: boolean;
  tenantCount: number;
  status: 'healthy' | 'degraded' | 'down';
  supportedMethods: string[];
}

export interface CommsProviderConfig {
  key: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  isEnabled: boolean;
  monthlyVolume: number;
}

// ============================================================================
// TEMPLATES
// ============================================================================

export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  businessTypes: string[];
  thumbnailUrl: string | null;
  activeTenantCount: number;
  status: 'active' | 'draft' | 'deprecated';
  version: string;
}

export interface TemplateChangelogEntry {
  version: string;
  releasedAt: string;
  notes: string;
}

export interface TemplateDetail extends TemplateSummary {
  screenshots: string[];
  changelog: TemplateChangelogEntry[];
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  supportWhatsapp: string | null;
  defaultCurrency: string;
  defaultTimezone: string;
  maintenanceMode: boolean;
}

export interface EmailTemplateRow {
  key: string;
  name: string;
  subjectEn: string;
  subjectAr: string;
  bodyEn: string;
  bodyAr: string;
}

export interface SmsTemplateRow {
  key: string;
  name: string;
  bodyEn: string;
  bodyAr: string;
}

export interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastAnnouncementRequest {
  subjectEn: string;
  subjectAr: string;
  bodyEn: string;
  bodyAr: string;
  channels: ('email' | 'dashboard')[];
  audience: 'all' | 'planIds';
  planIds?: string[];
  scheduleAt?: string;
}
