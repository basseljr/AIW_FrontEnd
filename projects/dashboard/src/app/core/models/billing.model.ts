export interface BillingCurrentPlan {
  planName: string;
  billingCycle: string;
  status: string;
  monthlyPrice: number;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  periodStart: string | null;
  periodEnd: string | null;
  total: number;
  currency: string;
  status: string;
  paidAt: string | null;
  dueDate: string;
  pdfUrl: string | null;
}
