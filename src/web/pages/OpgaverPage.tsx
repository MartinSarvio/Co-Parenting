import {
  CheckSquare,
  UserCheck,
  Clock,
  RefreshCw,
  Bell,
  ListChecks,
  Check,
  GripVertical,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: UserCheck, title: 'Tildel opgaver', desc: 'Fordel opgaver mellem forældre og familiemedlemmer. Alle ved hvem der er ansvarlig.', color: '#1a1a1a' },
  { icon: Clock, title: 'Deadlines', desc: 'Sæt deadlines og få påmindelser inden tiden udløber. Aldrig glem en opgave.', color: '#1a1a1a' },
  { icon: RefreshCw, title: 'Gentagende opgaver', desc: 'Opret opgaver der gentages ugentligt eller månedligt. Madpakker, lektier, rengøring.', color: '#1a1a1a' },
  { icon: ListChecks, title: 'Status-tracking', desc: 'Se hvad der er gjort, hvad der mangler, og hvem der er bagud. Fuldt overblik.', color: '#1a1a1a' },
  { icon: Bell, title: 'Påmindelser', desc: 'Automatiske push-notifikationer når en opgave nærmer sig sin deadline.', color: '#1a1a1a' },
  { icon: CheckSquare, title: 'Kategorier', desc: 'Organisér opgaver i kategorier: Skole, hjem, sundhed, fritid og mere.', color: '#1a1a1a' },
];

// Kanban-style task board visual
const HeroKanban = () => (
  <div className="animate-scaleIn pointer-events-none max-w-[340px] w-full">
    <div className="grid grid-cols-2 gap-3">
      {/* Column: At gøre */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#2f2f2f]" />
          <p className="text-[11px] font-bold text-[#2f2f2f]">At gøre</p>
          <span className="text-[10px] text-[#9a978f] ml-auto">3</span>
        </div>
        {[
          { task: 'Hente fra fodbold', who: 'M', deadline: 'Onsdag', urgent: false },
          { task: 'Lektiehjælp', who: 'D', deadline: 'I dag', urgent: true },
          { task: 'Købe gummistøvler', who: 'D', deadline: '2 dage', urgent: false },
        ].map((t, i) => (
          <div
            key={i}
            className="p-2.5 rounded-xl bg-white/80 border border-white/50 shadow-sm animate-slideUp"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <div className="flex items-start gap-2">
              <GripVertical size={12} className="text-[#d4d3cd] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#2f2f2f] leading-tight">{t.task}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#2f2f2f]/[0.06] flex items-center justify-center text-[9px] font-bold text-[#2f2f2f]">
                    {t.who}
                  </span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                    t.urgent ? 'bg-[#2f2f2f] text-white' : 'bg-[#2f2f2f]/[0.05] text-[#78766d]'
                  }`}>
                    {t.deadline}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Column: Fuldført */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#d4d3cd]" />
          <p className="text-[11px] font-bold text-[#9a978f]">Fuldført</p>
          <span className="text-[10px] text-[#9a978f] ml-auto">2</span>
        </div>
        {[
          { task: 'Madpakker mandag', who: 'D' },
          { task: 'Tandlæge kl. 10', who: 'M' },
        ].map((t, i) => (
          <div
            key={i}
            className="p-2.5 rounded-xl bg-white/50 border border-white/30 shadow-sm animate-slideUp"
            style={{ animationDelay: `${(i + 3) * 120}ms` }}
          >
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-md bg-[#2f2f2f] flex items-center justify-center shrink-0 mt-0.5">
                <Check size={10} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#9a978f] line-through leading-tight">{t.task}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#2f2f2f]/[0.04] flex items-center justify-center text-[9px] font-bold text-[#9a978f]">
                    {t.who}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Detail 1: Enhanced task list with drag handles
const DetailTaskList = () => (
  <div className="max-w-[280px] w-full">
    <div className="p-4 rounded-2xl bg-white/80 border border-white/50 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-bold text-[#2f2f2f]">Denne uge</p>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2f2f2f]/5 text-[#78766d]">5 opgaver</span>
      </div>
      {[
        { task: 'Madpakker mandag', done: true, who: 'Dig', priority: 'normal' },
        { task: 'Hente fra fodbold', done: false, who: 'Medforælder', priority: 'high' },
        { task: 'Lektiehjælp onsdag', done: false, who: 'Dig', priority: 'normal' },
        { task: 'Tandlæge fredag', done: false, who: 'Medforælder', priority: 'high' },
        { task: 'Købe vinterstøvler', done: true, who: 'Dig', priority: 'normal' },
      ].map((t, i) => (
        <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[#e8e6df]/40 last:border-0">
          <GripVertical size={11} className="text-[#d4d3cd] shrink-0" />
          <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${
            t.done ? 'bg-[#2f2f2f] border-[#2f2f2f]' : 'border-[#d4d3cd]'
          }`}>
            {t.done && <Check size={10} className="text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[12px] font-medium leading-tight ${t.done ? 'line-through text-[#9a978f]' : 'text-[#2f2f2f]'}`}>
              {t.task}
            </p>
            <p className="text-[10px] text-[#78766d]">{t.who}</p>
          </div>
          {t.priority === 'high' && !t.done && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#2f2f2f] text-white shrink-0">!</span>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Detail 2: Recurring tasks visual
const DetailRecurring = () => (
  <div className="max-w-[260px] w-full">
    <div className="p-4 rounded-2xl bg-white/80 border border-white/50 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-bold text-[#2f2f2f]">Gentagende</p>
        <RefreshCw size={13} className="text-[#78766d]" />
      </div>
      {[
        { task: 'Madpakker', freq: 'Hver mandag', icon: '🍱' },
        { task: 'Rengøring', freq: 'Hver 14. dag', icon: '🧹' },
        { task: 'Lektiehjælp', freq: 'Man + ons + fre', icon: '📚' },
      ].map((t, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#e8e6df]/40 last:border-0">
          <span className="text-[16px] shrink-0">{t.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#2f2f2f]">{t.task}</p>
            <p className="text-[10px] text-[#78766d]">{t.freq}</p>
          </div>
          <RefreshCw size={11} className="text-[#d4d3cd] shrink-0" />
        </div>
      ))}

      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2f2f2f]/[0.04] border border-[#2f2f2f]/[0.06]">
        <RefreshCw size={13} className="text-[#2f2f2f] shrink-0" />
        <div>
          <p className="text-[10px] font-semibold text-[#2f2f2f]">Næste gentagelse</p>
          <p className="text-[9px] text-[#78766d]">Madpakker — mandag d. 23</p>
        </div>
      </div>
    </div>
  </div>
);

const details = [
  {
    title: 'Fordel hverdagens opgaver retfærdigt',
    highlightText: 'retfærdigt',
    desc: 'Se hvem der gør hvad og hvornår. Tildel opgaver, sæt deadlines og følg op — så ingen føler sig uretfærdigt belastet.',
    bullets: ['Tildel til specifik forælder', 'Sæt prioritet og deadline', 'Marker som fuldført med ét tryk'],
    color: '#1a1a1a',
    icon: CheckSquare,
    visual: <DetailTaskList />,
  },
  {
    title: 'Gentagende opgaver kører automatisk',
    highlightText: 'kører automatisk',
    desc: 'Opret opgaver der gentages ugentligt, hver 14. dag eller månedligt. Perfekt til madpakker, rengøring og faste aftaler.',
    bullets: ['Ugentlig, 14-dages eller månedlig gentagelse', 'Automatisk tildeling efter samværsplan', 'Historik over fuldførte opgaver'],
    color: '#1a1a1a',
    icon: RefreshCw,
    reversed: true,
    visual: <DetailRecurring />,
  },
];

export default function OpgaverPage() {
  return (
    <FeaturePageLayout
      bgTone="#f6f5f1"
      badge="Opgaver"
      badgeIcon={CheckSquare}
      title="Fordel"
      titleHighlight="hverdagens opgaver"
      subtitle="Fordel og følg op på familiens opgaver. Se hvem der gør hvad og hvornår — uden diskussion."
      color="#1a1a1a"
      features={features}
      details={details}
      ctaTitle="Få styr på opgaverne"
      ctaSubtitle="Opret din første opgaveliste på få sekunder. Helt gratis."
      ctaButtonLabel="Prøv gratis"
      ctaButtonHref="#funktioner"
      heroVisual={<HeroKanban />}
    />
  );
}
