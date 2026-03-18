import {
  CheckSquare,
  UserCheck,
  Clock,
  RefreshCw,
  Bell,
  ListChecks,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: UserCheck, title: 'Tildel opgaver', desc: 'Fordel opgaver mellem forældre og familiemedlemmer. Alle ved hvem der er ansvarlig.', color: '#f43f5e' },
  { icon: Clock, title: 'Deadlines', desc: 'Sæt deadlines og få påmindelser inden tiden udløber. Aldrig glem en opgave.', color: '#f58a2d' },
  { icon: RefreshCw, title: 'Gentagende opgaver', desc: 'Opret opgaver der gentages ugentligt eller månedligt. Madpakker, lektier, rengøring.', color: '#3b82f6' },
  { icon: ListChecks, title: 'Status-tracking', desc: 'Se hvad der er gjort, hvad der mangler, og hvem der er bagud. Fuldt overblik.', color: '#10b981' },
  { icon: Bell, title: 'Påmindelser', desc: 'Automatiske push-notifikationer når en opgave nærmer sig sin deadline.', color: '#8b5cf6' },
  { icon: CheckSquare, title: 'Kategorier', desc: 'Organisér opgaver i kategorier: Skole, hjem, sundhed, fritid og mere.', color: '#06b6d4' },
];

const details = [
  {
    title: 'Fordel hverdagens opgaver retfærdigt',
    highlightText: 'retfærdigt',
    desc: 'Se hvem der gør hvad og hvornår. Tildel opgaver, sæt deadlines og følg op — så ingen føler sig uretfærdigt belastet.',
    bullets: ['Tildel til specifik forælder', 'Sæt prioritet og deadline', 'Marker som fuldført med ét tryk'],
    color: '#f43f5e',
    icon: CheckSquare,
    visual: (
      <div className="space-y-3 max-w-[260px]">
        {[
          { task: 'Madpakker mandag', done: true, who: 'Dig' },
          { task: 'Hente fra fodbold', done: false, who: 'Medforælder' },
          { task: 'Lektiehjælp onsdag', done: false, who: 'Dig' },
          { task: 'Tandlæge fredag', done: true, who: 'Medforælder' },
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-white/40">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${t.done ? 'bg-[#f43f5e] border-[#f43f5e]' : 'border-[#d4d3cd]'}`}>
              {t.done && <CheckSquare size={12} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-medium ${t.done ? 'line-through text-[#9a978f]' : 'text-[#2f2f2f]'}`}>{t.task}</p>
              <p className="text-[11px] text-[#78766d]">{t.who}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Gentagende opgaver kører automatisk',
    highlightText: 'kører automatisk',
    desc: 'Opret opgaver der gentages ugentligt, hver 14. dag eller månedligt. Perfekt til madpakker, rengøring og faste aftaler.',
    bullets: ['Ugentlig, 14-dages eller månedlig gentagelse', 'Automatisk tildeling efter samværsplan', 'Historik over fuldførte opgaver'],
    color: '#3b82f6',
    icon: RefreshCw,
    reversed: true,
  },
];

export default function OpgaverPage() {
  return (
    <FeaturePageLayout
      badge="Opgaver"
      badgeIcon={CheckSquare}
      title="Fordel"
      titleHighlight="hverdagens opgaver"
      subtitle="Fordel og følg op på familiens opgaver. Se hvem der gør hvad og hvornår — uden diskussion."
      color="#f43f5e"
      features={features}
      details={details}
      ctaTitle="Få styr på opgaverne"
      ctaSubtitle="Opret din første opgaveliste på få sekunder. Helt gratis."
      ctaButtonLabel="Prøv gratis"
      ctaButtonHref="#funktioner"
    />
  );
}
