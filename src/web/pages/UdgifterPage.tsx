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
  { icon: Split, title: 'Retfærdig deling', desc: 'Del udgifter 50/50 eller efter aftale. Automatisk beregning af hvem der skylder hvad — ingen diskussion nødvendig.', color: '#1a1a1a' },
  { icon: Receipt, title: 'Kvitteringer', desc: 'Tag foto af kvitteringer og vedhæft til udgiften. Alt dokumenteret og gennemsigtigt for begge parter.', color: '#1a1a1a' },
  { icon: PiggyBank, title: 'Budgetter', desc: 'Sæt budgetter for kategorier som tøj, fritid, sundhed og skole. Få varsler når et budget nærmer sig grænsen.', color: '#1a1a1a' },
  { icon: BarChart3, title: 'Balance-oversigt', desc: 'Se den aktuelle balance mellem forældre i realtid. Hvem har betalt mest denne måned? Og over hele året?', color: '#1a1a1a' },
  { icon: Camera, title: 'Foto-dokumentation', desc: 'Vedhæft billeder til udgifter: kvitteringer, fakturaer og anden dokumentation. Alt samlet og let at finde.', color: '#1a1a1a' },
  { icon: Wallet, title: 'Kategorier', desc: 'Organisér udgifter i kategorier: mad, tøj, fritid, sundhed, skole, bolig og mere. Filter og søg efter behov.', color: '#1a1a1a' },
];

const details = [
  {
    badge: 'Udgiftsdeling',
    title: 'Del udgifter retfærdigt og transparent',
    desc: 'Hold styr på alle fælles udgifter. Se hvem der har betalt hvad, og hvad den aktuelle balance er. Ingen diskussion — tallene taler for sig selv.',
    paragraphs: [
      'Økonomi er en af de hyppigste konfliktkilde for skilte forældre. Hvem betaler for sko? Hvem dækker fritidsaktiviteter? Med Huska er alt transparent.',
      'Når en forælder betaler en udgift, registrerer de den i appen med beløb, kategori og eventuelt foto af kvitteringen. Huska beregner automatisk den aktuelle balance og viser hvem der skylder hvad.',
      'Ved månedens udgang kan I se en komplet opgørelse: hvem har betalt hvad, i hvilke kategorier, og hvad den samlede balance er.',
    ],
    bullets: [
      'Automatisk 50/50 eller tilpasset procentfordeling',
      'Realtids balance-oversigt mellem forældre',
      'Komplet månedlig opgørelse med alle detaljer',
      'Foto-dokumentation af kvitteringer',
    ],
    color: '#1a1a1a',
    icon: Wallet,
    visual: (
      <div className="max-w-[280px] space-y-3">
        <div className="p-5 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc]">
          <p className="text-[11px] font-bold text-[#78766d] uppercase tracking-wider mb-2">Balance — marts 2026</p>
          <p className="text-3xl font-[800] text-[#1a1a1a]">Kr. 245</p>
          <p className="text-[12px] text-[#78766d] mt-1">Medforælder skylder dig Kr. 245</p>
        </div>
        <div className="p-4 rounded-xl bg-[#fafaf9] border border-[#e5e3dc]">
          <p className="text-[11px] font-bold text-[#78766d] uppercase tracking-wider mb-2">Seneste udgifter</p>
          {[
            { item: 'Fodboldsko', amount: 'Kr. 450', who: 'Dig', cat: 'Fritid' },
            { item: 'Tandlæge', amount: 'Kr. 380', who: 'Medforælder', cat: 'Sundhed' },
            { item: 'SFO marts', amount: 'Kr. 1.200', who: 'Dig', cat: 'Skole' },
            { item: 'Vinterjakke', amount: 'Kr. 599', who: 'Medforælder', cat: 'Tøj' },
          ].map((e, i) => (
            <div key={i} className={`flex items-center justify-between py-2.5 ${i < 3 ? 'border-b border-[#e5e3dc]/50' : ''}`}>
              <div>
                <p className="text-[13px] font-medium text-[#1a1a1a]">{e.item}</p>
                <p className="text-[10px] text-[#78766d]">{e.who} · {e.cat}</p>
              </div>
              <p className="text-[13px] font-bold text-[#1a1a1a]">{e.amount}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    badge: 'Budgetter',
    title: 'Budgetter der holder forbruget i skak',
    desc: 'Sæt budgetter for forskellige kategorier og se hvordan I ligger an. Få varsel når et budget nærmer sig grænsen — før det er for sent.',
    paragraphs: [
      'Definér månedlige budgetter for tøj, fritid, sundhed, skole og andre kategorier. Huska tracker automatisk forbrug og viser fremgang med visuelle progress-bars.',
      'Begge forældre kan se budgetternes status, så I er enige om hvad der er plads til. Perfekt til at undgå overraskelser og holde økonomien på sporet.',
    ],
    bullets: [
      'Kategoriserede månedlige budgetter',
      'Visuelle progress-bars med realtids-opdatering',
      'Varsler når budget nærmer sig grænsen',
      'Historisk overblik over forbrug pr. kategori',
    ],
    color: '#1a1a1a',
    icon: PiggyBank,
    reversed: true,
  },
];

const comparison = {
  title: 'Udgifter med Huska vs. uden',
  subtitle: 'Se forskellen på at dele udgifter med og uden et dedikeret værktøj.',
  rows: [
    { label: 'Registrering', without: 'Mobilepay-beskeder, regneark', with: 'Ét tryk i appen med kvittering' },
    { label: 'Balance', without: 'Manuel beregning', with: 'Automatisk realtids-balance' },
    { label: 'Dokumentation', without: 'Ingen — eller spredt', with: 'Foto af kvitteringer samlet' },
    { label: 'Budgetter', without: 'Ingen fælles overblik', with: 'Delte budgetter med varsler' },
    { label: 'Opgørelse', without: 'Diskussion ved årets udgang', with: 'Løbende månedlig opgørelse' },
  ],
};

const faq = {
  title: 'Ofte stillede spørgsmål om udgifter',
  items: [
    { q: 'Hvordan fungerer udgiftsdelingen?', a: 'Når en forælder betaler en fælles udgift, registrerer de den i appen. Huska beregner automatisk den aktuelle balance baseret på den aftalte fordelingsprocent (typisk 50/50).' },
    { q: 'Kan vi dele udgifter anderledes end 50/50?', a: 'Ja. I kan sætte en tilpasset fordelingsprocent — for eksempel 60/40 eller 70/30 — baseret på jeres aftale.' },
    { q: 'Hvad tæller som en fælles udgift?', a: 'I bestemmer selv hvad der registreres som fælles udgift. Typisk inkluderer det tøj, fritidsaktiviteter, sundhed, skole og lignende barnerelaterede udgifter.' },
    { q: 'Kan jeg eksportere en udgiftsoversigt?', a: 'Ja. Du kan eksportere en komplet månedlig eller årlig oversigt til PDF med alle udgifter, kategorier, kvitteringer og den samlede balance.' },
  ],
};

export default function UdgifterPage() {
  return (
    <FeaturePageLayout
      badge="Udgifter"
      badgeIcon={Wallet}
      title="Del udgifter"
      titleHighlight="retfærdigt og transparent"
      subtitle="Hold styr på fælles udgifter, budgetter og kvitteringer. Automatisk deling, realtids-balance og komplet dokumentation."
      subtitleExtra="Ingen regneark. Ingen diskussioner. Tallene taler for sig selv."
      color="#1a1a1a"
      features={features}
      featuresTitle="Komplet udgiftsstyring for skilte forældre"
      featuresSubtitle="Fra registrering til balance-oversigt og budgetter — alt designet til at reducere konflikter om økonomi."
      details={details}
      comparison={comparison}
      faq={faq}
      ctaTitle="Få styr på udgifterne"
      ctaSubtitle="Start med at dele udgifter i dag. Transparent, retfærdigt og helt gratis."
      ctaButtonLabel="Kom i gang — gratis"
      ctaButtonHref="#funktioner"
    />
  );
}
