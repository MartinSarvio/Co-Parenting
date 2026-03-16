import {
  MessageCircle,
  MessageSquare,
  CheckCheck,
  History,
  FileText,
  Bell,
  Shield,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: MessageSquare, title: 'Beskedtråde', desc: 'Organisér samtaler i tråde pr. emne. Ingen rod — alt er struktureret og let at finde, også måneder efter.', color: '#1a1a1a' },
  { icon: CheckCheck, title: 'Læsekvitteringer', desc: 'Se hvornår din besked er læst. Ingen tvivl om beskeden er modtaget og set — med præcist tidsstempel.', color: '#1a1a1a' },
  { icon: History, title: 'Fuld historik', desc: 'Al kommunikation gemmes permanent. Gå tilbage og se hvad der blev aftalt — dokumentation til enhver tid, også juridisk.', color: '#1a1a1a' },
  { icon: FileText, title: 'Vedhæftede filer', desc: 'Vedhæft billeder, dokumenter og PDF-filer direkte i samtalen. Alt samlet ét sted — ingen separate emails.', color: '#1a1a1a' },
  { icon: Bell, title: 'Push-notifikationer', desc: 'Få besked med det samme når der er en ny besked. Aldrig gå glip af noget vigtigt fra din medforælder.', color: '#1a1a1a' },
  { icon: Shield, title: 'Tone-guide', desc: 'Hjælpeværktøj der foreslår en konstruktiv tone i dine beskeder. Reducér konflikter og misforståelser fra starten.', color: '#1a1a1a' },
];

const details = [
  {
    badge: 'Strukturerede samtaler',
    title: 'Dialog uden misforståelser',
    desc: 'Hold al kommunikation samlet ét sted. Tråde og beskeder giver overblik og historik — perfekt til co-parenting hvor klarhed er alt.',
    paragraphs: [
      'Mange konflikter mellem skilte forældre starter med misforståelser i SMS eller email. Beskeder tages ud af kontekst, aftaler glemmes, og der er ingen dokumentation.',
      'Med Huska organiseres samtaler i tråde pr. emne: skole, sundhed, økonomi, ferie, aktiviteter. Hver tråd har sin egen historik, og alle beskeder er tidsstemplede og uforanderlige.',
      'Resultatet er mindre konflikt, bedre dokumentation, og et sundere samarbejde om børnenes hverdag.',
    ],
    bullets: [
      'Tråde pr. emne — skole, sundhed, økonomi, ferie',
      'Alt gemt med tidsstempler og læsekvitteringer',
      'Push-notifikationer for nye beskeder',
      'Eksporter samtalehistorik til PDF',
    ],
    color: '#1a1a1a',
    icon: MessageCircle,
    visual: (
      <div className="space-y-3 max-w-[300px]">
        <div className="p-4 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
            <p className="text-[12px] font-bold text-[#1a1a1a]">Skole-emner</p>
            <p className="text-[10px] text-[#78766d] ml-auto">3 beskeder</p>
          </div>
          <div className="space-y-3">
            {[
              { from: 'Dig', msg: 'Forældremøde den 23. kl. 18. Kan du deltage?', time: '14:32', read: true },
              { from: 'Medforælder', msg: 'Ja, det passer fint. Skal vi tage noget op omkring matematiklektier?', time: '14:45', read: true },
              { from: 'Dig', msg: 'God idé. Jeg skriver det ned som punkt.', time: '14:48', read: false },
            ].map((m, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#1a1a1a]/10 flex items-center justify-center text-[10px] font-bold text-[#1a1a1a] shrink-0">
                  {m.from[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-semibold text-[#1a1a1a]">{m.from}</p>
                    <p className="text-[10px] text-[#78766d]">{m.time}</p>
                    {m.read && <CheckCheck size={12} className="text-[#1a1a1a]/40" />}
                  </div>
                  <p className="text-[13px] text-[#4a4a4a] leading-snug">{m.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#fafaf9] border border-[#e5e3dc] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#d4d3cd]" />
          <p className="text-[12px] font-semibold text-[#1a1a1a]">Økonomi</p>
          <p className="text-[10px] text-[#78766d] ml-auto">1 ny besked</p>
        </div>
        <div className="p-3 rounded-xl bg-[#fafaf9] border border-[#e5e3dc] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#d4d3cd]" />
          <p className="text-[12px] font-semibold text-[#1a1a1a]">Ferie</p>
          <p className="text-[10px] text-[#78766d] ml-auto">5 beskeder</p>
        </div>
      </div>
    ),
  },
  {
    badge: 'Dokumentation',
    title: 'Dokumentation du kan stole på',
    desc: 'Alle beskeder gemmes sikkert og kan ikke slettes eller redigeres. Perfekt som dokumentation ved uenigheder eller i juridiske sammenhænge.',
    paragraphs: [
      'I modsætning til SMS og email kan beskeder i Huska ikke slettes, redigeres eller manipuleres. Hver besked har et præcist tidsstempel og læsekvittering.',
      'Mange forældre bruger Huskas samtalehistorik som dokumentation i samværssager. Du kan eksportere hele samtalehistorikken til PDF med alle tidsstempler og læsekvitteringer.',
    ],
    bullets: [
      'Beskeder kan ikke slettes eller redigeres',
      'Præcise tidsstempler på alle beskeder',
      'Læsekvitteringer viser hvornår beskeden er set',
      'Eksporter samtalehistorik til PDF',
    ],
    color: '#1a1a1a',
    icon: History,
    reversed: true,
    visual: (
      <div className="max-w-[280px]">
        <div className="p-4 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc]">
          <p className="text-[13px] font-bold text-[#1a1a1a] mb-3">Beskedhistorik</p>
          <div className="space-y-2">
            {[
              { date: '14. mar 15:32', sender: 'Anna', msg: 'Kan vi bytte weekend i uge 14?', read: true },
              { date: '14. mar 16:01', sender: 'Thomas', msg: 'Ja, det passer fint.', read: true },
              { date: '14. mar 16:03', sender: 'Anna', msg: 'Super! Jeg opdaterer planen.', read: true },
              { date: '14. mar 16:05', sender: 'System', msg: 'Samværsplan opdateret for uge 14', read: true },
            ].map((m, i) => (
              <div key={i} className="px-3 py-2 rounded-lg bg-white border border-[#e5e3dc]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-[#1a1a1a]">{m.sender}</span>
                  <span className="text-[9px] text-[#78766d]">{m.date}</span>
                </div>
                <p className="text-[11px] text-[#4a4a4a]">{m.msg}</p>
                {m.read && <p className="text-[9px] text-[#78766d] mt-0.5">✓✓ Læst</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    badge: 'Tone-guide',
    title: 'Bedre tone — færre konflikter',
    desc: 'Huskas tone-guide analyserer dine beskeder inden de sendes og foreslår en mere konstruktiv formulering hvis tonen er for skarp.',
    paragraphs: [
      'Skilsmisse er følelsesmæssigt hårdt, og det er nemt at skrive noget i affekt som man fortryder bagefter. Tone-guiden er et frivilligt hjælpeværktøj der giver dig et øjeblik til at genoverveje.',
      'Funktionen er helt valgfri og kan slås til og fra. Den erstatter ikke din besked — den foreslår blot en alternativ formulering du kan vælge at bruge.',
    ],
    bullets: [
      'Frivilligt hjælpeværktøj — kan slås fra',
      'Foreslår konstruktiv formulering',
      'Reducerer konflikter og misforståelser',
      'Hjælper med at holde fokus på børnenes bedste',
    ],
    color: '#1a1a1a',
    icon: Shield,
    visual: (
      <div className="max-w-[280px]">
        <div className="p-4 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc]">
          <p className="text-[13px] font-bold text-[#1a1a1a] mb-3">Kommunikationsguide</p>
          <div className="space-y-2.5">
            {[
              { bad: '"Du glemmer altid..."', good: '"Kan vi aftale at..."', tip: 'Brug jeg-sprog' },
              { bad: '"Det er din skyld"', good: '"Jeg oplever at..."', tip: 'Undgå beskyldninger' },
              { bad: '"Du skal bare..."', good: '"Hvad tænker du om..."', tip: 'Stil spørgsmål' },
            ].map((ex, i) => (
              <div key={i} className="px-3 py-2.5 rounded-lg bg-white border border-[#e5e3dc]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1a1a1a]/5 font-semibold text-[#78766d]">{ex.tip}</span>
                </div>
                <p className="text-[10px] text-[#78766d] line-through">{ex.bad}</p>
                <p className="text-[11px] text-[#1a1a1a] font-medium mt-0.5">{ex.good}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

const comparison = {
  title: 'Kommunikation med Huska vs. uden',
  subtitle: 'Se forskellen på at kommunikere med og uden et dedikeret co-parenting værktøj.',
  rows: [
    { label: 'Struktur', without: 'Alt blandet i SMS/email', with: 'Tråde pr. emne' },
    { label: 'Dokumentation', without: 'SMS kan slettes', with: 'Uforanderlig historik' },
    { label: 'Læsekvitteringer', without: 'Ingen garanti', with: 'Præcist tidsstempel' },
    { label: 'Filer og billeder', without: 'Separate kanaler', with: 'Vedhæftet i samtalen' },
    { label: 'Tone', without: 'Ingen hjælp', with: 'AI-assisteret tone-guide' },
    { label: 'Eksport', without: 'Screenshot', with: 'PDF med alle detaljer' },
  ],
};

const faq = {
  title: 'Ofte stillede spørgsmål om kommunikation',
  items: [
    { q: 'Kan beskeder slettes?', a: 'Nej. Alle beskeder gemmes permanent og kan ikke slettes eller redigeres. Dette sikrer at samtalehistorikken altid er komplet og kan bruges som dokumentation.' },
    { q: 'Kan jeg eksportere samtaler?', a: 'Ja. Du kan eksportere hele samtalehistorikken — eller individuelle tråde — til PDF med alle tidsstempler og læsekvitteringer.' },
    { q: 'Hvad er tone-guiden?', a: 'Tone-guiden er et frivilligt AI-værktøj der analyserer dine beskeder og foreslår en mere konstruktiv formulering hvis tonen er for skarp. Du kan slå det til og fra som du vil.' },
    { q: 'Kan jeg vedhæfte filer?', a: 'Ja. Du kan vedhæfte billeder, dokumenter og PDF-filer direkte i samtalen. Alt er samlet ét sted.' },
    { q: 'Hvem kan se mine beskeder?', a: 'Kun du og din medforælder kan se jeres beskeder. Ingen andre — heller ikke Huska — har adgang til indholdet af jeres samtaler.' },
  ],
};

export default function KommunikationPage() {
  return (
    <FeaturePageLayout
      badge="Kommunikation"
      badgeIcon={MessageCircle}
      title="Struktureret"
      titleHighlight="kommunikation"
      subtitle="Struktureret kommunikation mellem forældre med tråde, læsekvitteringer og permanent historik. Alt samlet ét sted — og alt gemt som dokumentation."
      subtitleExtra="Reducér konflikter med tone-guide og organiserede samtaler."
      color="#1a1a1a"
      features={features}
      featuresTitle="Kommunikationsværktøjer bygget til co-parenting"
      featuresSubtitle="Ikke bare en besked-app — men et værktøj designet til at reducere konflikter og skabe klarhed."
      details={details}
      comparison={comparison}
      faq={faq}
      ctaTitle="Kommunikér bedre fra i dag"
      ctaSubtitle="Start med strukturerede samtaler og permanent dokumentation. Helt gratis."
      ctaButtonLabel="Kom i gang — gratis"
      ctaButtonHref="#funktioner"
    />
  );
}
