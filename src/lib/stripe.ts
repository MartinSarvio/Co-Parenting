/**
 * Stripe integration — frontend client for subscription management.
 *
 * Bruger Supabase Edge Functions for checkout og portal (server-side secrets).
 * Status hentes direkte fra stripe_subscriptions tabellen.
 */

import { supabase } from './supabase';

export type StripePlan = 'family_plus' | 'single_parent_plus';
export type BillingInterval = 'monthly' | 'annual';

// Prices shown in UI (DKK)
export const PLAN_PRICES: Record<StripePlan, { monthly: number; annual: number; annualMonthly: number }> = {
  family_plus: {
    monthly: 79,
    annual: 790,
    annualMonthly: 66,
  },
  single_parent_plus: {
    monthly: 49,
    annual: 490,
    annualMonthly: 41,
  },
};

// ─── Start Checkout ────────────────────────────────────────────────────────────
export async function startCheckout(plan: StripePlan, interval: BillingInterval = 'monthly'): Promise<void> {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { plan, interval },
  });
  if (error) {
    // FunctionsHttpError has context (Response) — try to extract real error
    let msg = 'Kunne ikke oprette betalingssession';
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json();
        msg = body?.error || msg;
      } else {
        msg = error.message || msg;
      }
    } catch {
      msg = error.message || msg;
    }
    console.error('stripe-checkout error:', msg, { data, error });
    throw new Error(msg);
  }
  if (data?.url) {
    window.location.href = data.url;
  } else {
    throw new Error('Ingen checkout URL modtaget fra serveren');
  }
}

// ─── Billing Portal ────────────────────────────────────────────────────────────
export async function openBillingPortal(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('stripe-portal');
  if (error) throw new Error(error.message || 'Kunne ikke åbne betalingsportal');
  if (data?.url) {
    window.location.href = data.url;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { plan: 'free', interval: 'monthly', status: 'inactive', stripeActive: false };

    const { data: sub } = await supabase
      .from('stripe_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!sub) return { plan: 'free', interval: 'monthly', status: 'inactive', stripeActive: false };

    const stripeActive = sub.status === 'active' || sub.status === 'trialing';
    return {
      plan: sub.plan || 'free',
      interval: (sub.billing_interval as BillingInterval) || 'monthly',
      status: sub.status || 'inactive',
      stripeActive,
      currentPeriodEnd: sub.current_period_end || undefined,
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
    };
  } catch {
    return { plan: 'free', interval: 'monthly', status: 'inactive', stripeActive: false };
  }
}
