import {
  Globe,
  Monitor,
  CalendarRange,
  GripVertical,
  Printer,
  Users,
  BarChart3,
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

const details = [
  {
    title: 'Alt samlet i ét dashboard',
    highlightText: 'ét dashboard',
    desc: 'Web-appen giver dig det fulde overblik over familiens hverdag. Se samvær, opgaver, udgifter og beskeder — alt sammen på den store skærm.',
    bullets: ['Hurtig adgang fra enhver browser', 'Ingen installation nødvendig', 'Synkroniserer med mobil-appen'],
    color: '#1a1a1a',
    icon: Monitor,
  },
  {
    title: 'Planlæg effektivt på den store skærm',
    highlightText: 'den store skærm',
    desc: 'Udnyt den ekstra plads til at planlægge samvær, organisere opgaver og holde styr på udgifter. Drag & drop gør det nemt og hurtigt.',
    bullets: ['Kalender med uger og måneder', 'Drag & drop til opgaver og begivenheder', 'Udskriv planer og rapporter'],
    color: '#1a1a1a',
    icon: CalendarRange,
    reversed: true,
  },
];

export default function WebAppPage() {
  return (
    <FeaturePageLayout
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
      heroVisual={
        <div className="w-[340px] h-[220px] rounded-xl border border-[#d4d3cd] bg-white shadow-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#f9f8f5] border-b border-[#e8e6df]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#d4d3cd]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#d4d3cd]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#d4d3cd]" />
            <div className="flex-1 mx-8 h-5 rounded bg-[#e8e6df]/60 flex items-center justify-center text-[9px] text-[#9a978f]">huska.dk</div>
          </div>
          <div className="p-4 grid grid-cols-3 gap-2">
            {['Samvær','Opgaver','Kalender','Udgifter','Beskeder','Mad'].map((label) => (
              <div key={label} className="p-2 rounded-lg bg-[#f9f8f5] border border-[#e8e6df]/60 text-center">
                <div className="w-6 h-6 rounded bg-[#e8e6df] mx-auto mb-1" />
                <p className="text-[9px] font-medium text-[#5f5d56]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
