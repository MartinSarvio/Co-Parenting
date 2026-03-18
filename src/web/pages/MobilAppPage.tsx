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
  Download,
  Shield,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: Bell, title: 'Push-notifikationer', desc: 'Få besked med det samme når der sker noget nyt — nye beskeder, opgaver eller ændringer i samværsplanen.', color: '#1a1a1a' },
  { icon: WifiOff, title: 'Offline-adgang', desc: 'Se samværsplan, opgaver og beskeder selv uden internet. Data synkroniseres automatisk når du er online igen.', color: '#1a1a1a' },
  { icon: Fingerprint, title: 'Face ID & Touch ID', desc: 'Hurtig og sikker adgang med biometrisk login. Dine data er altid beskyttet.', color: '#1a1a1a' },
  { icon: LayoutGrid, title: 'Widgets', desc: 'Se dagens samvær og kommende opgaver direkte på din startskærm uden at åbne appen.', color: '#1a1a1a' },
  { icon: Moon, title: 'Mørk tilstand', desc: 'Behageligt for øjnene om aftenen. Skifter automatisk med din telefons indstillinger.', color: '#1a1a1a' },
  { icon: Zap, title: 'Hurtig synkronisering', desc: 'Ændringer synkroniseres i realtid mellem alle familiemedlemmer. Altid opdateret.', color: '#1a1a1a' },
];

const details = [
  {
    title: 'Samværsplan altid ved hånden',
    highlightText: 'altid ved hånden',
    desc: 'Se hvem der har børnene, hvornår der er skift, og hvad der er planlagt — alt sammen i lommen. Perfekt til travle hverdage.',
    bullets: ['Daglig og ugentlig visning', 'Skift-påmindelser', 'Deling med bedsteforældre og nye partnere'],
    color: '#1a1a1a',
    icon: Calendar,
    visual: (
      <div className="relative">
        <div className="w-[240px] h-[480px] rounded-[2.5rem] border-[8px] border-[#2f2f2f] bg-[#1a1a1a] overflow-hidden shadow-2xl">
          <div className="w-full h-full bg-gradient-to-b from-[#e8e8e8] to-[#d0d0d0] flex items-center justify-center">
            <div className="text-center px-6">
              <Calendar size={48} className="mx-auto mb-4" style={{ color: '#1a1a1a' }} />
              <p className="text-[13px] font-bold text-[#2f2f2f]">Samværsplan</p>
              <p className="text-[11px] text-[#78766d] mt-1">7/7 model aktiv</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Kommunikér direkte og struktureret',
    highlightText: 'direkte og struktureret',
    desc: 'Send beskeder, del billeder og hold styr på aftaler — alt samlet i én app. Ingen rodet SMS eller email.',
    bullets: ['Tråde pr. emne', 'Læsekvitteringer', 'Alt gemt som dokumentation'],
    color: '#1a1a1a',
    icon: MessageCircle,
    reversed: true,
    visual: (
      <div className="space-y-3 max-w-[280px]">
        {[
          { name: 'Dig', msg: 'Kan du hente kl. 16 i stedet?', align: 'right' as const },
          { name: 'Medforælder', msg: 'Ja, det passer fint 👍', align: 'left' as const },
          { name: 'Dig', msg: 'Super, tak!', align: 'right' as const },
        ].map((m, i) => (
          <div key={i} className={`flex ${m.align === 'right' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2.5 rounded-2xl text-[13px] max-w-[200px] ${m.align === 'right' ? 'bg-[#1a1a1a] text-white rounded-br-md' : 'bg-white/80 text-[#2f2f2f] border border-white/40 rounded-bl-md'}`}>
              {m.msg}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Udgifter med et swipe',
    highlightText: 'med et swipe',
    desc: 'Tag et billede af kvitteringen, vælg kategori og del udgiften. Så simpelt er det.',
    bullets: ['Foto af kvitteringer', 'Automatisk udgiftsdeling', 'Månedlig balance-oversigt'],
    color: '#1a1a1a',
    icon: Wallet,
    visual: (
      <div className="relative">
        <div className="w-[240px] h-[480px] rounded-[2.5rem] border-[8px] border-[#2f2f2f] bg-[#1a1a1a] overflow-hidden shadow-2xl">
          <div className="w-full h-full bg-gradient-to-b from-[#e8e8e8] to-[#d0d0d0] flex items-center justify-center">
            <div className="text-center px-6">
              <Wallet size={48} className="mx-auto mb-4" style={{ color: '#1a1a1a' }} />
              <p className="text-[13px] font-bold text-[#2f2f2f]">Udgifter</p>
              <p className="text-[11px] text-[#78766d] mt-1">Balance: Kr. 0</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function MobilAppPage() {
  return (
    <FeaturePageLayout
      badge="Mobil app"
      badgeIcon={Smartphone}
      title="Huska"
      titleHighlight="i lommen"
      subtitle="Alt hvad du behøver til co-parenting — altid ved hånden. Push-notifikationer, offline-adgang og lynhurtig synkronisering."
      color="#1a1a1a"
      features={features}
      details={details}
      ctaTitle="Download Huska"
      ctaSubtitle="Tilgængelig til iPhone. Gratis for alle familier."
      ctaButtonLabel="Hent appen"
      ctaButtonHref="#funktioner"
      heroVisual={
        <div className="relative">
          <div className="w-[260px] h-[520px] rounded-[3rem] border-[10px] border-[#2f2f2f] bg-[#1a1a1a] overflow-hidden shadow-2xl shadow-black/20">
            <img src="/app-screenshot.png" alt="Huska app" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-4 -right-4 w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center animate-floatY">
            <Shield size={28} style={{ color: '#1a1a1a' }} />
          </div>
          <div className="absolute -top-4 -left-4 w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center animate-floatY" style={{ animationDelay: '1.5s' }}>
            <Download size={28} style={{ color: '#1a1a1a' }} />
          </div>
        </div>
      }
    />
  );
}
