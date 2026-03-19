import { useEffect, useRef, useState } from 'react';
import {
  Heart,
  Check,
  Eye,
  Lightbulb,
  Lock,
  Smile,
  ArrowRight,
  Calendar,
  MessageCircle,
  Wallet,
  CheckSquare,
  UtensilsCrossed,
  FileText,
  CalendarHeart,
  MapPin,
  TrendingUp,
  Users,
  Rocket,
  Building2,
  Handshake,
} from 'lucide-react';
import { denmarkRegions } from '../assets/denmarkPaths';

/* ── Intersection Observer hook ─────────────────────────────────────────── */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HERO                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 bg-[#fafaf9]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#1a1a1a]/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-8%] w-[400px] h-[400px] rounded-full bg-[#1a1a1a]/3 blur-[80px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a] text-xs font-semibold mb-8">
            <Heart size={14} /> Om Huska
          </div>

          {/* Logo */}
          <div className="mb-10">
            <img
              src="/huska-logo.svg"
              alt="Huska logo"
              className="w-28 h-28 sm:w-36 sm:h-36 mx-auto"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-[800] text-[#1a1a1a] tracking-[-0.03em] leading-[1.08] max-w-4xl">
            Vi gør hverdagen lettere for danske familier
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[#4a4a4a] max-w-2xl mx-auto leading-relaxed">
            Huska er skabt med én klar mission: at samle alt det vigtige ét sted — så familier kan fokusere på det der virkelig tæller.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MISSION                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MissionSection() {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 bg-white">
      <div
        ref={ref}
        className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <p className="text-xs font-semibold text-[#78766d] uppercase tracking-widest mb-3">Vores mission</p>
            <h2 className="text-3xl sm:text-4xl font-[800] text-[#1a1a1a] tracking-[-0.02em] leading-tight mb-6">
              At gøre hverdagen lettere for danske familier.
            </h2>
            <p className="text-[#4a4a4a] leading-relaxed mb-4">
              Huska eksisterer for at reducere friktion i skilte familier og co-parenting familier. Vi tror på, at når hverdagens praktiske koordinering bliver nemmere, så bliver der mere plads til det vigtigste: kvalitetstid med børnene.
            </p>
            <p className="text-[#4a4a4a] leading-relaxed">
              Mindre konflikt. Bedre kommunikation. Mere nærvær. Det er kernen i alt, hvad vi bygger.
            </p>
          </div>

          {/* Visual: Two houses connected */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-[340px] h-[280px]">
              {/* House A */}
              <div className="absolute left-0 top-8 w-[120px]">
                <div className="bg-[#fafaf9] border border-[#e5e3dc] rounded-2xl p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-[#1a1a1a]/5 flex items-center justify-center">
                    <span className="text-xl">🏠</span>
                  </div>
                  <p className="text-xs font-bold text-[#1a1a1a]">Hjem A</p>
                  <p className="text-[10px] text-[#78766d] mt-1">Mor</p>
                </div>
              </div>

              {/* House B */}
              <div className="absolute right-0 top-8 w-[120px]">
                <div className="bg-[#fafaf9] border border-[#e5e3dc] rounded-2xl p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-[#1a1a1a]/5 flex items-center justify-center">
                    <span className="text-xl">🏡</span>
                  </div>
                  <p className="text-xs font-bold text-[#1a1a1a]">Hjem B</p>
                  <p className="text-[10px] text-[#78766d] mt-1">Far</p>
                </div>
              </div>

              {/* Connection arrows */}
              <div className="absolute top-[52px] left-[130px] right-[130px] flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-[#e5e3dc] rounded-full px-3 py-1.5 shadow-sm">
                  <Calendar size={11} className="text-[#1a1a1a]" />
                  <span className="text-[10px] font-semibold text-[#1a1a1a]">Kalender</span>
                </div>
                <div className="w-px h-3 bg-[#e5e3dc]" />
                <div className="flex items-center gap-1.5 bg-white border border-[#e5e3dc] rounded-full px-3 py-1.5 shadow-sm">
                  <MessageCircle size={11} className="text-[#1a1a1a]" />
                  <span className="text-[10px] font-semibold text-[#1a1a1a]">Beskeder</span>
                </div>
                <div className="w-px h-3 bg-[#e5e3dc]" />
                <div className="flex items-center gap-1.5 bg-white border border-[#e5e3dc] rounded-full px-3 py-1.5 shadow-sm">
                  <Wallet size={11} className="text-[#1a1a1a]" />
                  <span className="text-[10px] font-semibold text-[#1a1a1a]">Udgifter</span>
                </div>
              </div>

              {/* Dashed connector lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 340 280">
                <line x1="120" y1="60" x2="140" y2="60" stroke="#e5e3dc" strokeWidth="1.5" strokeDasharray="4 3" />
                <line x1="200" y1="60" x2="220" y2="60" stroke="#e5e3dc" strokeWidth="1.5" strokeDasharray="4 3" />
                <line x1="120" y1="95" x2="140" y2="95" stroke="#e5e3dc" strokeWidth="1.5" strokeDasharray="4 3" />
                <line x1="200" y1="95" x2="220" y2="95" stroke="#e5e3dc" strokeWidth="1.5" strokeDasharray="4 3" />
                <line x1="120" y1="130" x2="140" y2="130" stroke="#e5e3dc" strokeWidth="1.5" strokeDasharray="4 3" />
                <line x1="200" y1="130" x2="220" y2="130" stroke="#e5e3dc" strokeWidth="1.5" strokeDasharray="4 3" />
              </svg>

              {/* Huska badge in center bottom */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-[10px] font-bold px-4 py-2 rounded-full flex items-center gap-1.5">
                <Heart size={10} /> Huska synkroniserer alt
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VISION                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function VisionSection() {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 bg-[#fafaf9]">
      <div
        ref={ref}
        className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Visual: Denmark map with dots */}
          <div className="flex justify-center order-2 md:order-1">
            <div className="relative w-[280px] h-[340px]">
              {/* Realistic Denmark map from geographic SVG data */}
              <svg viewBox="0 0 980 793" className="w-full h-full" fill="none">
                {denmarkRegions.map((region) => (
                  <path
                    key={region.id}
                    d={region.d}
                    fill="#1a1a1a"
                    fillOpacity="0.08"
                    stroke="#1a1a1a"
                    strokeOpacity="0.18"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>

              {/* City dots — positioned on realistic Denmark map */}
              {[
                { x: 30, y: 22, label: 'Aalborg', delay: '0s' },
                { x: 35, y: 40, label: 'Aarhus', delay: '0.2s' },
                { x: 38, y: 65, label: 'Odense', delay: '0.4s' },
                { x: 72, y: 55, label: 'København', delay: '0.6s' },
              ].map((city, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{ left: `${city.x}%`, top: `${city.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div
                    className="w-3 h-3 rounded-full bg-[#1a1a1a] relative"
                    style={{ animation: `pulse 2s ease-in-out ${city.delay} infinite` }}
                  >
                    <div className="absolute inset-0 rounded-full bg-[#1a1a1a]/20 animate-ping" />
                  </div>
                  <p className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-[#1a1a1a]">
                    {city.label}
                  </p>
                </div>
              ))}

              {/* Growth indicator */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white border border-[#e5e3dc] rounded-full px-4 py-2 shadow-sm">
                <TrendingUp size={14} className="text-[#1a1a1a]" />
                <span className="text-[11px] font-bold text-[#1a1a1a]">Hele Danmark 2026</span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 md:order-2">
            <p className="text-xs font-semibold text-[#78766d] uppercase tracking-widest mb-3">Vores vision</p>
            <h2 className="text-3xl sm:text-4xl font-[800] text-[#1a1a1a] tracking-[-0.02em] leading-tight mb-6">
              Et Danmark hvor alle skilte familier samarbejder gnidningsfrit.
            </h2>
            <p className="text-[#4a4a4a] leading-relaxed mb-4">
              Vores vision er, at hver eneste skilte familie i Danmark skal have adgang til værktøjer, der gør co-parenting gnidningsfrit og konstruktivt.
            </p>
            <p className="text-[#4a4a4a] leading-relaxed mb-4">
              Vi vil fjerne de praktiske barrierer, så forældre kan fokusere på at være gode forældre — uanset om de bor under samme tag eller ej.
            </p>
            <p className="text-[#4a4a4a] leading-relaxed">
              <strong className="text-[#1a1a1a]">Målet:</strong> At blive standarden for familiekoordinering i Skandinavien.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PRODUCT                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const features = [
  { icon: CalendarHeart, name: 'Samværsplan' },
  { icon: Calendar, name: 'Kalender' },
  { icon: MessageCircle, name: 'Kommunikation' },
  { icon: Wallet, name: 'Udgifter' },
  { icon: CheckSquare, name: 'Opgaver' },
  { icon: UtensilsCrossed, name: 'Mad & indkøb' },
  { icon: FileText, name: 'Dokumenter' },
];

function ProductSection() {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 bg-white">
      <div
        ref={ref}
        className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#78766d] uppercase tracking-widest mb-3">Vores produkt</p>
          <h2 className="text-3xl sm:text-4xl font-[800] text-[#1a1a1a] tracking-[-0.02em] leading-tight max-w-2xl mx-auto">
            Alt hvad din familie har brug for — samlet i én app
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Phone mockup */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-[260px] h-[520px] bg-[#1a1a1a] rounded-[3rem] p-[10px] shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2.4rem] overflow-hidden relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-[#1a1a1a] rounded-b-2xl z-10" />
                  {/* Screenshot */}
                  <img
                    src="/app-screenshot.png"
                    alt="Huska app screenshot"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-[#1a1a1a]/5 rounded-[3.5rem] blur-2xl -z-10" />
            </div>
          </div>

          {/* Features list */}
          <div>
            <div className="space-y-3 mb-8">
              {features.map((f) => (
                <div key={f.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#fafaf9] transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-[#1a1a1a]/5 flex items-center justify-center shrink-0">
                    <f.icon size={18} className="text-[#1a1a1a]" />
                  </div>
                  <span className="text-[15px] font-semibold text-[#1a1a1a]">{f.name}</span>
                  <Check size={16} className="text-[#1a1a1a]/40 ml-auto" />
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc]">
              <p className="text-[13px] text-[#4a4a4a] leading-relaxed">
                <strong className="text-[#1a1a1a]">Gratis for familier.</strong> Tilgængelig på iPhone med web-adgang. Ingen reklamer, ingen skjulte gebyrer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TIMELINE                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const milestones = [
  {
    period: '2025 Q3',
    title: 'Idéen fødes',
    desc: 'Martin og Frederik oplever selv udfordringerne ved at koordinere hverdagen som skilte forældre.',
    icon: Lightbulb,
  },
  {
    period: '2025 Q4',
    title: 'Udvikling starter',
    desc: 'Første prototype bygges. Kernefunktioner som samværsplan og kalender tager form.',
    icon: Rocket,
  },
  {
    period: '2026 Q1',
    title: 'Beta-lancering',
    desc: 'Første familier tester Huska og giver værdifuld feedback.',
    icon: Users,
  },
  {
    period: '2026 Q2',
    title: 'Offentlig lancering',
    desc: 'Huska lanceres i App Store — gratis for alle danske familier.',
    icon: Rocket,
  },
  {
    period: '2026',
    title: 'Kommuner',
    desc: 'Partnerskaber med danske kommuner og familieretshuse.',
    icon: Building2,
  },
];

function TimelineSection() {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 bg-[#fafaf9]">
      <div
        ref={ref}
        className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#78766d] uppercase tracking-widest mb-3">Vores historie</p>
          <h2 className="text-3xl sm:text-4xl font-[800] text-[#1a1a1a] tracking-[-0.02em] leading-tight">
            Fra idé til virkelighed
          </h2>
        </div>

        {/* Vertical timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] sm:left-1/2 sm:-translate-x-px top-0 bottom-0 w-[2px] bg-[#e5e3dc]" />

          <div className="space-y-12">
            {milestones.map((m, i) => (
              <div
                key={m.title}
                className={`relative flex items-start gap-6 sm:gap-0 ${
                  i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Dot */}
                <div className="absolute left-[14px] sm:left-1/2 sm:-translate-x-1/2 w-[20px] h-[20px] rounded-full bg-white border-[2px] border-[#1a1a1a] z-10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
                </div>

                {/* Content card */}
                <div className={`ml-14 sm:ml-0 sm:w-[calc(50%-2rem)] ${i % 2 === 0 ? 'sm:pr-0 sm:text-right' : 'sm:pl-0 sm:text-left'}`}>
                  <div className={`inline-block p-5 rounded-2xl bg-white border border-[#e5e3dc] shadow-sm hover:shadow-md transition-shadow ${i % 2 === 0 ? 'sm:mr-8' : 'sm:ml-8'}`}>
                    <div className={`flex items-center gap-2 mb-2 ${i % 2 === 0 ? 'sm:justify-end' : 'sm:justify-start'}`}>
                      <m.icon size={14} className="text-[#1a1a1a]" />
                      <span className="text-[11px] font-bold text-[#78766d] uppercase tracking-wider">{m.period}</span>
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-1">{m.title}</h3>
                    <p className="text-[13px] text-[#4a4a4a] leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TEAM                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const team = [
  {
    name: 'Martin Kristensen',
    role: 'Grundlægger & CEO',
    initials: 'MK',
    desc: 'Visionær og produktansvarlig. Driven af egen erfaring som skilsmissefar og et ønske om at gøre co-parenting nemmere.',
  },
  {
    name: 'Frederik Hansen',
    role: 'Grundlægger & CTO',
    initials: 'FH',
    desc: 'Teknisk arkitekt og udvikler. Bygger den platform der samler familier — én funktion ad gangen.',
  },
];

function TeamSection() {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 bg-white">
      <div
        ref={ref}
        className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#78766d] uppercase tracking-widest mb-3">Holdet</p>
          <h2 className="text-3xl sm:text-4xl font-[800] text-[#1a1a1a] tracking-[-0.02em] leading-tight">
            Holdet bag Huska
          </h2>
          <p className="mt-4 text-[#4a4a4a] max-w-xl mx-auto leading-relaxed">
            Huska er bygget af forældre, til forældre. Vi har selv oplevet udfordringerne — og vi bygger løsningen.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          {team.map((person) => (
            <div
              key={person.name}
              className="p-8 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc] text-center hover:-translate-y-1 transition-all duration-300 hover:shadow-lg"
            >
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-[#1a1a1a] mx-auto mb-5 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{person.initials}</span>
              </div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">{person.name}</h3>
              <p className="text-[13px] font-semibold text-[#78766d] mb-4">{person.role}</p>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">{person.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VALUES                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const values = [
  {
    icon: Eye,
    title: 'Gennemsigtighed',
    desc: 'Vi er åbne om alt — fra priser til data. Ingen skjulte agendaer.',
  },
  {
    icon: Lock,
    title: 'Privatliv',
    desc: 'Dine data er dine. Vi sælger aldrig personoplysninger, og alt opbevares sikkert i EU.',
  },
  {
    icon: Handshake,
    title: 'Enkelhed',
    desc: 'Teknologi skal gøre livet nemmere, ikke mere kompliceret. Alt vi bygger, skal være intuitivt.',
  },
  {
    icon: Smile,
    title: 'Empati',
    desc: 'Vi forstår, at skilsmisse er svært. Vores produkt møder familier med forståelse — ikke fordømmelse.',
  },
];

function ValuesSection() {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 bg-[#fafaf9]">
      <div
        ref={ref}
        className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#78766d] uppercase tracking-widest mb-3">Værdier</p>
          <h2 className="text-3xl sm:text-4xl font-[800] text-[#1a1a1a] tracking-[-0.02em] leading-tight">
            Vores værdier
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {values.map((v) => (
            <div
              key={v.title}
              className="p-6 rounded-2xl bg-white border border-[#e5e3dc] hover:-translate-y-1 transition-all duration-300 hover:shadow-lg"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[#1a1a1a]/5">
                <v.icon size={22} className="text-[#1a1a1a]" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-2">{v.title}</h3>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CTA                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CTASection() {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 bg-[#1a1a1a]">
      <div
        ref={ref}
        className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <h2 className="text-3xl sm:text-4xl font-[800] text-white tracking-[-0.02em]">
          Vil du vide mere?
        </h2>
        <p className="mt-4 text-white/60 max-w-lg mx-auto leading-relaxed">
          Vi vil meget gerne høre fra dig — uanset om du er forælder, kommune, familierådgiver eller bare nysgerrig.
        </p>
        <a
          href="mailto:kontakt@huska.dk"
          className="group inline-flex items-center justify-center gap-2.5 mt-8 px-8 py-4 text-[15px] font-bold text-[#1a1a1a] bg-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
          Kontakt os
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PAGE                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <MissionSection />
      <VisionSection />
      <ProductSection />
      <TimelineSection />
      <TeamSection />
      <ValuesSection />
      <CTASection />
    </div>
  );
}
