import { supabase } from './supabase';
import { PLAN_PRICES } from './stripe';

// ── Period helpers ─────────────────────────────────────────────────────────

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'all';

function getStartDate(period: AnalyticsPeriod): string | null {
  if (period === 'all') return null;
  const now = new Date();
  if (period === 'today') {
    now.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    now.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    now.setMonth(now.getMonth() - 1);
  }
  return now.toISOString();
}

function getPreviousPeriodStart(period: AnalyticsPeriod): string | null {
  if (period === 'all') return null;
  const now = new Date();
  if (period === 'today') {
    now.setDate(now.getDate() - 1);
    now.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    now.setDate(now.getDate() - 14);
  } else if (period === 'month') {
    now.setMonth(now.getMonth() - 2);
  }
  return now.toISOString();
}

// ── Content Statistics ─────────────────────────────────────────────────────

export interface ContentStats {
  newsViews: number;
  newsViewsPrev: number;
  productClicks: number;
  productClicksPrev: number;
  offerViews: number;
  offerViewsPrev: number;
  forumPosts: number;
  forumPostsPrev: number;
}

export async function fetchContentStats(period: AnalyticsPeriod): Promise<ContentStats> {
  const since = getStartDate(period);
  const prevSince = getPreviousPeriodStart(period);

  async function countEvents(eventType: string, from: string | null, to: string | null): Promise<number> {
    let query = supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', eventType);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lt('created_at', to);
    const { count } = await query;
    return count ?? 0;
  }

  const [newsViews, newsViewsPrev, productClicks, productClicksPrev, offerViews, offerViewsPrev, forumPosts, forumPostsPrev] = await Promise.all([
    countEvents('news_view', since, null),
    countEvents('news_view', prevSince, since),
    countEvents('product_click', since, null),
    countEvents('product_click', prevSince, since),
    countEvents('page_view', since, null),
    countEvents('page_view', prevSince, since),
    countEvents('forum_post', since, null),
    countEvents('forum_post', prevSince, since),
  ]);

  return { newsViews, newsViewsPrev, productClicks, productClicksPrev, offerViews, offerViewsPrev, forumPosts, forumPostsPrev };
}

// ── Top Product Clicks ─────────────────────────────────────────────────────

export interface ProductClickRow {
  targetId: string;
  name: string;
  store: string;
  clicks: number;
}

export async function fetchTopProductClicks(period: AnalyticsPeriod, limit = 10): Promise<ProductClickRow[]> {
  const since = getStartDate(period);

  let query = supabase
    .from('analytics_events')
    .select('target_id, metadata')
    .eq('event_type', 'product_click');
  if (since) query = query.gte('created_at', since);

  const { data } = await query;
  if (!data || data.length === 0) return [];

  // Aggregate client-side
  const counts = new Map<string, { clicks: number; name: string; store: string }>();
  for (const row of data) {
    const id = row.target_id ?? 'unknown';
    const existing = counts.get(id);
    const meta = (row.metadata ?? {}) as Record<string, string>;
    if (existing) {
      existing.clicks++;
    } else {
      counts.set(id, { clicks: 1, name: meta.name ?? id, store: meta.store ?? '' });
    }
  }

  return Array.from(counts.entries())
    .map(([targetId, val]) => ({ targetId, ...val }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}

// ── Link Redirects ─────────────────────────────────────────────────────────

export interface RedirectRow {
  destination: string;
  clicks: number;
}

export async function fetchLinkRedirects(period: AnalyticsPeriod): Promise<RedirectRow[]> {
  const since = getStartDate(period);

  let query = supabase
    .from('analytics_events')
    .select('metadata')
    .eq('event_type', 'link_redirect');
  if (since) query = query.gte('created_at', since);

  const { data } = await query;
  if (!data || data.length === 0) return [];

  const counts = new Map<string, number>();
  for (const row of data) {
    const meta = (row.metadata ?? {}) as Record<string, string>;
    const dest = meta.destination ?? 'Ukendt';
    counts.set(dest, (counts.get(dest) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([destination, clicks]) => ({ destination, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
}

// ── Activity Over Time ─────────────────────────────────────────────────────

export interface ActivityPoint {
  date: string;
  label: string;
  count: number;
}

const DANISH_WEEKDAYS = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];

export async function fetchActivityOverTime(
  page: string,
  period: AnalyticsPeriod
): Promise<ActivityPoint[]> {
  const since = getStartDate(period);

  let query = supabase
    .from('analytics_events')
    .select('created_at')
    .eq('page', page);
  if (since) query = query.gte('created_at', since);
  query = query.order('created_at', { ascending: true });

  const { data } = await query;
  if (!data || data.length === 0) return [];

  // Group by date
  const counts = new Map<string, number>();
  for (const row of data) {
    const d = new Date(row.created_at);
    const key = d.toISOString().split('T')[0];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => {
    const d = new Date(date);
    const label = period === 'today' || period === 'week'
      ? DANISH_WEEKDAYS[d.getDay()]
      : `${d.getDate()}/${d.getMonth() + 1}`;
    return { date, label, count };
  });
}

// ── Total Event Count ──────────────────────────────────────────────────────

export async function fetchTotalEventCount(period: AnalyticsPeriod): Promise<number> {
  const since = getStartDate(period);
  let query = supabase.from('analytics_events').select('id', { count: 'exact', head: true });
  if (since) query = query.gte('created_at', since);
  const { count } = await query;
  return count ?? 0;
}

// ── Event Breakdown (Donut Chart) ────────────────────────────────────────

export interface EventBreakdownEntry {
  eventType: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

const EVENT_LABELS: Record<string, string> = {
  news_view: 'Nyheder',
  product_click: 'Produktklik',
  page_view: 'Sidevisninger',
  link_redirect: 'Link-redirects',
  forum_post: 'Forum',
};

const EVENT_COLORS: Record<string, string> = {
  news_view: '#f58a2d',
  product_click: '#34C759',
  page_view: '#AF52DE',
  link_redirect: '#5AC8FA',
  forum_post: '#FF3B30',
};

export async function fetchEventBreakdown(period: AnalyticsPeriod): Promise<EventBreakdownEntry[]> {
  const since = getStartDate(period);

  let query = supabase.from('analytics_events').select('event_type');
  if (since) query = query.gte('created_at', since);

  const { data } = await query;
  if (!data || data.length === 0) return [];

  const counts = new Map<string, number>();
  for (const row of data) {
    const t = row.event_type ?? 'unknown';
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  const total = data.length;
  return Array.from(counts.entries())
    .map(([eventType, count]) => ({
      eventType,
      label: EVENT_LABELS[eventType] ?? eventType,
      count,
      percentage: Math.round((count / total) * 100),
      color: EVENT_COLORS[eventType] ?? '#9a978f',
    }))
    .sort((a, b) => b.count - a.count);
}

// ── Revenue Stats ────────────────────────────────────────────────────────

export interface RevenueStats {
  activeSubscribers: number;
  familyPlusCount: number;
  singleParentPlusCount: number;
  totalMRR: number;
  cancellingCount: number;
  subscribersByMonth: Array<{ month: string; label: string; count: number; revenue: number }>;
}

const DANISH_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

export async function fetchRevenueStats(): Promise<RevenueStats> {
  const { data } = await supabase
    .from('stripe_subscriptions')
    .select('plan, status, billing_interval, cancel_at_period_end, created_at')
    .in('status', ['active', 'trialing']);

  if (!data || data.length === 0) {
    return { activeSubscribers: 0, familyPlusCount: 0, singleParentPlusCount: 0, totalMRR: 0, cancellingCount: 0, subscribersByMonth: [] };
  }

  let familyPlusMonthly = 0, familyPlusAnnual = 0;
  let singleParentPlusMonthly = 0, singleParentPlusAnnual = 0;
  let cancellingCount = 0;

  for (const row of data) {
    if (row.cancel_at_period_end) cancellingCount++;
    const isAnnual = row.billing_interval === 'annual';
    if (row.plan === 'family_plus') {
      if (isAnnual) familyPlusAnnual++; else familyPlusMonthly++;
    } else if (row.plan === 'single_parent_plus') {
      if (isAnnual) singleParentPlusAnnual++; else singleParentPlusMonthly++;
    }
  }

  const totalMRR =
    familyPlusMonthly * PLAN_PRICES.family_plus.monthly +
    familyPlusAnnual * PLAN_PRICES.family_plus.annualMonthly +
    singleParentPlusMonthly * PLAN_PRICES.single_parent_plus.monthly +
    singleParentPlusAnnual * PLAN_PRICES.single_parent_plus.annualMonthly;

  // Build cumulative subscriber growth for last 6 months
  const now = new Date();
  const subscribersByMonth: RevenueStats['subscribersByMonth'] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const count = data.filter(r => new Date(r.created_at) <= endOfMonth).length;
    // Approximate revenue based on average plan price
    const avgPrice = data.length > 0 ? totalMRR / data.length : 0;
    subscribersByMonth.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: DANISH_MONTHS[d.getMonth()],
      count,
      revenue: Math.round(count * avgPrice),
    });
  }

  return {
    activeSubscribers: data.length,
    familyPlusCount: familyPlusMonthly + familyPlusAnnual,
    singleParentPlusCount: singleParentPlusMonthly + singleParentPlusAnnual,
    totalMRR,
    cancellingCount,
    subscribersByMonth,
  };
}
