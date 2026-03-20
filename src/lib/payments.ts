/**
 * payments.ts — Frontend betalings-service med Stripe integration.
 *
 * Håndterer:
 * - Gem betalingsmetoder (kort, MobilePay, Apple Pay, PayPal)
 * - Hent gemte betalingsmetoder
 * - Slet betalingsmetoder
 * - Opret betalinger (trækker rigtige penge)
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// ─── Stripe instance (singleton) ────────────────────────────────────────────────

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('VITE_STRIPE_PUBLISHABLE_KEY mangler i .env');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'mobilepay' | 'paypal';
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
  isApplePay: boolean;
}

// ─── SetupIntent (gem ny betalingsmetode) ───────────────────────────────────────

export async function createSetupIntent(
  paymentMethodTypes: string[] = ['card']
): Promise<{ clientSecret: string; customerId: string }> {
  const { data, error } = await supabase.functions.invoke('stripe-setup-intent', {
    body: { payment_method_types: paymentMethodTypes },
  });

  if (error) {
    const msg = error.message || 'Kunne ikke oprette SetupIntent';
    throw new Error(msg);
  }

  return data;
}

// ─── Hent gemte betalingsmetoder ────────────────────────────────────────────────

export async function listPaymentMethods(): Promise<SavedPaymentMethod[]> {
  const { data, error } = await supabase.functions.invoke('stripe-payment-methods', {
    body: {},
  });

  if (error) {
    console.error('listPaymentMethods error:', error);
    return [];
  }

  return data?.paymentMethods || [];
}

// ─── Slet betalingsmetode ───────────────────────────────────────────────────────

export async function deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('stripe-payment-methods', {
    body: { action: 'delete', paymentMethodId },
  });

  if (error) {
    throw new Error(error.message || 'Kunne ikke slette betalingsmetode');
  }

  return data?.success === true;
}

// ─── Opret betaling (træk penge) ────────────────────────────────────────────────

export interface ChargeResult {
  clientSecret: string;
  paymentIntentId: string;
  status: string;
}

export async function chargePaymentMethod(
  paymentMethodId: string,
  amountInOere: number,
  description?: string
): Promise<ChargeResult> {
  const { data, error } = await supabase.functions.invoke('stripe-charge', {
    body: {
      amount: amountInOere,
      currency: 'dkk',
      paymentMethodId,
      description,
    },
  });

  if (error) {
    throw new Error(error.message || 'Betaling fejlede');
  }

  return data;
}

// ─── Hjælpefunktioner ───────────────────────────────────────────────────────────

/** Formatér kort-brand til dansk visningsnavn */
export function formatCardBrand(brand: string): string {
  const brands: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
    dankort: 'Dankort',
  };
  return brands[brand.toLowerCase()] || brand;
}

/** Formatér betalingsmetode til dansk visningsnavn */
export function formatPaymentMethodType(type: string): string {
  const types: Record<string, string> = {
    card: 'Kort',
    mobilepay: 'MobilePay',
    paypal: 'PayPal',
  };
  return types[type] || type;
}
