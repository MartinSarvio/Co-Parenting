import {
  Globe,
  Monitor,
  CalendarRange,
  GripVertical,
  Printer,
  Users,
  BarChart3,
  Shield,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: Monitor, title: 'Dashboard-overblik', desc: 'Se samvær, opgaver, udgifter og beskeder i ét samlet dashboard. Få det fulde billede af familiens hverdag — uden at skifte mellem apps.', color: '#1a1a1a' },
  { icon: CalendarRange, title: 'Full-screen kalender', desc: 'Stor kalendervisning med uger, måneder og årsvisning. Perfekt til langsigtet planlægning af ferier, samvær og begivenheder.', color: '#1a1a1a' },
  { icon: GripVertical, title: 'Drag & drop', desc: 'Flyt opgaver, begivenheder og samværsdage med drag & drop. Omlæg planer intuitivt og hurtigt direkte i browseren.', color: '#1a1a1a' },
  { icon: Printer, title: 'Print & eksporter', desc: 'Udskriv samværsplanen til papir, eller eksporter til PDF. Perfekt til køleskabet, skolen eller sagsbehandlere.', color: '#1a1a1a' },
  { icon: Users, title: 'Multi-bruger adgang', desc: 'Log ind fra enhver browser på enhver enhed. Del adgang med nye partnere, bedsteforældre eller professionelle rådgivere.', color: '#1a1a1a' },
  { icon: BarChart3, title: 'Detaljerede rapporter', desc: 'Se statistik over udgiftsfordeling, samværsdage og opgaver i overskuelige grafer. Dokumentér fordelingen over tid.', color: '#1a1a1a' },
];

const details = [
  {
    badge: 'Dashboard',
    title: 'Alt samlet i ét overblik',
    desc: 'Web-appen giver dig det fulde overblik over familiens hverdag på den store skærm. Se samvær, opgaver, udgifter og beskeder — alt sammen i ét vindue.',
    paragraphs: [
      'Dashboardet viser de vigtigste informationer først: dagens og ugens samvær, aktive opgaver, seneste beskeder og den aktuelle udgiftsbalance. Alt er designet til at give dig overblik med et enkelt blik.',
      'Synkroniserer automatisk med mobil-appen, så ændringer du laver på computeren øjeblikkeligt vises på telefonen — og omvendt.',
    ],
    bullets: [
      'Hurtig adgang fra enhver browser — ingen installation',
      'Automatisk synkronisering med mobil-appen',
      'Personaliseret dashboard med de vigtigste informationer',
      'Responsivt design der tilpasser sig skærmstørrelsen',
    ],
    color: '#1a1a1a',
    icon: Monitor,
  },
  {
    badge: 'Planlægning',
    title: 'Planlæg effektivt med mere plads',
    desc: 'Den store skærm giver dig ekstra plads til at planlægge samvær, organisere opgaver og analysere udgifter. Drag & drop gør det nemt at omlægge planer.',
    paragraphs: [
      'Kalendervisningen viser hele måneden med farvekodede samværsdage, begivenheder og opgaver. Klik på en dag for at se detaljer eller tilføje nye elementer.',
      'Udskriv samværsplanen direkte fra browseren — perfekt til at hænge på køleskabet, sende til skolen eller dele med sagsbehandlere.',
    ],
    bullets: [
      'Kalender med dag-, uge-, måneds- og årsvisning',
      'Drag & drop til opgaver og begivenheder',
      'Eksportér og udskriv planer og rapporter',
      'Keyboard-genveje til hurtig navigation',
    ],
    color: '#1a1a1a',
    icon: CalendarRange,
    reversed: true,
  },
  {
    badge: 'Sikkerhed',
    title: 'Sikker adgang fra enhver enhed',
    desc: 'Log ind sikkert fra enhver browser. Dine data er krypteret og opbevaret i EU. Web-appen kræver ingen installation og efterlader ingen data på den enhed du bruger.',
    paragraphs: [
      'Perfekt til situationer hvor du bruger en delt computer eller en kollegas laptop. Log ind, se hvad du skal, og log ud igen. Ingen data gemmes lokalt.',
    ],
    bullets: [
      'Krypteret forbindelse (HTTPS)',
      'Ingen lokal datalagring',
      'Kompatibel med Chrome, Safari, Firefox og Edge',
      'Fungerer på Windows, Mac, Linux og Chromebook',
    ],
    color: '#1a1a1a',
    icon: Shield,
  },
];

const comparison = {
  title: 'Desktop vs. mobil — brug begge',
  subtitle: 'Web-appen og mobil-appen supplerer hinanden. Brug den der passer til situationen.',
  rows: [
    { label: 'Overblik', without: 'Lille skærm, begrænset visning', with: 'Fuld kalender og dashboard' },
    { label: 'Planlægning', without: 'Scroll og tryk', with: 'Drag & drop og keyboard-genveje' },
    { label: 'Udskrift', without: 'Screenshot', with: 'PDF-eksport og direkte print' },
    { label: 'Rapporter', without: 'Simpel visning', with: 'Detaljerede grafer og statistik' },
    { label: 'Tilgængelighed', without: 'Kræver app-installation', with: 'Åbn i enhver browser' },
  ],
};

const faq = {
  title: 'Ofte stillede spørgsmål',
  items: [
    { q: 'Kræver web-appen installation?', a: 'Nej. Åbn Huska i din browser og log ind. Det virker på alle moderne browsere: Chrome, Safari, Firefox og Edge.' },
    { q: 'Synkroniserer web-appen med mobil-appen?', a: 'Ja. Alle ændringer synkroniseres øjeblikkeligt mellem web og mobil. Du kan skifte frit mellem enhederne.' },
    { q: 'Kan jeg bruge web-appen på en tablet?', a: 'Ja. Web-appen er responsiv og tilpasser sig alle skærmstørrelser — fra telefon til stor desktop-skærm.' },
    { q: 'Er web-appen også gratis?', a: 'Ja. Web-appen er inkluderet gratis for alle Huska-brugere. Alle funktioner er tilgængelige.' },
  ],
};

export default function WebAppPage() {
  return (
    <FeaturePageLayout
      badge="Web App"
      badgeIcon={Globe}
      title="Huska"
      titleHighlight="i browseren"
      subtitle="Fuld adgang til alle funktioner direkte i din browser. Perfekt til planlægning, overblik og udskrift på den store skærm."
      subtitleExtra="Ingen installation nødvendig. Virker i alle moderne browsere."
      color="#1a1a1a"
      features={features}
      featuresTitle="Alt du kender fra appen — og mere til"
      featuresSubtitle="Web-appen giver dig de samme funktioner som mobil-appen, plus ekstra værktøjer der udnytter den store skærm."
      details={details}
      comparison={comparison}
      faq={faq}
      ctaTitle="Prøv Huska i din browser"
      ctaSubtitle="Åbn Huska i enhver browser og få det fulde overblik over familiens hverdag. Gratis."
      ctaButtonLabel="Åbn web-appen"
      ctaButtonHref="#login"
    />
  );
}
