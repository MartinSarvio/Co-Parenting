import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-18.acacia' as any,
});

// ─── Price ID lookup ───────────────────────────────────────────────────────────

type PaidPlan = 'family_plus' | 'single_parent_plus';
type BillingInterval = 'monthly' | 'annual';

function getPriceId(plan: PaidPlan, interval: BillingInterval): string | undefined {
  const map: Record<PaidPlan, Record<BillingInterval, string | undefined>> = {
    family_plus: {
      monthly: process.env.STRIPE_PRICE_FAMILY_PLUS_MONTHLY,
      annual:  process.env.STRIPE_PRICE_FAMILY_PLUS_ANNUAL,
    },
    single_parent_plus: {
      monthly: process.env.STRIPE_PRICE_SINGLE_PARENT_PLUS_MONTHLY,
      annual:  process.env.STRIPE_PRICE_SINGLE_PARENT_PLUS_ANNUAL,
    },
  };
  return map[plan]?.[interval];
}

// ─── POST /api/stripe/checkout ─────────────────────────────────────────────────
router.post('/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { plan, interval = 'monthly' } = req.body as {
      plan: PaidPlan;
      interval?: BillingInterval;
    };

    const validPlans: PaidPlan[] = ['family_plus', 'single_parent_plus'];
    const validIntervals: BillingInterval[] = ['monthly', 'annual'];

    if (!validPlans.includes(plan) || !validIntervals.includes(interval)) {
      res.status(400).json({ error: 'Ugyldigt abonnementsplan eller faktureringsinterval' });
      return;
    }

    const priceId = getPriceId(plan, interval);
    if (!priceId) {
      res.status(500).json({ error: `Stripe price ID mangler for ${plan} ${interval}` });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    // Get or create Stripe customer
    let sub = await prisma.stripeSubscription.findUnique({ where: { userId } });
    let customerId: string;

    if (sub?.stripeCustomerId) {
      customerId = sub.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/settings?tab=subscription&stripe=success`,
      cancel_url: `${frontendUrl}/settings?tab=subscription&stripe=cancel`,
      metadata: { userId, plan, interval },
      subscription_data: {
        metadata: { userId, plan, interval },
      },
    });

    // Persist customer ID immediately (plan stays 'free' until webhook confirms)
    await prisma.stripeSubscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: customerId,
        plan: 'free',
        status: 'inactive',
        billingInterval: interval,
      },
      update: { stripeCustomerId: customerId },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    // Return actual error detail so frontend can display it
    const detail = err?.message || 'Ukendt fejl';
    if (err?.type?.startsWith('Stripe')) {
      res.status(502).json({ error: `Stripe-fejl: ${detail}` });
    } else {
      res.status(500).json({ error: `Kunne ikke oprette betalingssession: ${detail}` });
    }
  }
});

// ─── POST /api/stripe/portal ───────────────────────────────────────────────────
router.post('/portal', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const sub = await prisma.stripeSubscription.findUnique({ where: { userId } });
    if (!sub?.stripeCustomerId) {
      res.status(404).json({ error: 'Ingen aktiv betalingskonto fundet' });
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${frontendUrl}/settings?tab=subscription`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    res.status(500).json({ error: 'Kunne ikke åbne abonnementsstyring' });
  }
});

// ─── GET /api/stripe/status ────────────────────────────────────────────────────
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const sub = await prisma.stripeSubscription.findUnique({ where: { userId } });

    if (!sub) {
      res.json({ plan: 'free', interval: 'monthly', status: 'inactive', stripeActive: false });
      return;
    }

    res.json({
      plan: sub.plan,
      interval: sub.billingInterval,
      status: sub.status,
      stripeActive: sub.status === 'active' || sub.status === 'trialing',
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    });
  } catch (err) {
    console.error('Stripe status error:', err);
    res.status(500).json({ error: 'Kunne ikke hente abonnementsstatus' });
  }
});

// ─── POST /api/stripe/webhook ──────────────────────────────────────────────────
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET mangler i env');
    res.status(500).end();
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, secret);
  } catch (err) {
    console.error('Webhook signatur fejl:', (err as Error).message);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, plan, interval = 'monthly' } = session.metadata ?? {};
        const subscriptionId = session.subscription as string;

        if (userId && plan && subscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = (stripeSub as any).current_period_end as number;

          await prisma.stripeSubscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: stripeSub.items.data[0]?.price.id,
              plan,
              status: 'active',
              billingInterval: interval,
              currentPeriodEnd: new Date(periodEnd * 1000),
            },
            update: {
              stripeSubscriptionId: subscriptionId,
              stripePriceId: stripeSub.items.data[0]?.price.id,
              plan,
              status: 'active',
              billingInterval: interval,
              currentPeriodEnd: new Date(periodEnd * 1000),
              cancelAtPeriodEnd: false,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const { userId, plan, interval = 'monthly' } = stripeSub.metadata ?? {};
        const periodEnd = (stripeSub as any).current_period_end as number;

        if (userId) {
          await prisma.stripeSubscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeCustomerId: stripeSub.customer as string,
              stripeSubscriptionId: stripeSub.id,
              plan: plan || 'free',
              status: stripeSub.status,
              billingInterval: interval,
              currentPeriodEnd: new Date(periodEnd * 1000),
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            },
            update: {
              status: stripeSub.status,
              plan: plan || 'free',
              billingInterval: interval,
              currentPeriodEnd: new Date(periodEnd * 1000),
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;
        await prisma.stripeSubscription.updateMany({
          where: { stripeSubscriptionId: stripeSub.id },
          data: {
            plan: 'free',
            status: 'canceled',
            billingInterval: 'monthly',
            cancelAtPeriodEnd: false,
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await prisma.stripeSubscription.updateMany({
          where: { stripeCustomerId: invoice.customer as string },
          data: { status: 'past_due' },
        });
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler fejlede' });
  }
});

export { router as stripeRouter };
