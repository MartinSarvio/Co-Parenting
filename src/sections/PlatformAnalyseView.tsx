import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus,
  BarChart3, Newspaper, ShoppingBag, Tag, MessageCircle,
  DollarSign, Users, CreditCard,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useNutriScoreMap, matchNutriScore } from '@/hooks/useNutriScoreMap';
import { NutriScoreBadge } from '@/components/custom/NutriScoreBadge';
import {
  fetchContentStats,
  fetchTopProductClicks,
  fetchLinkRedirects,
  fetchActivityOverTime,
  fetchEventBreakdown,
  fetchRevenueStats,
  type ContentStats,
  type ProductClickRow,
  type RedirectRow,
  type ActivityPoint,
  type EventBreakdownEntry,
  type RevenueStats,
} from '@/lib/adminAnalytics';

// ── Card wrapper ────────────────────────────────────────────────────────────

function SectionCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[16px] bg-white border border-[#e8e6df] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden', className)}>
      {title && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-[14px] font-semibold text-[#2f2f2d]">{title}</p>
        </div>
      )}
      {children}
    </div>
  );
}

// ── Trend Badge ─────────────────────────────────────────────────────────────

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#8E8E93]/10 px-2 py-0.5 text-[11px] font-semibold text-[#8E8E93]">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  }
  const diff = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  const isUp = diff > 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
      isUp ? 'bg-[#34C759]/10 text-[#34C759]' : diff < 0 ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 'bg-[#8E8E93]/10 text-[#8E8E93]'
    )}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {isUp ? '+' : ''}{diff}%
    </span>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <BarChart3 className="h-7 w-7 text-[#d4d2cb]" />
      <p className="text-[12px] text-[#9a978f]">{text}</p>
    </div>
  );
}

// ── Custom Tooltips ─────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] border border-[#e8e6df] bg-white px-3 py-2 shadow-lg">
      <p className="text-[12px] font-semibold text-[#2f2f2d]">{label}</p>
      <p className="text-[11px] text-[#5f5d56]">{payload[0].value} events</p>
    </div>
  );
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const sub = payload.find(p => p.dataKey === 'count');
  const rev = payload.find(p => p.dataKey === 'revenue');
  return (
    <div className="rounded-[10px] border border-[#e8e6df] bg-white px-3 py-2 shadow-lg">
      <p className="text-[12px] font-semibold text-[#2f2f2d]">{label}</p>
      {sub && <p className="text-[11px] text-[#5f5d56]">{sub.value} abonnenter</p>}
      {rev && <p className="text-[11px] text-[#34C759] font-medium">{formatCurrency(rev.value)}</p>}
    </div>
  );
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: EventBreakdownEntry }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-[10px] border border-[#e8e6df] bg-white px-3 py-2 shadow-lg">
      <p className="text-[12px] font-semibold text-[#2f2f2d]">{d.label}</p>
      <p className="text-[11px] text-[#5f5d56]">{d.count} ({d.percentage}%)</p>
    </div>
  );
}

// ── Activity Tab ────────────────────────────────────────────────────────────

const ACTIVITY_TABS = [
  { key: 'nyheder', label: 'Nyheder', color: '#f58a2d', gradientId: 'newsGrad' },
  { key: 'tilbud', label: 'Tilbud', color: '#34C759', gradientId: 'tilbudGrad' },
  { key: 'forum', label: 'Forum', color: '#5AC8FA', gradientId: 'forumGrad' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PlatformAnalyseView() {
  const { analyticsPeriod: period } = useAppStore();
  const nutriMap = useNutriScoreMap();

  const [stats, setStats] = useState<ContentStats | null>(null);
  const [topClicks, setTopClicks] = useState<ProductClickRow[]>([]);
  const [redirects, setRedirects] = useState<RedirectRow[]>([]);
  const [newsActivity, setNewsActivity] = useState<ActivityPoint[]>([]);
  const [tilbudActivity, setTilbudActivity] = useState<ActivityPoint[]>([]);
  const [forumActivity, setForumActivity] = useState<ActivityPoint[]>([]);
  const [eventBreakdown, setEventBreakdown] = useState<EventBreakdownEntry[]>([]);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [activeTab, setActiveTab] = useState<'nyheder' | 'tilbud' | 'forum'>('nyheder');

  const loadData = useCallback(async () => {
    try {
      const [s, tc, rd, na, ta, fa, eb, rv] = await Promise.all([
        fetchContentStats(period),
        fetchTopProductClicks(period),
        fetchLinkRedirects(period),
        fetchActivityOverTime('nyheder', period),
        fetchActivityOverTime('tilbud', period),
        fetchActivityOverTime('forum', period),
        fetchEventBreakdown(period),
        fetchRevenueStats(),
      ]);
      setStats(s);
      setTopClicks(tc);
      setRedirects(rd);
      setNewsActivity(na);
      setTilbudActivity(ta);
      setForumActivity(fa);
      setEventBreakdown(eb);
      setRevenue(rv);
    } catch {
      // Silently fail
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalEvents = eventBreakdown.reduce((sum, e) => sum + e.count, 0);

  const activityData: Record<string, ActivityPoint[]> = {
    nyheder: newsActivity,
    tilbud: tilbudActivity,
    forum: forumActivity,
  };
  const currentTabData = activityData[activeTab] ?? [];
  const currentTab = ACTIVITY_TABS.find(t => t.key === activeTab)!;

  return (
    <div className="space-y-4 pb-8">

      {/* ── Indholdsstatistik (2x2 pastel kort) ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[16px] bg-[#fff6ef] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f58a2d]/20">
              <Newspaper className="h-5 w-5 text-[#f58a2d]" />
            </div>
            {stats && <TrendBadge current={stats.newsViews} previous={stats.newsViewsPrev} />}
          </div>
          <p className="text-[28px] font-bold text-[#2f2f2d] leading-none tabular-nums">{stats?.newsViews ?? 0}</p>
          <p className="text-[12px] text-[#7a786f] mt-1.5">Nyheds-visninger</p>
        </div>

        <div className="rounded-[16px] bg-[#eef9ee] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#34C759]/20">
              <ShoppingBag className="h-5 w-5 text-[#34C759]" />
            </div>
            {stats && <TrendBadge current={stats.productClicks} previous={stats.productClicksPrev} />}
          </div>
          <p className="text-[28px] font-bold text-[#2f2f2d] leading-none tabular-nums">{stats?.productClicks ?? 0}</p>
          <p className="text-[12px] text-[#7a786f] mt-1.5">Produkt-klik</p>
        </div>

        <div className="rounded-[16px] bg-[#f5effe] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#AF52DE]/20">
              <Tag className="h-5 w-5 text-[#AF52DE]" />
            </div>
            {stats && <TrendBadge current={stats.offerViews} previous={stats.offerViewsPrev} />}
          </div>
          <p className="text-[28px] font-bold text-[#2f2f2d] leading-none tabular-nums">{stats?.offerViews ?? 0}</p>
          <p className="text-[12px] text-[#7a786f] mt-1.5">Sidevisninger</p>
        </div>

        <div className="rounded-[16px] bg-[#eaf6ff] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5AC8FA]/20">
              <MessageCircle className="h-5 w-5 text-[#5AC8FA]" />
            </div>
            {stats && <TrendBadge current={stats.forumPosts} previous={stats.forumPostsPrev} />}
          </div>
          <p className="text-[28px] font-bold text-[#2f2f2d] leading-none tabular-nums">{stats?.forumPosts ?? 0}</p>
          <p className="text-[12px] text-[#7a786f] mt-1.5">Forum-indlæg</p>
        </div>
      </div>

      {/* ── Engagement Donut ─────────────────────────────────────────────── */}
      <SectionCard title="Engagement-fordeling">
        <div className="px-4 pb-4">
          {eventBreakdown.length === 0 ? (
            <EmptyChart text="Ingen events registreret endnu" />
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative" style={{ width: 210, height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventBreakdown}
                      dataKey="count"
                      nameKey="label"
                      cx="50%" cy="50%"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {eventBreakdown.map((entry) => (
                        <Cell key={entry.eventType} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[28px] font-bold text-[#2f2f2d] leading-none tabular-nums">{totalEvents.toLocaleString('da-DK')}</p>
                  <p className="text-[11px] text-[#9a978f] mt-1">Total events</p>
                </div>
              </div>

              <div className="w-full mt-3 space-y-0">
                {eventBreakdown.map((entry) => (
                  <div key={entry.eventType} className="flex items-center gap-3 py-2 border-b border-[#f2f1ed] last:border-b-0">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-[13px] text-[#4a4945] flex-1">{entry.label}</span>
                    <span className="text-[13px] font-semibold text-[#2f2f2d] tabular-nums">{entry.count.toLocaleString('da-DK')}</span>
                    <span className="text-[12px] font-medium tabular-nums w-11 text-right" style={{ color: entry.color }}>{entry.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Omsætning & Abonnementer ─────────────────────────────────────── */}
      <SectionCard title="Omsætning & Abonnementer">
        <div className="px-4 pb-4">
          {/* 3 mini-kort */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-[12px] bg-[#eef9ee] p-3 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#34C759]/20 mx-auto mb-1.5">
                <DollarSign className="h-4.5 w-4.5 text-[#34C759]" />
              </div>
              <p className="text-[17px] font-bold text-[#2f2f2d] leading-none tabular-nums">
                {revenue ? formatCurrency(revenue.totalMRR) : '—'}
              </p>
              <p className="text-[10px] text-[#9a978f] mt-1 uppercase tracking-wider font-medium">MRR</p>
            </div>

            <div className="rounded-[12px] bg-[#eaf6ff] p-3 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5AC8FA]/20 mx-auto mb-1.5">
                <Users className="h-4.5 w-4.5 text-[#5AC8FA]" />
              </div>
              <p className="text-[17px] font-bold text-[#2f2f2d] leading-none tabular-nums">
                {revenue?.activeSubscribers ?? 0}
              </p>
              <p className="text-[10px] text-[#9a978f] mt-1 uppercase tracking-wider font-medium">Aktive</p>
            </div>

            <div className="rounded-[12px] bg-[#fff3f0] p-3 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF3B30]/20 mx-auto mb-1.5">
                <CreditCard className="h-4.5 w-4.5 text-[#FF3B30]" />
              </div>
              <p className="text-[17px] font-bold text-[#2f2f2d] leading-none tabular-nums">
                {revenue?.cancellingCount ?? 0}
              </p>
              <p className="text-[10px] text-[#9a978f] mt-1 uppercase tracking-wider font-medium">Opsiger</p>
            </div>
          </div>

          {/* Abonnent-vækst chart */}
          <div className="rounded-[12px] bg-[#faf9f6] p-3">
            <p className="text-[12px] font-medium text-[#7a786f] mb-2">Abonnent-vækst (6 mdr.)</p>
            {!revenue || revenue.subscribersByMonth.length === 0 ? (
              <EmptyChart text="Ingen abonnementsdata endnu" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={revenue.subscribersByMonth} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34C759" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#34C759" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9a978f' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9a978f' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#34C759"
                    fill="url(#revGradient)"
                    strokeWidth={2.5}
                    dot={{ fill: '#34C759', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#34C759', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Plan breakdown */}
          <div className="mt-3 rounded-[12px] bg-[#faf9f6] divide-y divide-[#e8e6df]">
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#f58a2d]" />
                <span className="text-[13px] text-[#4a4945]">Family Plus</span>
              </div>
              <span className="text-[13px] font-semibold text-[#2f2f2d] tabular-nums">{revenue?.familyPlusCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#AF52DE]" />
                <span className="text-[13px] text-[#4a4945]">Single Parent Plus</span>
              </div>
              <span className="text-[13px] font-semibold text-[#2f2f2d] tabular-nums">{revenue?.singleParentPlusCount ?? 0}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Aktivitet over tid (tabbed) ──────────────────────────────────── */}
      <SectionCard title="Aktivitet over tid">
        <div className="px-4 pb-4">
          {/* Tab bar */}
          <div className="flex gap-1 mb-3 rounded-[10px] bg-[#f2f1ed] p-1">
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 py-1.5 rounded-[8px] text-[12px] font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-white text-[#2f2f2d] shadow-sm'
                    : 'text-[#9a978f]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {currentTabData.length === 0 ? (
            <EmptyChart text={`Ingen ${currentTab.label.toLowerCase()}-aktivitet endnu`} />
          ) : activeTab === 'forum' ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={currentTabData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9a978f' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9a978f' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="count" stroke={currentTab.color} strokeWidth={2.5} dot={{ fill: currentTab.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: currentTab.color, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={currentTabData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id={currentTab.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentTab.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={currentTab.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9a978f' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9a978f' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="count" stroke={currentTab.color} fill={`url(#${currentTab.gradientId})`} strokeWidth={2.5} dot={{ fill: currentTab.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: currentTab.color, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>

      {/* ── Top 10 Produkt-klik ──────────────────────────────────────────── */}
      <SectionCard title="Top 10 mest klikkede produkter">
        {topClicks.length === 0 ? (
          <div className="px-4 pb-4">
            <EmptyChart text="Ingen produktklik registreret endnu" />
          </div>
        ) : (
          <div className="px-2 pb-2">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#f2f1ed]">
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#9a978f]">#</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#9a978f]">Produkt</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#9a978f]">Score</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#9a978f]">Butik</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#9a978f] text-right">Klik</th>
                </tr>
              </thead>
              <tbody>
                {topClicks.map((row, i) => (
                  <tr key={row.targetId} className={i % 2 === 0 ? 'bg-white' : 'bg-[#faf9f6]'}>
                    <td className="px-3 py-2.5 text-[12px] font-semibold text-[#9a978f]">{i + 1}</td>
                    <td className="px-3 py-2.5 text-[13px] text-[#2f2f2d]">{row.name}</td>
                    <td className="px-3 py-2.5">
                      {(() => { const g = matchNutriScore(row.name, nutriMap); return g ? <NutriScoreBadge grade={g} size="sm" /> : <span className="text-[11px] text-[#c5c3bb]">—</span>; })()}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-[#7a786f]">{row.store}</td>
                    <td className="px-3 py-2.5 text-[13px] font-semibold text-[#2f2f2d] text-right tabular-nums">{row.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Link Redirects ───────────────────────────────────────────────── */}
      <SectionCard title="Link-redirects pr. destination">
        <div className="px-4 pb-4">
          {redirects.length === 0 ? (
            <EmptyChart text="Ingen link-redirects registreret endnu" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(120, redirects.length * 40)}>
              <BarChart data={redirects} layout="vertical" margin={{ left: 0, right: 5 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9a978f' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="destination" tick={{ fontSize: 12, fill: '#4a4945' }} width={90} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="clicks" fill="#f58a2d" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
