import {
  Globe,
  Monitor,
  CalendarRange,
  GripVertical,
  Printer,
  Users,
  BarChart3,
  Shield,
  Lock,
  CheckCircle,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

/* ── Hero visual: browser window mockup ── */
const heroVisual = (
  <div className="w-full max-w-[340px]">
    <div className="rounded-xl border border-[#e5e3dc] bg-white shadow-lg overflow-hidden">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#fafaf9] border-b border-[#e5e3dc]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#e5e3dc]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#e5e3dc]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#e5e3dc]" />
        </div>
        <div className="flex-1 mx-2 px-3 py-1 rounded-md bg-white border border-[#e5e3dc] text-[10px] text-[#78766d]">app.huska.dk</div>
      </div>
      {/* Dashboard content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-[#1a1a1a]">Dashboard</p>
          <div className="px-2 py-0.5 rounded bg-[#1a1a1a]/5 text-[10px] text-[#78766d]">Marts 2026</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ label: 'Samvær', val: '7/7' }, { label: 'Opgaver', val: '3 aktive' }, { label: 'Udgifter', val: 'Kr. 450' }].map(s => (
            <div key={s.label} className="p-2 rounded-lg bg-[#fafaf9] border border-[#e5e3dc] text-center">
              <p className="text-[10px] text-[#78766d]">{s.label}</p>
              <p className="text-[12px] font-bold text-[#1a1a1a]">{s.val}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {['Forældremøde i morgen kl. 18', 'Magnus til svømning onsdag', 'Udgift: Vinterjakke kr. 450'].map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fafaf9] border border-[#e5e3dc]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]" />
              <span className="text-[11px] text-[#4a4a4a]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ── Detail 1 visual: sidebar + content dashboard widget ── */
const dashboardVisual = (
  <div className="max-w-[280px]">
    <div className="rounded-xl border border-[#e5e3dc] bg-white shadow-md overflow-hidden">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-14 bg-[#fafaf9] border-r border-[#e5e3dc] p-2 space-y-3 flex flex-col items-center pt-3">
          <Monitor className="w-4 h-4 text-[#1a1a1a]" />
          <CalendarRange className="w-4 h-4 text-[#78766d]" />
          <Users className="w-4 h-4 text-[#78766d]" />
          <BarChart3 className="w-4 h-4 text-[#78766d]" />
        </div>
        {/* Content area */}
        <div className="flex-1 p-3 space-y-2">
          <p className="text-[11px] font-bold text-[#1a1a1a]">Overblik</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[{ label: 'Samvær', val: '7/7' }, { label: 'Opgaver', val: '3' }, { label: 'Beskeder', val: '2 nye' }, { label: 'Balance', val: 'Kr. 0' }].map(s => (
              <div key={s.label} className="p-1.5 rounded-md bg-[#fafaf9] border border-[#e5e3dc] text-center">
                <p className="text-[9px] text-[#78766d]">{s.label}</p>
                <p className="text-[11px] font-bold text-[#1a1a1a]">{s.val}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {['Hent Magnus kl. 15', 'Betaling modtaget'].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-[#fafaf9] border border-[#e5e3dc]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]" />
                <span className="text-[10px] text-[#4a4a4a]">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ── Detail 2 visual: calendar week view ── */
const calendarVisual = (
  <div className="max-w-[280px]">
    <div className="rounded-xl border border-[#e5e3dc] bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#fafaf9] border-b border-[#e5e3dc]">
        <p className="text-[11px] font-bold text-[#1a1a1a]">Uge 12 — Marts 2026</p>
        <CalendarRange className="w-3.5 h-3.5 text-[#78766d]" />
      </div>
      {/* Week grid */}
      <div className="p-2.5 space-y-1.5">
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map(d => (
            <p key={d} className="text-[9px] font-medium text-[#78766d]">{d}</p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {[
            { day: '16', who: 'Mor' }, { day: '17', who: 'Mor' }, { day: '18', who: 'Mor' }, { day: '19', who: 'Skifte' },
            { day: '20', who: 'Far' }, { day: '21', who: 'Far' }, { day: '22', who: 'Far' },
          ].map(d => (
            <div key={d.day} className={`p-1 rounded-md border text-center ${d.who === 'Mor' ? 'bg-[#fafaf9] border-[#e5e3dc]' : d.who === 'Far' ? 'bg-[#1a1a1a]/5 border-[#1a1a1a]/10' : 'bg-white border-dashed border-[#e5e3dc]'}`}>
              <p className="text-[10px] font-bold text-[#1a1a1a]">{d.day}</p>
              <p className="text-[8px] text-[#78766d]">{d.who}</p>
            </div>
          ))}
        </div>
        {/* Events */}
        <div className="space-y-1 pt-1">
          {[{ t: 'Svømning', day: 'Ons' }, { t: 'Forældremøde', day: 'Tor' }].map((e, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-md bg-[#fafaf9] border border-[#e5e3dc]">
              <span className="text-[10px] text-[#4a4a4a]">{e.t}</span>
              <span className="text-[9px] text-[#78766d]">{e.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ── Detail 3 visual: security/lock ── */
const securityVisual = (
  <div className="max-w-[280px]">
    <div className="rounded-xl border border-[#e5e3dc] bg-white shadow-md overflow-hidden p-5 flex flex-col items-center gap-4">
      {/* Shield icon */}
      <div className="w-16 h-16 rounded-full bg-[#fafaf9] border border-[#e5e3dc] flex items-center justify-center">
        <Shield className="w-8 h-8 text-[#1a1a1a]" />
      </div>
      <p className="text-[12px] font-bold text-[#1a1a1a]">Ende-til-ende krypteret</p>
      {/* Security indicators */}
      <div className="w-full space-y-2">
        {[
          { icon: Lock, label: 'HTTPS-krypteret forbindelse' },
          { icon: CheckCircle, label: 'Data opbevaret i EU' },
          { icon: CheckCircle, label: 'Ingen lokal datalagring' },
          { icon: Shield, label: 'GDPR-kompatibel' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#fafaf9] border border-[#e5e3dc]">
            <item.icon className="w-3.5 h-3.5 text-[#1a1a1a] flex-shrink-0" />
            <span className="text-[10px] text-[#4a4a4a]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

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
    visual: dashboardVisual,
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
    visual: calendarVisual,
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
    visual: securityVisual,
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
      heroVisual={heroVisual}
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
