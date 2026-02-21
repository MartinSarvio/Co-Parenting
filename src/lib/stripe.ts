/**
 * Stripe integration — frontend client for subscription management.
 *
 * Uses the backend API endpoints:
 *   POST /api/stripe/checkout  → Creates checkout session, returns { url }
 *   POST /api/stripe/portal    → Opens billing portal, returns { url }
 *   GET  /api/stripe/status    → Returns current plan + status
 */

import { api } from './api';

export type StripePlan = 'family_plus' | 'single_parent_plus';
export type BillingInterval = 'monthly' | 'annual';

// Prices shown in UI (DKK)
export const PLAN_PRICES: Record<StripePlan, { monthly: number; annual: number; annualMonthly: number }> = {
  family_plus: {
    monthly: 49,
    annual: 490,
    annualMonthly: 41,
  },
  single_parent_plus: {
    monthly: 79,
    annual: 790,
    annualMonthly: 66,
  },
};

// ─── Start Checkout ────────────────────────────────────────────────────────────
export async function startCheckout(plan: StripePlan, interval: BillingInterval = 'monthly'): Promise<void> {
  const { url } = await api.post<{ url: string }>('/api/stripe/checkout', { plan, interval });
  if (url) {
    window.location.href = url;
  }
}

// ─── Billing Portal ────────────────────────────────────────────────────────────
export async function openBillingPortal(): Promise<void> {
  const { url } = await api.post<{ url: string }>('/api/stripe/portal');
  if (url) {
    window.location.href = url;
  }
}

// ─── Subscription Status ───────────────────────────────────────────────────────
export interface StripeStatus {
  plan: string;
  interval: BillingInterval;
  status: string;
  stripeActive: boolean;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export async function fetchStripeStatus(): Promise<StripeStatus> {
  try {
    return await api.get<StripeStatus>('/api/stripe/status');
  } catch {
    return { plan: 'free', interval: 'monthly', status: 'inactive', stripeActive: false };
  }
}
