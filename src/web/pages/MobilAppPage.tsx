import {
  Smartphone,
  Bell,
  WifiOff,
  Fingerprint,
  LayoutGrid,
  Moon,
  Zap,
  Calendar,
  MessageCircle,
  Wallet,
  Shield,
  Download,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: Bell, title: 'Push-notifikationer', desc: 'Få besked med det samme når der sker noget nyt — nye beskeder, opgaveændringer eller skift i samværsplanen. Du misser aldrig noget vigtigt.', color: '#1a1a1a' },
  { icon: WifiOff, title: 'Offline-adgang', desc: 'Se samværsplan, opgaver og beskeder selv uden internet. Alt synkroniseres automatisk i baggrunden når du er online igen.', color: '#1a1a1a' },
  { icon: Fingerprint, title: 'Face ID & Touch ID', desc: 'Log ind med biometrisk sikkerhed. Hurtig adgang til appen uden at taste kodeord — og dine data er altid beskyttet med kryptering.', color: '#1a1a1a' },
  { icon: LayoutGrid, title: 'Hjemmeskærm-widgets', desc: 'Se dagens samvær, kommende opgaver og nye beskeder direkte på din startskærm. Ingen grund til at åbne appen for hurtigt overblik.', color: '#1a1a1a' },
  { icon: Moon, title: 'Mørk tilstand', desc: 'Behageligt for øjnene om aftenen. Skifter automatisk med din telefons systemindstillinger, eller vælg manuelt.', color: '#1a1a1a' },
  { icon: Zap, title: 'Realtids-synkronisering', desc: 'Ændringer synkroniseres øjeblikkeligt mellem alle familiemedlemmer. Når den ene forælder opdaterer noget, ser den anden det med det samme.', color: '#1a1a1a' },
];

const details = [
  {
    badge: 'Samvær på farten',
    title: 'Din samværsplan altid i lommen',
    desc: 'Se hvem der har børnene, hvornår der er skift, og hvad der er planlagt — alt sammen direkte på din telefon. Perfekt til travle hverdage hvor du har brug for hurtigt overblik.',
    paragraphs: [
      'Appen viser tydeligt dagens og ugens samvær med farvekodning for hver forælder. Du kan se fremtidige skift, ferier og helligdage i en enkel kalendervisning.',
      'Få automatiske påmindelser dagen før et skift, så du altid er forberedt. Del samværsplanen med bedsteforældre, nye partnere og andre vigtige personer i barnets liv.',
    ],
    bullets: [
      'Daglig og ugentlig visning med farvekodning',
      'Automatiske skift-påmindelser dagen før',
      'Del med bedsteforældre og nye partnere',
      'Ferie- og helligdagsplanlægning',
    ],
    color: '#1a1a1a',
    icon: Calendar,
    visual: (
      <div className="relative">
        <div className="w-[260px] h-[520px] rounded-[3rem] border-[10px] border-[#1a1a1a] bg-[#1a1a1a] overflow-hidden shadow-2xl">
          <div className="w-full h-full bg-gradient-to-b from-[#fafaf9] to-white flex flex-col p-5 pt-8">
            <p className="text-[11px] font-bold text-[#78766d] uppercase tracking-wider mb-3">Denne uge</p>
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((d, i) => (
              <div key={d} className={`flex items-center gap-3 py-2 ${i < 6 ? 'border-b border-[#e5e3dc]/50' : ''}`}>
                <span className="text-[12px] font-semibold text-[#1a1a1a] w-8">{d}</span>
                <div className={`flex-1 h-7 rounded-lg ${i < 4 ? 'bg-[#1a1a1a]/10' : 'bg-[#d4d3cd]/40'}`} />
                <span className="text-[10px] text-[#78766d]">{i < 4 ? 'Dig' : 'Medforælder'}</span>
              </div>
            ))}
            <div className="mt-auto flex gap-2 text-[10px] text-[#78766d]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#1a1a1a]/15" /> Dig</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#d4d3cd]/50" /> Medforælder</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    badge: 'Kommunikation',
    title: 'Strukturerede samtaler direkte i appen',
    desc: 'Hold al kommunikation samlet ét sted. Tråde og beskeder giver overblik og historik — perfekt til co-parenting hvor klarhed og dokumentation er vigtigere end nogensinde.',
    paragraphs: [
      'Organisér samtaler i tråde pr. emne: skole, sundhed, økonomi, aktiviteter. Hver tråd har sin egen historik, så du altid kan finde hvad der blev aftalt.',
      'Alle beskeder gemmes sikkert og kan ikke slettes. Det betyder at du altid har dokumentation — også i juridiske sammenhænge. Læsekvitteringer viser hvornår beskeden er set.',
    ],
    bullets: [
      'Tråde pr. emne — aldrig rodet kommunikation',
      'Læsekvitteringer og tidsstempler',
      'Alt gemt som dokumentation',
      'Push-notifikationer for nye beskeder',
    ],
    color: '#1a1a1a',
    icon: MessageCircle,
    reversed: true,
    visual: (
      <div className="space-y-3 max-w-[300px]">
        <div className="p-4 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc]">
          <p className="text-[11px] font-bold text-[#78766d] uppercase tracking-wider mb-3">Skole-emner</p>
          <div className="space-y-3">
            {[
              { from: 'Dig', msg: 'Forældremøde den 23. kl. 18. Kan du deltage?', time: '14:32' },
              { from: 'Medforælder', msg: 'Ja, det passer fint. Skal vi tage noget op omkring matematiklektier?', time: '14:45' },
              { from: 'Dig', msg: 'God idé. Jeg skriver det ned som punkt. Ses der!', time: '14:48' },
            ].map((m, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#1a1a1a]/10 flex items-center justify-center text-[10px] font-bold text-[#1a1a1a] shrink-0">
                  {m.from[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-semibold text-[#1a1a1a]">{m.from}</p>
                    <p className="text-[10px] text-[#78766d]">{m.time}</p>
                  </div>
                  <p className="text-[13px] text-[#4a4a4a] leading-snug">{m.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    badge: 'Udgifter',
    title: 'Hold styr på fælles udgifter direkte fra telefonen',
    desc: 'Tag et billede af kvitteringen, vælg kategori, og del udgiften. Så simpelt er det. Ingen regneark, ingen diskussioner om hvem der har betalt hvad.',
    paragraphs: [
      'Appen beregner automatisk den aktuelle balance mellem forældre. Se hvem der har betalt mest denne måned, og hvad den samlede fordeling er over tid.',
      'Kategorisér udgifter i tøj, fritid, sundhed, skole og mad. Sæt budgetter og få varsler når I nærmer jer grænsen.',
    ],
    bullets: [
      'Foto af kvitteringer direkte fra kameraet',
      'Automatisk 50/50 eller tilpasset deling',
      'Månedlig balance-oversigt',
      'Kategoriserede budgetter med varsler',
    ],
    color: '#1a1a1a',
    icon: Wallet,
    visual: (
      <div className="max-w-[280px] space-y-3">
        <div className="p-5 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc]">
          <p className="text-[11px] font-bold text-[#78766d] uppercase tracking-wider mb-2">Balance denne måned</p>
          <p className="text-3xl font-[800] text-[#1a1a1a]">Kr. 0</p>
          <p className="text-[12px] text-[#78766d] mt-1">I balance — ingen skylder noget</p>
        </div>
        {[
          { item: 'Fodboldsko til Emil', amount: 'Kr. 450', who: 'Dig' },
          { item: 'Tandlæge-kontrol', amount: 'Kr. 380', who: 'Medforælder' },
          { item: 'SFO-betaling marts', amount: 'Kr. 1.200', who: 'Dig' },
          { item: 'Vinterjakke', amount: 'Kr. 599', who: 'Medforælder' },
        ].map((e, i) => (
          <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-[#fafaf9] border border-[#e5e3dc]">
            <div>
              <p className="text-[13px] font-medium text-[#1a1a1a]">{e.item}</p>
              <p className="text-[11px] text-[#78766d]">{e.who}</p>
            </div>
            <p className="text-[14px] font-bold text-[#1a1a1a]">{e.amount}</p>
          </div>
        ))}
      </div>
    ),
  },
];

const comparison = {
  title: 'Hvorfor bruge Huska-appen?',
  subtitle: 'Sammenlign hverdagen med og uden Huska — og se forskellen.',
  rows: [
    { label: 'Samværsplan', without: 'SMS, papir, hukommelse', with: 'Digital plan med påmindelser' },
    { label: 'Kommunikation', without: 'SMS, email, telefonopkald', with: 'Strukturerede tråde med historik' },
    { label: 'Udgifter', without: 'Regneark, Mobilepay-beskeder', with: 'Automatisk deling og balance' },
    { label: 'Opgaver', without: 'Post-it, mundtlige aftaler', with: 'Delte lister med deadlines' },
    { label: 'Dokumentation', without: 'Ingen — eller spredt', with: 'Alt gemt sikkert ét sted' },
  ],
};

const steps = {
  title: 'Kom i gang på under 2 minutter',
  subtitle: 'Tre simple trin og du er klar til at koordinere med din medforælder.',
  items: [
    { number: '1', title: 'Download appen', desc: 'Hent Huska gratis fra App Store. Opret din profil med email og navn på få sekunder.' },
    { number: '2', title: 'Invitér medforælder', desc: 'Send en invitation via appen. Din medforælder modtager et link og kan oprette sin profil med det samme.' },
    { number: '3', title: 'Begynd at koordinere', desc: 'Opret jeres samværsplan, del udgifter og begynd at kommunikere struktureret. Alt er klar.' },
  ],
};

const faq = {
  title: 'Ofte stillede spørgsmål',
  items: [
    { q: 'Er Huska gratis?', a: 'Ja, Huska er helt gratis for familier. Alle basisfunktioner — samværsplan, kommunikation, udgifter og opgaver — er inkluderet uden beregning.' },
    { q: 'Kræver det at begge forældre bruger appen?', a: 'Huska virker bedst når begge forældre bruger appen, men du kan godt starte alene. Du kan invitere din medforælder når som helst, og de kan oprette sig på få sekunder.' },
    { q: 'Er mine data sikre?', a: 'Ja. Alle data er krypteret og opbevaret sikkert i EU. Vi følger GDPR og deler aldrig dine data med tredjeparter. Biometrisk login (Face ID/Touch ID) beskytter din adgang.' },
    { q: 'Kan andre end forældrene se samværsplanen?', a: 'Du bestemmer selv hvem der har adgang. Du kan dele samværsplanen med bedsteforældre, nye partnere, rådgivere eller andre vigtige personer — med begrænset adgang.' },
    { q: 'Virker appen offline?', a: 'Ja. Du kan se samværsplan, opgaver og beskeder selv uden internet. Ændringer gemmes lokalt og synkroniseres automatisk når du er online igen.' },
    { q: 'Kan jeg bruge appen som dokumentation?', a: 'Ja. Al kommunikation gemmes med tidsstempler og kan ikke slettes. Mange forældre bruger Huska som dokumentation i forbindelse med samværssager.' },
  ],
};

export default function MobilAppPage() {
  return (
    <FeaturePageLayout
      badge="Mobil app"
      badgeIcon={Smartphone}
      title="Huska"
      titleHighlight="i lommen"
      subtitle="Alt hvad du behøver til co-parenting — altid ved hånden. Push-notifikationer, offline-adgang og lynhurtig synkronisering mellem forældre."
      subtitleExtra="Tilgængelig til iPhone. Gratis for alle familier."
      color="#1a1a1a"
      features={features}
      featuresTitle="Designet til hverdagen"
      featuresSubtitle="Huska er bygget specifikt til skilte forældres hverdag — hurtig, sikker og nem at bruge."
      details={details}
      comparison={comparison}
      steps={steps}
      faq={faq}
      ctaTitle="Klar til at forenkle hverdagen?"
      ctaSubtitle="Download Huska gratis og begynd at koordinere med din medforælder i dag. Det tager under 2 minutter."
      ctaButtonLabel="Hent appen — gratis"
      ctaButtonHref="#funktioner"
      heroVisual={
        <div className="relative">
          <div className="w-[260px] h-[520px] rounded-[3rem] border-[10px] border-[#1a1a1a] bg-[#1a1a1a] overflow-hidden shadow-2xl shadow-black/20">
            <img src="/app-screenshot.png" alt="Huska app" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-4 -right-4 w-14 h-14 rounded-2xl bg-white shadow-xl border border-[#e5e3dc] flex items-center justify-center">
            <Shield size={28} className="text-[#1a1a1a]" />
          </div>
          <div className="absolute -top-4 -left-4 w-14 h-14 rounded-2xl bg-white shadow-xl border border-[#e5e3dc] flex items-center justify-center">
            <Download size={28} className="text-[#1a1a1a]" />
          </div>
        </div>
      }
    />
  );
}
