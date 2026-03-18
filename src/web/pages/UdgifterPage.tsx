import {
  Wallet,
  Split,
  Receipt,
  PiggyBank,
  BarChart3,
  Camera,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: Split, title: 'Retfærdig deling', desc: 'Del udgifter 50/50 eller efter aftale. Automatisk beregning af hvem der skylder hvad.', color: '#1a1a1a' },
  { icon: Receipt, title: 'Kvitteringer', desc: 'Tag foto af kvitteringer og vedhæft til udgiften. Alt dokumenteret og gennemsigtigt.', color: '#1a1a1a' },
  { icon: PiggyBank, title: 'Budgetter', desc: 'Sæt budgetter for kategorier som tøj, fritid og skole. Hold styr på forbruget.', color: '#1a1a1a' },
  { icon: BarChart3, title: 'Balance-oversigt', desc: 'Se den aktuelle balance mellem forældre. Hvem har betalt mest denne måned?', color: '#1a1a1a' },
  { icon: Camera, title: 'Foto-dokumentation', desc: 'Vedhæft billeder til udgifter. Kvitteringer, fakturaer og anden dokumentation.', color: '#1a1a1a' },
  { icon: Wallet, title: 'Kategorier', desc: 'Organisér udgifter i kategorier: Mad, tøj, fritid, sundhed, skole og mere.', color: '#1a1a1a' },
];

// Hero: Expense dashboard with balance, progress bar, and expense list
const HeroDashboard = () => (
  <div className="animate-scaleIn pointer-events-none max-w-[300px] w-full space-y-3">
    {/* Balance card */}
    <div className="p-4 rounded-2xl bg-white/80 border border-white/50 shadow-xl">
      <p className="text-[10px] font-bold text-[#78766d] uppercase tracking-wider mb-1">Balance denne måned</p>
      <p className="text-[28px] font-[800] text-[#2f2f2f] leading-none animate-countPulse">Kr. 0</p>
      <p className="text-[11px] text-[#78766d] mt-1">I balance ✓</p>

      {/* 50/50 progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[9px] font-semibold text-[#78766d] mb-1">
          <span>Forælder 1</span>
          <span>Forælder 2</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden flex bg-[#e8e6df]">
          <div className="bg-[#2f2f2f] animate-progressFill" style={{ width: '50%' }} />
          <div className="bg-[#d4d3cd] flex-1" />
        </div>
        <div className="flex items-center justify-between text-[9px] text-[#9a978f] mt-0.5">
          <span>Kr. 2.030</span>
          <span>Kr. 2.030</span>
        </div>
      </div>
    </div>

    {/* Expense list */}
    <div className="rounded-2xl bg-white/70 border border-white/40 shadow-sm overflow-hidden">
      <div className="px-3.5 py-2 border-b border-[#e8e6df]">
        <p className="text-[10px] font-bold text-[#2f2f2f]">Seneste udgifter</p>
      </div>
      {[
        { item: 'Fodboldsko', amount: 'Kr. 450', who: 'F1', cat: '⚽' },
        { item: 'Tandlæge', amount: 'Kr. 380', who: 'F2', cat: '🦷' },
        { item: 'SFO-betaling', amount: 'Kr. 1.200', who: 'F1', cat: '🏫' },
      ].map((e, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[#e8e6df]/40 last:border-0 animate-slideUp"
          style={{ animationDelay: `${(i + 1) * 150}ms` }}
        >
          <span className="text-[14px] shrink-0">{e.cat}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[#2f2f2f]">{e.item}</p>
            <p className="text-[10px] text-[#78766d]">{e.who === 'F1' ? 'Forælder 1' : 'Forælder 2'}</p>
          </div>
          <p className="text-[12px] font-bold text-[#2f2f2f] shrink-0">{e.amount}</p>
        </div>
      ))}
    </div>
  </div>
);

// Detail 1: Enhanced expense list with receipt icons
const DetailExpenseList = () => (
  <div className="max-w-[280px] w-full">
    <div className="p-4 rounded-2xl bg-white/80 border border-white/50 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-bold text-[#2f2f2f]">Marts 2026</p>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2f2f2f]/5 text-[#78766d]">8 udgifter</span>
      </div>
      {[
        { item: 'Fodboldsko', amount: 'Kr. 450', who: 'F1', cat: '⚽', hasReceipt: true },
        { item: 'Tandlæge', amount: 'Kr. 380', who: 'F2', cat: '🦷', hasReceipt: true },
        { item: 'SFO-betaling', amount: 'Kr. 1.200', who: 'F1', cat: '🏫', hasReceipt: false },
        { item: 'Vinterstøvler', amount: 'Kr. 550', who: 'F2', cat: '👢', hasReceipt: true },
        { item: 'Svømmehal', amount: 'Kr. 90', who: 'F1', cat: '🏊', hasReceipt: false },
      ].map((e, i) => (
        <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[#e8e6df]/40 last:border-0">
          <span className="text-[14px] shrink-0">{e.cat}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[#2f2f2f]">{e.item}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-[#78766d]">{e.who === 'F1' ? 'Forælder 1' : 'Forælder 2'}</p>
              {e.hasReceipt && (
                <span className="text-[8px] px-1 py-0.5 rounded bg-[#2f2f2f]/[0.05] text-[#78766d] font-medium">📎</span>
              )}
            </div>
          </div>
          <p className="text-[11px] font-bold text-[#2f2f2f] shrink-0">{e.amount}</p>
        </div>
      ))}
    </div>
  </div>
);

// Detail 2: Monthly bar chart (CSS-only)
const DetailBarChart = () => (
  <div className="max-w-[260px] w-full">
    <div className="p-4 rounded-2xl bg-white/80 border border-white/50 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-[#2f2f2f]">Månedlig oversigt</p>
        <BarChart3 size={13} className="text-[#78766d]" />
      </div>
      <div className="flex items-end gap-2 h-[100px]">
        {[
          { month: 'Okt', f1: 30, f2: 25 },
          { month: 'Nov', f1: 40, f2: 30 },
          { month: 'Dec', f1: 50, f2: 40 },
          { month: 'Jan', f1: 35, f2: 25 },
          { month: 'Feb', f1: 30, f2: 35 },
          { month: 'Mar', f1: 25, f2: 25 },
        ].map((m, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden">
              <div className="bg-[#2f2f2f] animate-progressFill" style={{ height: `${m.f1}px`, animationDelay: `${i * 100}ms` }} />
              <div className="bg-[#d4d3cd]" style={{ height: `${m.f2}px` }} />
            </div>
            <span className="text-[8px] text-[#9a978f] font-medium">{m.month}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-3 text-[9px] text-[#78766d]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[#2f2f2f]" />
          Forælder 1
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[#d4d3cd]" />
          Forælder 2
        </span>
      </div>
    </div>
  </div>
);

const details = [
  {
    title: 'Del udgifter retfærdigt og transparent',
    highlightText: 'retfærdigt og transparent',
    desc: 'Hold styr på alle fælles udgifter. Se hvem der har betalt hvad, og hvad den aktuelle balance er. Ingen diskussion.',
    bullets: ['Automatisk 50/50 eller tilpasset deling', 'Realtids balance-oversigt', 'Månedlig opgørelse'],
    color: '#1a1a1a',
    icon: Wallet,
    visual: <DetailExpenseList />,
  },
  {
    title: 'Budgetter der holder styr på forbruget',
    highlightText: 'holder styr',
    desc: 'Sæt budgetter for forskellige kategorier og se hvordan I ligger an. Få varsel når et budget nærmer sig grænsen.',
    bullets: ['Kategoriserede budgetter', 'Visuel fremgang-bar', 'Varsler ved overforbrug'],
    color: '#1a1a1a',
    icon: PiggyBank,
    reversed: true,
    visual: <DetailBarChart />,
  },
];

export default function UdgifterPage() {
  return (
    <FeaturePageLayout
      bgTone="#f5f6f3"
      badge="Udgifter"
      badgeIcon={Wallet}
      title="Del udgifter"
      titleHighlight="retfærdigt"
      subtitle="Hold styr på fælles udgifter, budgetter og kvitteringer. Automatisk deling og gennemsigtig balance."
      color="#1a1a1a"
      features={features}
      details={details}
      ctaTitle="Få styr på udgifterne"
      ctaSubtitle="Start med at dele udgifter i dag. Helt gratis."
      ctaButtonLabel="Prøv gratis"
      ctaButtonHref="#funktioner"
      heroVisual={<HeroDashboard />}
    />
  );
}
