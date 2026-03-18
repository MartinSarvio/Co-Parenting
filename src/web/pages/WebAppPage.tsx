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
  { icon: Monitor, title: 'Dashboard-overblik', desc: 'Se alt på ét sted: samvær, opgaver, udgifter og beskeder i et samlet dashboard.', color: '#f58a2d' },
  { icon: CalendarRange, title: 'Full-screen kalender', desc: 'Stor kalendervisning med uger og måneder. Perfekt til planlægning på den store skærm.', color: '#3b82f6' },
  { icon: GripVertical, title: 'Drag & drop', desc: 'Flyt opgaver, begivenheder og samværsdage med drag & drop. Hurtigt og intuitivt.', color: '#8b5cf6' },
  { icon: Printer, title: 'Print samværsplan', desc: 'Udskriv samværsplanen til papir — perfekt til at hænge på køleskabet eller dele med skolen.', color: '#10b981' },
  { icon: Users, title: 'Multi-bruger adgang', desc: 'Log ind fra enhver browser. Del adgang med nye partnere, bedsteforældre eller rådgivere.', color: '#f43f5e' },
  { icon: BarChart3, title: 'Detaljerede rapporter', desc: 'Se statistik over udgifter, samvær og opgavefordeling i overskuelige grafer.', color: '#06b6d4' },
];

const details = [
  {
    title: 'Alt samlet i ét dashboard',
    highlightText: 'ét dashboard',
    desc: 'Web-appen giver dig det fulde overblik over familiens hverdag. Se samvær, opgaver, udgifter og beskeder — alt sammen på den store skærm.',
    bullets: ['Hurtig adgang fra enhver browser', 'Ingen installation nødvendig', 'Synkroniserer med mobil-appen'],
    color: '#f58a2d',
    icon: Monitor,
  },
  {
    title: 'Planlæg effektivt på den store skærm',
    highlightText: 'den store skærm',
    desc: 'Udnyt den ekstra plads til at planlægge samvær, organisere opgaver og holde styr på udgifter. Drag & drop gør det nemt og hurtigt.',
    bullets: ['Kalender med uger og måneder', 'Drag & drop til opgaver og begivenheder', 'Udskriv planer og rapporter'],
    color: '#3b82f6',
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
      color="#f58a2d"
      features={features}
      details={details}
      ctaTitle="Prøv Huska i browseren"
      ctaSubtitle="Gratis adgang fra enhver browser. Ingen installation nødvendig."
      ctaButtonLabel="Kom i gang"
      ctaButtonHref="#funktioner"
    />
  );
}
