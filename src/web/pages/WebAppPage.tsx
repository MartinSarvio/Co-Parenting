import {
  Globe,
  Monitor,
  CalendarRange,
  GripVertical,
  Printer,
  Users,
  BarChart3,
  Calendar,
  CheckSquare,
  MessageCircle,
  Wallet,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: Monitor, title: 'Dashboard-overblik', desc: 'Se alt på ét sted: samvær, opgaver, udgifter og beskeder i et samlet dashboard.', color: '#1a1a1a' },
  { icon: CalendarRange, title: 'Full-screen kalender', desc: 'Stor kalendervisning med uger og måneder. Perfekt til planlægning på den store skærm.', color: '#1a1a1a' },
  { icon: GripVertical, title: 'Drag & drop', desc: 'Flyt opgaver, begivenheder og samværsdage med drag & drop. Hurtigt og intuitivt.', color: '#1a1a1a' },
  { icon: Printer, title: 'Print samværsplan', desc: 'Udskriv samværsplanen til papir — perfekt til at hænge på køleskabet eller dele med skolen.', color: '#1a1a1a' },
  { icon: Users, title: 'Multi-bruger adgang', desc: 'Log ind fra enhver browser. Del adgang med nye partnere, bedsteforældre eller rådgivere.', color: '#1a1a1a' },
  { icon: BarChart3, title: 'Detaljerede rapporter', desc: 'Se statistik over udgifter, samvær og opgavefordeling i overskuelige grafer.', color: '#1a1a1a' },
];

// Hero: Browser mockup with sidebar + 2×2 dashboard grid
const HeroBrowser = () => {
  const navItems = [
    { icon: Calendar, label: 'Samvær' },
    { icon: CheckSquare, label: 'Opgaver' },
    { icon: MessageCircle, label: 'Beskeder' },
    { icon: Wallet, label: 'Udgifter' },
  ];

  const dashCards = [
    { icon: Calendar, label: 'Samvær', data: '7/7 aktiv', sub: 'Næste skift: om 2 dage' },
    { icon: CheckSquare, label: 'Opgaver', data: '3 aktive', sub: '2 fuldført denne uge' },
    { icon: MessageCircle, label: 'Beskeder', data: '2 ulæste', sub: 'Seneste: i dag kl. 14:22' },
    { icon: Wallet, label: 'Udgifter', data: 'Kr. 0', sub: 'I balance denne måned' },
  ];

  return (
    <div className="animate-scaleIn pointer-events-none w-[380px] rounded-xl border border-[#d4d3cd] bg-white shadow-2xl overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#f9f8f5] border-b border-[#e8e6df]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#d4d3cd]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#d4d3cd]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#d4d3cd]" />
        <div className="flex-1 mx-6 h-5 rounded-md bg-[#e8e6df]/60 flex items-center justify-center text-[9px] text-[#9a978f]">
          huska.dk/dashboard
        </div>
      </div>

      {/* App layout: sidebar + content */}
      <div className="flex h-[240px]">
        {/* Sidebar */}
        <div className="w-[90px] border-r border-[#e8e6df] bg-[#fafaf8] p-2 shrink-0">
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <div className="w-5 h-5 rounded-md bg-[#2f2f2f] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">H</span>
            </div>
            <span className="text-[9px] font-bold text-[#2f2f2f]">Huska</span>
          </div>
          {navItems.map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 px-1.5 py-1.5 rounded-lg mb-0.5 text-[9px] font-medium ${
                i === 0 ? 'bg-[#2f2f2f] text-white' : 'text-[#78766d]'
              }`}
            >
              <item.icon size={11} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Content area: 2×2 grid */}
        <div className="flex-1 p-3 overflow-hidden">
          <p className="text-[10px] font-bold text-[#2f2f2f] mb-2">Dashboard</p>
          <div className="grid grid-cols-2 gap-2">
            {dashCards.map((card, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-[#f9f8f5] border border-[#e8e6df]/60 animate-fadeIn"
                style={{ animationDelay: `${(i + 1) * 150}ms` }}
              >
                <div className="flex items-center gap-1 mb-1.5">
                  <div className="w-4 h-4 rounded bg-[#2f2f2f]/[0.06] flex items-center justify-center">
                    <card.icon size={9} className="text-[#2f2f2f]" />
                  </div>
                  <span className="text-[8px] font-bold text-[#78766d]">{card.label}</span>
                </div>
                <p className="text-[11px] font-bold text-[#2f2f2f] leading-tight">{card.data}</p>
                <p className="text-[8px] text-[#9a978f] mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Detail 1: Dashboard with calendar widget
const DetailDashboardCalendar = () => {
  const dayLabels = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];
  return (
    <div className="max-w-[300px] w-full">
      <div className="rounded-xl border border-[#d4d3cd] bg-white shadow-lg overflow-hidden">
        <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#f9f8f5] border-b border-[#e8e6df]">
          <div className="w-2 h-2 rounded-full bg-[#d4d3cd]" />
          <div className="w-2 h-2 rounded-full bg-[#d4d3cd]" />
          <div className="w-2 h-2 rounded-full bg-[#d4d3cd]" />
          <span className="text-[8px] text-[#9a978f] ml-3">huska.dk/kalender</span>
        </div>
        <div className="p-3">
          <p className="text-[10px] font-bold text-[#2f2f2f] mb-2">Marts 2026</p>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {dayLabels.map(d => (
              <div key={d} className="text-[7px] text-center text-[#9a978f] font-bold">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={`empty-${i}`} className="h-5" />
            ))}
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1;
              const isToday = day === 18;
              return (
                <div
                  key={day}
                  className={`h-5 rounded flex items-center justify-center text-[8px] font-medium ${
                    isToday ? 'bg-[#2f2f2f] text-white font-bold' : 'text-[#5f5d56]'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Detail 2: Print preview mockup
const DetailPrintPreview = () => (
  <div className="max-w-[240px] w-full">
    <div className="p-4 rounded-xl bg-white border-2 border-[#e8e6df] shadow-lg relative">
      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#2f2f2f] flex items-center justify-center shadow-md">
        <Printer size={12} className="text-white" />
      </div>
      <p className="text-[10px] font-bold text-[#2f2f2f] mb-1">Samværsplan — Marts 2026</p>
      <p className="text-[8px] text-[#9a978f] mb-3">7/7 model · Udskrevet d. 18. marts</p>
      <div className="space-y-1">
        {['Uge 11', 'Uge 12', 'Uge 13', 'Uge 14'].map((uge, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[7px] font-bold text-[#9a978f] w-8 shrink-0">{uge}</span>
            <div className="flex-1 flex gap-0.5">
              {Array.from({ length: 7 }, (_, d) => (
                <div
                  key={d}
                  className={`flex-1 h-3 rounded-sm ${
                    (i % 2 === 0) ? 'bg-[#2f2f2f]' : 'bg-[#d4d3cd]'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-[#e8e6df] flex gap-2 text-[7px] text-[#9a978f]">
        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-sm bg-[#2f2f2f]" /> F1</span>
        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-sm bg-[#d4d3cd]" /> F2</span>
      </div>
    </div>
  </div>
);

const details = [
  {
    title: 'Alt samlet i ét dashboard',
    highlightText: 'ét dashboard',
    desc: 'Web-appen giver dig det fulde overblik over familiens hverdag. Se samvær, opgaver, udgifter og beskeder — alt sammen på den store skærm.',
    bullets: ['Hurtig adgang fra enhver browser', 'Ingen installation nødvendig', 'Synkroniserer med mobil-appen'],
    color: '#1a1a1a',
    icon: Monitor,
    visual: <DetailDashboardCalendar />,
  },
  {
    title: 'Planlæg effektivt på den store skærm',
    highlightText: 'den store skærm',
    desc: 'Udnyt den ekstra plads til at planlægge samvær, organisere opgaver og holde styr på udgifter. Drag & drop gør det nemt og hurtigt.',
    bullets: ['Kalender med uger og måneder', 'Drag & drop til opgaver og begivenheder', 'Udskriv planer og rapporter'],
    color: '#1a1a1a',
    icon: CalendarRange,
    reversed: true,
    visual: <DetailPrintPreview />,
  },
];

export default function WebAppPage() {
  return (
    <FeaturePageLayout
      bgTone="#f4f5f3"
      badge="Web App"
      badgeIcon={Globe}
      title="Huska"
      titleHighlight="i browseren"
      subtitle="Fuld adgang til alle funktioner direkte i din browser. Perfekt til planlægning og overblik på den store skærm."
      color="#1a1a1a"
      features={features}
      details={details}
      ctaTitle="Prøv Huska i browseren"
      ctaSubtitle="Gratis adgang fra enhver browser. Ingen installation nødvendig."
      ctaButtonLabel="Kom i gang"
      ctaButtonHref="#funktioner"
      heroVisual={<HeroBrowser />}
    />
  );
}
