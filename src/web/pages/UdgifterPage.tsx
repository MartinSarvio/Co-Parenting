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
  { icon: Split, title: 'Retfærdig deling', desc: 'Del udgifter 50/50 eller efter aftale. Automatisk beregning af hvem der skylder hvad.', color: '#10b981' },
  { icon: Receipt, title: 'Kvitteringer', desc: 'Tag foto af kvitteringer og vedhæft til udgiften. Alt dokumenteret og gennemsigtigt.', color: '#f58a2d' },
  { icon: PiggyBank, title: 'Budgetter', desc: 'Sæt budgetter for kategorier som tøj, fritid og skole. Hold styr på forbruget.', color: '#3b82f6' },
  { icon: BarChart3, title: 'Balance-oversigt', desc: 'Se den aktuelle balance mellem forældre. Hvem har betalt mest denne måned?', color: '#8b5cf6' },
  { icon: Camera, title: 'Foto-dokumentation', desc: 'Vedhæft billeder til udgifter. Kvitteringer, fakturaer og anden dokumentation.', color: '#f43f5e' },
  { icon: Wallet, title: 'Kategorier', desc: 'Organisér udgifter i kategorier: Mad, tøj, fritid, sundhed, skole og mere.', color: '#06b6d4' },
];

const details = [
  {
    title: 'Del udgifter retfærdigt og transparent',
    highlightText: 'retfærdigt og transparent',
    desc: 'Hold styr på alle fælles udgifter. Se hvem der har betalt hvad, og hvad den aktuelle balance er. Ingen diskussion.',
    bullets: ['Automatisk 50/50 eller tilpasset deling', 'Realtids balance-oversigt', 'Månedlig opgørelse'],
    color: '#10b981',
    icon: Wallet,
    visual: (
      <div className="max-w-[260px] space-y-3">
        <div className="p-4 rounded-2xl bg-white/70 border border-white/40">
          <p className="text-[11px] font-bold text-[#78766d] uppercase tracking-wider mb-2">Balance denne måned</p>
          <p className="text-2xl font-[800] text-[#10b981]">Kr. 0</p>
          <p className="text-[12px] text-[#78766d] mt-1">I balance ✓</p>
        </div>
        {[
          { item: 'Fodboldsko', amount: 'Kr. 450', who: 'Dig', color: '#f58a2d' },
          { item: 'Tandlæge', amount: 'Kr. 380', who: 'Medforælder', color: '#3b82f6' },
          { item: 'SFO-betaling', amount: 'Kr. 1.200', who: 'Dig', color: '#f58a2d' },
        ].map((e, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-white/40">
            <div>
              <p className="text-[13px] font-medium text-[#2f2f2f]">{e.item}</p>
              <p className="text-[11px] text-[#78766d]">{e.who}</p>
            </div>
            <p className="text-[13px] font-bold" style={{ color: e.color }}>{e.amount}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Budgetter der holder styr på forbruget',
    highlightText: 'holder styr',
    desc: 'Sæt budgetter for forskellige kategorier og se hvordan I ligger an. Få varsel når et budget nærmer sig grænsen.',
    bullets: ['Kategoriserede budgetter', 'Visuel fremgang-bar', 'Varsler ved overforbrug'],
    color: '#3b82f6',
    icon: PiggyBank,
    reversed: true,
  },
];

export default function UdgifterPage() {
  return (
    <FeaturePageLayout
      badge="Udgifter"
      badgeIcon={Wallet}
      title="Del udgifter"
      titleHighlight="retfærdigt"
      subtitle="Hold styr på fælles udgifter, budgetter og kvitteringer. Automatisk deling og gennemsigtig balance."
      color="#10b981"
      features={features}
      details={details}
      ctaTitle="Få styr på udgifterne"
      ctaSubtitle="Start med at dele udgifter i dag. Helt gratis."
      ctaButtonLabel="Prøv gratis"
      ctaButtonHref="#funktioner"
    />
  );
}
