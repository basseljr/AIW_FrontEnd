import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import {
  AnnouncementRow,
  AuditLogPage,
  BillingSummary,
  BroadcastAnnouncementRequest,
  CommissionSummary,
  CommissionTenantRow,
  CommsProviderConfig,
  ConvertLeadRequest,
  CreateInvoiceRequest,
  CreateLeadRequest,
  CreatePlanRequest,
  DeliveryProvider,
  EmailTemplateRow,
  ErrorEntry,
  ErrorSeverity,
  FeatureFlag,
  InvoiceListItem,
  InvoiceStatus,
  InvoiceType,
  JobsListResponse,
  Lead,
  LeadDetail,
  LeadNote,
  LeadStage,
  OverviewResponse,
  PastDueTenant,
  PaymentGatewayConfig,
  PlatformSettings,
  SetFeatureFlagOverrideRequest,
  SmsTemplateRow,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionSummary,
  SuperAdminUserRow,
  SystemHealthResponse,
  TemplateDetail,
  TemplateSummary,
  TenantCustomerSummary,
  TenantDetail,
  TenantDomainInfo,
  TenantImpersonationToken,
  TenantListItem,
  TenantOverviewKpis,
  TenantRevenuePoint,
  TenantStatus,
  TenantSubscription,
  TenantUserSummary,
  TransitionStageRequest,
  UpdateSuperAdminRequest,
  WriteOffRequest,
  InviteSuperAdminRequest,
} from '../models/super-admin-api.models';

/**
 * Single front-door service for every super admin endpoint. Pages and detail
 * components depend on small slices of this surface but co-locating them keeps
 * the URL bookkeeping in one place.
 */
@Injectable({ providedIn: 'root' })
export class SuperAdminApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly admin = (path: string) => `${this.baseUrl}/admin${path}`;

  // OVERVIEW -----------------------------------------------------------------
  getOverview(scope: 'all_time' | 'this_month' = 'this_month'): Observable<OverviewResponse> {
    const params = new HttpParams().set('scope', scope);
    return this.http.get<OverviewResponse>(this.admin('/overview'), {
      params,
      withCredentials: true,
    });
  }

  // LEADS --------------------------------------------------------------------
  listLeads(filters: {
    status?: LeadStage;
    businessType?: string;
    source?: string;
    assignedTo?: string;
    from?: string;
    to?: string;
  } = {}): Observable<Lead[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params = params.set(k, v);
    });
    return this.http.get<Lead[]>(this.admin('/leads'), { params, withCredentials: true });
  }

  getLead(id: string): Observable<LeadDetail> {
    return this.http.get<LeadDetail>(this.admin(`/leads/${id}`), { withCredentials: true });
  }

  createLead(req: CreateLeadRequest): Observable<Lead> {
    return this.http.post<Lead>(this.admin('/leads'), req, { withCredentials: true });
  }

  updateLeadStage(id: string, req: TransitionStageRequest): Observable<Lead> {
    return this.http.post<Lead>(this.admin(`/leads/${id}/status`), req, { withCredentials: true });
  }

  addLeadNote(id: string, text: string): Observable<LeadNote> {
    return this.http.post<LeadNote>(
      this.admin(`/leads/${id}/notes`),
      { text },
      { withCredentials: true },
    );
  }

  convertLead(id: string, req: ConvertLeadRequest): Observable<{ tenantId: string }> {
    return this.http.post<{ tenantId: string }>(this.admin(`/leads/${id}/convert`), req, {
      withCredentials: true,
    });
  }

  // TENANTS ------------------------------------------------------------------
  listTenants(filters: {
    search?: string;
    status?: TenantStatus | '';
    type?: string;
    planId?: string;
    country?: string;
  } = {}): Observable<TenantListItem[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params = params.set(k, v);
    });
    return this.http.get<TenantListItem[]>(this.admin('/tenants'), {
      params,
      withCredentials: true,
    });
  }

  getTenant(id: string): Observable<TenantDetail> {
    return this.http.get<TenantDetail>(this.admin(`/tenants/${id}`), { withCredentials: true });
  }

  getTenantOverview(id: string): Observable<{
    kpis: TenantOverviewKpis;
    revenueTrend: TenantRevenuePoint[];
  }> {
    return this.http.get<{ kpis: TenantOverviewKpis; revenueTrend: TenantRevenuePoint[] }>(
      this.admin(`/tenants/${id}/overview`),
      { withCredentials: true },
    );
  }

  suspendTenant(id: string): Observable<{ tenantId: string; status: string }> {
    return this.http.post<{ tenantId: string; status: string }>(
      this.admin(`/tenants/${id}/suspend`),
      null,
      { withCredentials: true },
    );
  }

  reactivateTenant(id: string): Observable<{ tenantId: string; status: string }> {
    return this.http.post<{ tenantId: string; status: string }>(
      this.admin(`/tenants/${id}/reactivate`),
      null,
      { withCredentials: true },
    );
  }

  impersonateTenant(id: string): Observable<TenantImpersonationToken> {
    return this.http.post<TenantImpersonationToken>(
      this.admin(`/tenants/${id}/impersonate`),
      null,
      { withCredentials: true },
    );
  }

  getTenantFeatureFlags(id: string): Observable<FeatureFlag[]> {
    return this.http.get<FeatureFlag[]>(
      this.admin(`/feature-flags/tenants/${id}/resolved`),
      { withCredentials: true },
    );
  }

  setTenantFlagOverride(
    tenantId: string,
    flagKey: string,
    req: SetFeatureFlagOverrideRequest,
  ): Observable<{ tenantId: string; flagKey: string; value: boolean }> {
    return this.http.put<{ tenantId: string; flagKey: string; value: boolean }>(
      this.admin(`/feature-flags/tenants/${tenantId}/overrides/${flagKey}`),
      req,
      { withCredentials: true },
    );
  }

  removeTenantFlagOverride(tenantId: string, flagKey: string): Observable<void> {
    return this.http.delete<void>(
      this.admin(`/feature-flags/tenants/${tenantId}/overrides/${flagKey}`),
      { withCredentials: true },
    );
  }

  getTenantUsers(id: string): Observable<TenantUserSummary[]> {
    return this.http.get<TenantUserSummary[]>(
      this.admin(`/tenants/${id}/users`),
      { withCredentials: true },
    );
  }

  getTenantCustomers(id: string): Observable<TenantCustomerSummary[]> {
    return this.http.get<TenantCustomerSummary[]>(
      this.admin(`/tenants/${id}/customers`),
      { withCredentials: true },
    );
  }

  getTenantDomains(id: string): Observable<TenantDomainInfo[]> {
    return this.http.get<TenantDomainInfo[]>(
      this.admin(`/tenants/${id}/domains`),
      { withCredentials: true },
    );
  }

  // SUBSCRIPTIONS ------------------------------------------------------------
  listSubscriptions(status?: SubscriptionStatus): Observable<TenantSubscription[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<TenantSubscription[]>(this.admin('/subscriptions'), {
      params,
      withCredentials: true,
    });
  }

  getSubscriptionSummary(): Observable<SubscriptionSummary> {
    return this.http.get<SubscriptionSummary>(this.admin('/subscriptions/summary'), {
      withCredentials: true,
    });
  }

  // BILLING / INVOICES -------------------------------------------------------
  getBillingSummary(): Observable<BillingSummary> {
    return this.http.get<BillingSummary>(this.admin('/billing/revenue-summary'), {
      withCredentials: true,
    });
  }

  listPastDueTenants(): Observable<PastDueTenant[]> {
    return this.http.get<PastDueTenant[]>(this.admin('/billing/past-due-tenants'), {
      withCredentials: true,
    });
  }

  listInvoices(filters: {
    tenantId?: string;
    status?: InvoiceStatus | '';
    type?: InvoiceType | '';
    from?: string;
    to?: string;
  } = {}): Observable<InvoiceListItem[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params = params.set(k, v);
    });
    return this.http.get<InvoiceListItem[]>(this.admin('/invoices'), {
      params,
      withCredentials: true,
    });
  }

  createInvoice(req: CreateInvoiceRequest): Observable<InvoiceListItem> {
    return this.http.post<InvoiceListItem>(this.admin('/invoices'), req, { withCredentials: true });
  }

  markInvoicePaid(id: string): Observable<InvoiceListItem> {
    return this.http.post<InvoiceListItem>(this.admin(`/invoices/${id}/mark-paid`), null, {
      withCredentials: true,
    });
  }

  writeOffInvoice(id: string, req: WriteOffRequest): Observable<InvoiceListItem> {
    return this.http.post<InvoiceListItem>(this.admin(`/invoices/${id}/write-off`), req, {
      withCredentials: true,
    });
  }

  voidInvoice(id: string): Observable<InvoiceListItem> {
    return this.http.post<InvoiceListItem>(this.admin(`/invoices/${id}/void`), null, {
      withCredentials: true,
    });
  }

  // COMMISSION ---------------------------------------------------------------
  getCommissionSummary(periodMonth?: string): Observable<CommissionSummary> {
    let params = new HttpParams();
    if (periodMonth) params = params.set('periodMonth', periodMonth);
    return this.http.get<CommissionSummary>(this.admin('/commission/summary'), {
      params,
      withCredentials: true,
    });
  }

  listCommissionByTenant(periodMonth?: string): Observable<CommissionTenantRow[]> {
    let params = new HttpParams();
    if (periodMonth) params = params.set('periodMonth', periodMonth);
    return this.http.get<CommissionTenantRow[]>(this.admin('/commission/by-tenant'), {
      params,
      withCredentials: true,
    });
  }

  generateCommissionInvoices(
    periodMonth: string,
  ): Observable<{ invoicesCreated: number; totalAmount: number }> {
    return this.http.post<{ invoicesCreated: number; totalAmount: number }>(
      this.admin('/commission/generate-invoices'),
      { periodMonth },
      { withCredentials: true },
    );
  }

  // FEATURE FLAGS ------------------------------------------------------------
  listFeatureFlags(): Observable<FeatureFlag[]> {
    return this.http.get<FeatureFlag[]>(this.admin('/feature-flags'), { withCredentials: true });
  }

  createFeatureFlag(flag: Partial<FeatureFlag>): Observable<FeatureFlag> {
    return this.http.post<FeatureFlag>(this.admin('/feature-flags'), flag, {
      withCredentials: true,
    });
  }

  updateFeatureFlag(key: string, flag: Partial<FeatureFlag>): Observable<FeatureFlag> {
    return this.http.put<FeatureFlag>(this.admin(`/feature-flags/${key}`), flag, {
      withCredentials: true,
    });
  }

  // PLANS --------------------------------------------------------------------
  listPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(this.admin('/subscription-plans'), {
      withCredentials: true,
    });
  }

  getPlan(id: string): Observable<SubscriptionPlan> {
    return this.http.get<SubscriptionPlan>(this.admin(`/subscription-plans/${id}`), {
      withCredentials: true,
    });
  }

  createPlan(req: CreatePlanRequest): Observable<SubscriptionPlan> {
    return this.http.post<SubscriptionPlan>(this.admin('/subscription-plans'), req, {
      withCredentials: true,
    });
  }

  updatePlan(id: string, req: CreatePlanRequest): Observable<SubscriptionPlan> {
    return this.http.put<SubscriptionPlan>(this.admin(`/subscription-plans/${id}`), req, {
      withCredentials: true,
    });
  }

  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(this.admin(`/subscription-plans/${id}`), {
      withCredentials: true,
    });
  }

  // TEMPLATES ----------------------------------------------------------------
  listTemplates(): Observable<TemplateSummary[]> {
    return this.http.get<TemplateSummary[]>(this.admin('/templates'), { withCredentials: true });
  }

  getTemplate(id: string): Observable<TemplateDetail> {
    return this.http.get<TemplateDetail>(this.admin(`/templates/${id}`), {
      withCredentials: true,
    });
  }

  // HEALTH -------------------------------------------------------------------
  getSystemHealth(): Observable<SystemHealthResponse> {
    return this.http.get<SystemHealthResponse>(this.admin('/system-health'), {
      withCredentials: true,
    });
  }

  // AUDIT LOG ----------------------------------------------------------------
  listAuditLogs(filters: {
    tenantId?: string;
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  } = {}): Observable<AuditLogPage> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<AuditLogPage>(this.admin('/audit-logs'), { params, withCredentials: true });
  }

  exportAuditLogs(filters: {
    tenantId?: string;
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
  } = {}): Observable<Blob> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params = params.set(k, v);
    });
    return this.http.get(this.admin('/audit-logs/export'), {
      params,
      withCredentials: true,
      responseType: 'blob',
    });
  }

  // SUPER ADMIN USERS --------------------------------------------------------
  listSuperAdminUsers(): Observable<SuperAdminUserRow[]> {
    return this.http.get<SuperAdminUserRow[]>(this.admin('/users'), { withCredentials: true });
  }

  inviteSuperAdmin(req: InviteSuperAdminRequest): Observable<SuperAdminUserRow> {
    return this.http.post<SuperAdminUserRow>(this.admin('/users'), req, { withCredentials: true });
  }

  updateSuperAdmin(id: string, req: UpdateSuperAdminRequest): Observable<SuperAdminUserRow> {
    return this.http.put<SuperAdminUserRow>(this.admin(`/users/${id}`), req, {
      withCredentials: true,
    });
  }

  resetMfa(id: string): Observable<void> {
    return this.http.post<void>(this.admin(`/users/${id}/reset-mfa`), null, {
      withCredentials: true,
    });
  }

  forceLogout(id: string): Observable<void> {
    return this.http.post<void>(this.admin(`/users/${id}/force-logout`), null, {
      withCredentials: true,
    });
  }

  // JOBS ---------------------------------------------------------------------
  getJobs(): Observable<JobsListResponse> {
    return this.http.get<JobsListResponse>(this.admin('/jobs'), { withCredentials: true });
  }

  retryJob(id: string): Observable<void> {
    return this.http.post<void>(this.admin(`/jobs/${id}/retry`), null, { withCredentials: true });
  }

  // ERRORS -------------------------------------------------------------------
  listErrors(filters: {
    severity?: ErrorSeverity;
    service?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  } = {}): Observable<{ items: ErrorEntry[]; totalCount: number }> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<{ items: ErrorEntry[]; totalCount: number }>(this.admin('/errors'), {
      params,
      withCredentials: true,
    });
  }

  // PROVIDERS ----------------------------------------------------------------
  listDeliveryProviders(): Observable<DeliveryProvider[]> {
    return this.http.get<DeliveryProvider[]>(this.admin('/delivery-providers'), {
      withCredentials: true,
    });
  }

  toggleDeliveryProvider(key: string, enabled: boolean): Observable<DeliveryProvider> {
    return this.http.patch<DeliveryProvider>(
      this.admin(`/delivery-providers/${key}`),
      { isEnabled: enabled },
      { withCredentials: true },
    );
  }

  listPaymentGateways(): Observable<PaymentGatewayConfig[]> {
    return this.http.get<PaymentGatewayConfig[]>(this.admin('/payment-gateways'), {
      withCredentials: true,
    });
  }

  togglePaymentGateway(key: string, enabled: boolean): Observable<PaymentGatewayConfig> {
    return this.http.patch<PaymentGatewayConfig>(
      this.admin(`/payment-gateways/${key}`),
      { isEnabled: enabled },
      { withCredentials: true },
    );
  }

  listCommsProviders(): Observable<CommsProviderConfig[]> {
    return this.http.get<CommsProviderConfig[]>(this.admin('/comms-providers'), {
      withCredentials: true,
    });
  }

  toggleCommsProvider(key: string, enabled: boolean): Observable<CommsProviderConfig> {
    return this.http.patch<CommsProviderConfig>(
      this.admin(`/comms-providers/${key}`),
      { isEnabled: enabled },
      { withCredentials: true },
    );
  }

  // SETTINGS -----------------------------------------------------------------
  getSettings(): Observable<PlatformSettings> {
    return this.http.get<PlatformSettings>(this.admin('/settings'), { withCredentials: true });
  }

  updateSettings(req: PlatformSettings): Observable<PlatformSettings> {
    return this.http.put<PlatformSettings>(this.admin('/settings'), req, {
      withCredentials: true,
    });
  }

  listEmailTemplates(): Observable<EmailTemplateRow[]> {
    return this.http.get<EmailTemplateRow[]>(this.admin('/settings/email-templates'), {
      withCredentials: true,
    });
  }

  updateEmailTemplate(key: string, req: EmailTemplateRow): Observable<EmailTemplateRow> {
    return this.http.put<EmailTemplateRow>(this.admin(`/settings/email-templates/${key}`), req, {
      withCredentials: true,
    });
  }

  listSmsTemplates(): Observable<SmsTemplateRow[]> {
    return this.http.get<SmsTemplateRow[]>(this.admin('/settings/sms-templates'), {
      withCredentials: true,
    });
  }

  updateSmsTemplate(key: string, req: SmsTemplateRow): Observable<SmsTemplateRow> {
    return this.http.put<SmsTemplateRow>(this.admin(`/settings/sms-templates/${key}`), req, {
      withCredentials: true,
    });
  }

  // ANNOUNCEMENTS ------------------------------------------------------------
  listAnnouncements(): Observable<AnnouncementRow[]> {
    return this.http.get<AnnouncementRow[]>(this.admin('/announcements'), {
      withCredentials: true,
    });
  }

  createAnnouncement(
    req: Pick<AnnouncementRow, 'title' | 'content' | 'isActive'>,
  ): Observable<AnnouncementRow> {
    return this.http.post<AnnouncementRow>(this.admin('/announcements'), req, {
      withCredentials: true,
    });
  }

  updateAnnouncement(
    id: string,
    req: Pick<AnnouncementRow, 'title' | 'content' | 'isActive'>,
  ): Observable<AnnouncementRow> {
    return this.http.put<AnnouncementRow>(this.admin(`/announcements/${id}`), req, {
      withCredentials: true,
    });
  }

  deleteAnnouncement(id: string): Observable<void> {
    return this.http.delete<void>(this.admin(`/announcements/${id}`), { withCredentials: true });
  }

  broadcastAnnouncement(req: BroadcastAnnouncementRequest): Observable<{ recipients: number }> {
    return this.http.post<{ recipients: number }>(this.admin('/announcements/broadcast'), req, {
      withCredentials: true,
    });
  }
}
