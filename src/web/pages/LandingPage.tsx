import { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  MessageCircle,
  CheckSquare,
  UtensilsCrossed,
  Wallet,
  FileText,
  Camera,
  BookOpen,
  CalendarHeart,
  Scale,
  Tag,
  Users,
  ArrowRight,
  Shield,
  Clock,
  Heart,
  Smartphone,
  ArrowDown,
  Sparkles,
  Globe,
  Lock,
  Zap,
  HandHeart,
  Baby,
  Home,
  Briefcase,
  Star,
  Quote,
  Check,
  Building2,
  Crown,
} from 'lucide-react';

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
    <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-[#fafaf9]">
      {/* Subtle background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#1a1a1a]/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-8%] w-[500px] h-[500px] rounded-full bg-[#1a1a1a]/3 blur-[80px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-16 md:pb-28 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a] text-xs font-semibold mb-8">
              <Heart size={14} /> Lavet til familier i Danmark
            </div>

            <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.5rem] font-[800] text-[#1a1a1a] leading-[1.02] tracking-[-0.03em]">
              Koordinér
              <br />
              hverdagen
              <span className="block text-[#1a1a1a]/60">
                med din familie
              </span>
            </h1>

            <p className="mt-6 text-[1.15rem] text-[#4a4a4a] max-w-[460px] leading-[1.7]">
              Én sandhedskilde for hele familien. Samværsplan, kalender,
              kommunikation, udgifter og meget mere — samlet i én app.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-8 py-4 text-[15px] font-semibold text-white bg-[#1a1a1a] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <Smartphone size={18} />
                Hent til iPhone
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="#funktioner"
                className="inline-flex items-center gap-2 px-7 py-4 text-[15px] font-semibold text-[#1a1a1a] rounded-full border border-[#e5e3dc] bg-white hover:bg-[#fafaf9] hover:-translate-y-0.5 transition-all duration-300"
              >
                Se funktioner
                <ArrowDown size={16} />
              </a>
            </div>

            <div className="mt-8 flex items-center gap-6 text-[13px] text-[#78766d]">
              <span className="flex items-center gap-1.5"><Shield size={15} /> Sikker</span>
              <span className="flex items-center gap-1.5"><Clock size={15} /> Tidsbesparende</span>
              <span className="flex items-center gap-1.5 text-[#1a1a1a] font-bold">
                <Sparkles size={15} /> Gratis
              </span>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              <div className="absolute inset-0 scale-110 rounded-[3.5rem] bg-[#1a1a1a]/5 blur-xl" />

              <div className="relative w-[290px] h-[590px] bg-gradient-to-b from-[#fafafa] to-white rounded-[3rem] shadow-2xl shadow-black/15 border border-[#e5e3dc] p-3">
                <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative">
                  <img
                    src="/app-screenshot.png"
                    alt="Huska app — samværsplan indstillinger"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-[#1a1a1a] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FEATURES — Clean grid with monochrome cards                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Feature {
  icon: typeof Calendar;
  title: string;
  desc: string;
  badge?: string;
}

const features: Feature[] = [
  { icon: Calendar, title: 'Samværsplan', desc: 'Planlæg samvær med fast 7/7, 10/4 eller fleksibel model. Altid overblik over hvem der har børnene.', badge: 'Populær' },
  { icon: CalendarHeart, title: 'Kalender', desc: 'Fælles familiekalender med begivenheder, aktiviteter og vigtige datoer for alle.' },
  { icon: MessageCircle, title: 'Kommunikation', desc: 'Struktureret kommunikation mellem forældre. Tråde, beskeder og delt historik.' },
  { icon: Wallet, title: 'Udgifter', desc: 'Del udgifter retfærdigt. Hold styr på budgetter, balancer og kvitteringer.' },
  { icon: CheckSquare, title: 'Opgaver', desc: 'Fordel og følg op på familiens opgaver. Se hvem der gør hvad og hvornår.' },
  { icon: UtensilsCrossed, title: 'Mad & Indkøb', desc: 'Madplan og indkøbslister. Se ugens bedste tilbud fra lokale butikker.' },
  { icon: FileText, title: 'Dokumenter', desc: 'Opbevar vigtige dokumenter sikkert. Altid tilgængelige for begge forældre.' },
  { icon: Camera, title: 'Fotoalbum', desc: 'Del minder med familien. Organisér billeder i albums.' },
  { icon: BookOpen, title: 'Dagbog', desc: 'Hold styr på hverdagen med noter og dagbogsindlæg.' },
  { icon: Scale, title: 'Beslutningslog', desc: 'Dokumentér fælles beslutninger. Altid enighed om hvad der er aftalt.' },
  { icon: Tag, title: 'Tilbud', desc: 'Se ugens bedste tilbud fra danske supermarkeder.' },
  { icon: CalendarHeart, title: 'Vigtige Datoer', desc: 'Glem aldrig fødselsdage, lægebesøg og milepæle.' },
];

function FeatureSection() {
  const { ref, visible } = useInView(0.1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalCards = features.length;
  const arcSpread = 180; // degrees
  const arcRadius = 420; // px

  return (
    <section id="funktioner" className="py-24 bg-white overflow-hidden" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-8 ${visible ? 'animate-slideUp' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a] text-xs font-semibold mb-4">
            <Zap size={13} /> Alt-i-én platform
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-[800] text-[#1a1a1a] tracking-[-0.03em]">
            Alt hvad din familie har brug for
          </h2>
          <p className="mt-4 text-[#4a4a4a] max-w-lg mx-auto text-[1.05rem] leading-relaxed">
            Fra samværsplan til dagligvarer — Huska samler alle familiens funktioner på ét sted.
          </p>
        </div>

        {/* Arc layout — desktop */}
        <div className={`hidden lg:block relative mx-auto ${visible ? 'animate-slideUp' : 'opacity-0'}`} style={{ width: '960px', height: '480px' }}>
          {features.map((f, i) => {
            const angle = -arcSpread / 2 + (arcSpread / (totalCards - 1)) * i;
            const rad = (angle * Math.PI) / 180;
            const x = Math.sin(rad) * arcRadius;
            const y = -Math.cos(rad) * arcRadius + arcRadius;
            const rotate = angle * 0.25;
            const centerDist = Math.abs(i - (totalCards - 1) / 2);
            const baseZ = totalCards - Math.round(centerDist);
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={f.title}
                className="absolute w-[120px] text-center cursor-pointer"
                style={{
                  left: `calc(50% + ${x}px - 60px)`,
                  top: `${y * 0.55 + 20}px`,
                  transform: `rotate(${rotate}deg) scale(${isHovered ? 1.15 : 1}) translateY(${isHovered ? -12 : 0}px)`,
                  zIndex: isHovered ? 50 : baseZ,
                  transition: 'transform 0.3s ease, z-index 0s',
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className={`p-4 rounded-xl border bg-white shadow-md ${isHovered ? 'shadow-xl border-[#1a1a1a]/20' : 'border-[#e5e3dc]'} transition-shadow duration-300`}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 bg-[#1a1a1a]/5">
                    <f.icon size={20} className="text-[#1a1a1a]" />
                  </div>
                  <p className="text-[12px] font-semibold text-[#1a1a1a] leading-tight">{f.title}</p>
                  {f.badge && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#1a1a1a]/10 text-[#1a1a1a] text-[8px] font-bold uppercase tracking-wide">
                      {f.badge}
                    </span>
                  )}
                </div>
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[200px] p-3 rounded-xl bg-[#1a1a1a] text-white text-[11px] leading-relaxed shadow-xl z-[60]">
                    {f.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile/Tablet — horizontal scroll with overlap */}
        <div className={`lg:hidden flex items-end overflow-x-auto pb-4 pt-2 -mx-4 px-4 no-scrollbar ${visible ? 'animate-slideUp' : 'opacity-0'}`}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="shrink-0 text-center"
              style={{ marginLeft: i === 0 ? 0 : '-12px', zIndex: totalCards - Math.abs(i - Math.floor(totalCards / 2)) }}
            >
              <div className="w-[100px] p-3 rounded-xl border border-[#e5e3dc] bg-white shadow-sm">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 bg-[#1a1a1a]/5">
                  <f.icon size={18} className="text-[#1a1a1a]" />
                </div>
                <p className="text-[11px] font-semibold text-[#1a1a1a] leading-tight">{f.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HOW IT WORKS                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

const steps = [
  { num: '1', title: 'Opret din familie', desc: 'Download appen og opret en familieprofil. Vælg jeres familiemodel — co-parenting, sammensat eller under samme tag.', icon: Users },
  { num: '2', title: 'Invitér den anden forælder', desc: 'Send en invitation, så begge forældre kan se og opdatere fælles information i realtid.', icon: HandHeart },
  { num: '3', title: 'Koordinér hverdagen', desc: 'Brug samværsplan, kalender, opgaver og kommunikation til at skabe struktur og reducere konflikter.', icon: Sparkles },
];

function HowItWorksSection() {
  const { ref, visible } = useInView();

  return (
    <section id="hvordan" className="py-24 bg-[#fafaf9]" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 ${visible ? 'animate-slideUp' : 'opacity-0'}`}>
          <h2 className="text-3xl sm:text-4xl font-[800] text-[#1a1a1a] tracking-[-0.03em]">
            Kom i gang på 3 trin
          </h2>
          <p className="mt-3 text-[#4a4a4a] text-[1.05rem]">
            Det tager under 5 minutter at sætte op.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[52px] left-[20%] right-[20%] h-[3px] rounded-full bg-[#e5e3dc]" />

          {steps.map((s, i) => (
            <div
              key={s.num}
              className={`text-center relative ${visible ? 'animate-slideUp' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <div className="relative inline-block mb-5">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white bg-[#1a1a1a] shadow-lg relative z-10 transition-transform duration-300 hover:scale-110">
                  <s.icon size={26} />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] flex items-center justify-center text-[11px] font-extrabold z-20">
                  {s.num}
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">{s.title}</h3>
              <p className="mt-2 text-[14px] text-[#4a4a4a] max-w-[280px] mx-auto leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FEATURE DEEP-DIVES — Spotlight sections                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FeatureSpotlight1() {
  const { ref, visible } = useInView();

  return (
    <section className="py-20 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className={visible ? 'animate-slideIn' : 'opacity-0'}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 bg-[#1a1a1a]/5 text-[#1a1a1a]">
              <Calendar size={13} /> Samværsplan
            </div>
            <h3 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] tracking-[-0.02em] leading-tight">
              Altid overblik over
              <span className="block text-[#1a1a1a]/60">hvem der har børnene</span>
            </h3>
            <p className="mt-4 text-[#4a4a4a] leading-relaxed text-[1.05rem]">
              Vælg mellem 7/7, 10/4, 14/14 eller lav din helt egen model. Samværsplanen synkroniserer automatisk,
              så begge forældre altid kan se den aktuelle plan.
            </p>
            <ul className="mt-6 space-y-3">
              {['Fast eller fleksibel model', 'Automatisk synkronisering', 'Ferie- og helligdage inkluderet'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[14px] text-[#4a4a4a]">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#1a1a1a]/5">
                    <Check size={13} className="text-[#1a1a1a]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={`flex justify-center ${visible ? 'animate-slideInRight' : 'opacity-0'}`}>
            <div className="relative w-[260px] h-[520px] bg-gradient-to-b from-[#fafafa] to-white rounded-[2.5rem] shadow-2xl shadow-black/10 border border-[#e5e3dc] p-2.5">
              <div className="w-full h-full rounded-[2rem] overflow-hidden bg-[#fafaf9] flex items-center justify-center">
                <img src="/app-screenshot.png" alt="Samværsplan" className="w-full h-full object-cover object-top" loading="lazy" />
              </div>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90px] h-[25px] bg-[#1a1a1a] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSpotlight2() {
  const { ref, visible } = useInView();

  return (
    <section className="py-20 bg-[#fafaf9]" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image first on md+ */}
          <div className={`flex justify-center order-2 md:order-1 ${visible ? 'animate-slideIn' : 'opacity-0'}`}>
            <div className="relative">
              {/* Chat bubbles mockup */}
              <div className="w-[300px] space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[220px] px-4 py-3 rounded-2xl rounded-tr-md text-[13px] text-white bg-[#1a1a1a]">
                    Kan du hente Magnus kl. 15 i morgen?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[220px] px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-[#e5e3dc] text-[13px] text-[#1a1a1a] shadow-sm">
                    Selvfølgelig! Jeg henter ham fra SFO 👍
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[220px] px-4 py-3 rounded-2xl rounded-tr-md text-[13px] text-white bg-[#1a1a1a]">
                    Perfekt, så opdaterer jeg kalenderen ✓
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[220px] px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-[#e5e3dc] text-[13px] text-[#1a1a1a] shadow-sm">
                    Super. Skal jeg tage madpakke med? 🥪
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`order-1 md:order-2 ${visible ? 'animate-slideInRight' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 bg-[#1a1a1a]/5 text-[#1a1a1a]">
              <MessageCircle size={13} /> Kommunikation
            </div>
            <h3 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] tracking-[-0.02em] leading-tight">
              Struktureret dialog
              <span className="block text-[#1a1a1a]/60">uden misforståelser</span>
            </h3>
            <p className="mt-4 text-[#4a4a4a] leading-relaxed text-[1.05rem]">
              Hold al kommunikation samlet ét sted. Tråde og beskeder giver overblik og historik —
              perfekt til co-parenting hvor klarhed er alt.
            </p>
            <ul className="mt-6 space-y-3">
              {['Alt gemt som dokumentation', 'Tråde pr. emne', 'Push-notifikationer i realtid'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[14px] text-[#4a4a4a]">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#1a1a1a]/5">
                    <Check size={13} className="text-[#1a1a1a]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SOCIAL PROOF — Testimonials                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const testimonials = [
  { name: 'Maria K.', type: 'Co-parenting mor', quote: 'Endelig en app der forstår hverdagen som skilsmissefamilie. Samværsplanen er genial!', stars: 5 },
  { name: 'Thomas J.', type: 'Far til to', quote: 'Vi sparer så mange misforståelser. Alt er dokumenteret og begge har overblikket.', stars: 5 },
  { name: 'Line & Anders', type: 'Sammensat familie', quote: 'Med 4 børn og 3 kalendere var vi ved at drukne. Huska samler det hele.', stars: 5 },
];

function SocialProofSection() {
  const { ref, visible } = useInView();

  return (
    <section className="py-20 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 ${visible ? 'animate-slideUp' : 'opacity-0'}`}>
          <h2 className="text-3xl sm:text-4xl font-[800] text-[#1a1a1a] tracking-[-0.03em]">
            Familier elsker Huska
          </h2>
          <p className="mt-3 text-[#4a4a4a] text-[1.05rem]">
            Brugt af familier over hele Danmark
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`relative p-6 rounded-2xl bg-white border border-[#e5e3dc] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${visible ? 'animate-slideUp' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <Quote size={20} className="text-[#1a1a1a]/15 mb-3" />

              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-4">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-[13px] font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">{t.name}</p>
                  <p className="text-[11px] text-[#78766d]">{t.type}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={12} className="fill-[#1a1a1a] text-[#1a1a1a]" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PRICING                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const familyFeatures = [
  'Samværsplan med alle modeller',
  'Fælles kalender & kommunikation',
  'Udgiftsdeling & opgavestyring',
  'Dokumenter, dagbog & fotoalbum',
  'Tilbud fra danske supermarkeder',
  'Krypteret data & sikker opbevaring',
];

function PricingSection() {
  const { ref, visible } = useInView();

  return (
    <section id="priser" className="py-24 bg-[#fafaf9]" ref={ref}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 ${visible ? 'animate-slideUp' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a] text-xs font-semibold mb-4">
            <Sparkles size={13} /> Ingen skjulte omkostninger
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-[800] text-[#1a1a1a] tracking-[-0.03em]">
            Helt gratis.
            <span className="block text-[#1a1a1a]/60">For altid.</span>
          </h2>
          <p className="mt-4 text-[#4a4a4a] max-w-md mx-auto text-[1.05rem] leading-relaxed">
            Alle funktioner er gratis for familier. Ingen abonnement, ingen prøveperiode.
          </p>
        </div>

        <div
          className={`relative p-8 rounded-3xl bg-white border-2 border-[#1a1a1a] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${visible ? 'animate-slideUp' : 'opacity-0'}`}
          style={{ animationDelay: '100ms' }}
        >
          <div className="text-center mb-6">
            <span className="text-5xl font-[800] text-[#1a1a1a]">Kr. 0</span>
            <span className="text-[#78766d] text-sm ml-2">/ måned</span>
          </div>

          <ul className="space-y-3 mb-8">
            {familyFeatures.map((f) => (
              <li key={f} className="flex items-center gap-3 text-[15px] text-[#4a4a4a]">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#1a1a1a]/5">
                  <Check size={12} className="text-[#1a1a1a]" />
                </div>
                {f}
              </li>
            ))}
          </ul>

          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3.5 rounded-xl font-semibold text-white bg-[#1a1a1a] shadow-lg hover:bg-[#333] hover:shadow-xl transition-all duration-200"
          >
            Hent appen gratis
          </a>
        </div>

        <p className={`text-center text-[14px] text-[#78766d] mt-6 ${visible ? 'animate-slideUp' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
          Er du kommune eller professionel?{' '}
          <a href="#partner" className="text-[#1a1a1a] font-medium underline underline-offset-2 hover:no-underline transition-colors">
            Se partnerprogrammet <ArrowRight size={13} className="inline" />
          </a>
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ABOUT                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const familyTypes = [
  { icon: HandHeart, label: 'Co-parenting', desc: 'Fast eller fleksibel samværsplan' },
  { icon: Baby, label: 'Sammensatte familier', desc: 'Flere børn, flere kalendere' },
  { icon: Home, label: 'Under samme tag', desc: 'Fordel opgaver og udgifter' },
  { icon: Briefcase, label: 'Professionelle', desc: 'Socialrådgivere og sagsbehandlere' },
];

function AboutSection() {
  const { ref, visible } = useInView();

  return (
    <section id="om-section" className="py-24 bg-[#1a1a1a]" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className={visible ? 'animate-slideIn' : 'opacity-0'}>
            <h2 className="text-3xl sm:text-4xl font-[800] text-white leading-[1.1] tracking-[-0.03em]">
              Bygget til familier
              <span className="block text-white/60">
                i Danmark
              </span>
            </h2>
            <p className="mt-5 text-white/70 leading-relaxed text-[1.05rem]">
              Huska er skabt med én mission: at gøre hverdagen lettere for danske familier.
              Uanset om I er samboende, co-parenting eller en sammensat familie, fortjener I
              et redskab der samler alt ét sted — uden forvirring og med fuld gennemsigtighed.
            </p>
            <p className="mt-4 text-white/70 leading-relaxed text-[1.05rem]">
              Vi tror på, at mindre friktion i hverdagen giver mere tid til det der virkelig tæller:
              at være sammen med dem, man holder af.
            </p>
          </div>

          <div className={`grid grid-cols-2 gap-4 ${visible ? 'animate-slideInRight' : 'opacity-0'}`}>
            {familyTypes.map((item, i) => (
              <div
                key={item.label}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <item.icon size={22} className="text-white/80 mb-3" />
                <p className="text-[14px] font-semibold text-white">{item.label}</p>
                <p className="text-[12px] text-white/50 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
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
    <section className="py-24 bg-[#fafaf9]" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative text-center rounded-[2rem] p-12 md:p-20 overflow-hidden bg-white border border-[#e5e3dc] ${visible ? 'animate-slideUp' : 'opacity-0'}`}>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a] text-xs font-bold mb-6">
              <Sparkles size={14} /> Gratis at bruge
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-[#1a1a1a] tracking-[-0.03em]">
              Klar til at koordinere
              <br />
              <span className="text-[#1a1a1a]/60">hverdagen?</span>
            </h2>
            <p className="mt-4 text-[#4a4a4a] max-w-md mx-auto text-[1.05rem] leading-relaxed">
              Hent Huska gratis og kom i gang med at skabe mere struktur og mindre friktion i din families hverdag.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[15px] font-bold text-white bg-[#1a1a1a] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <Smartphone size={20} />
                Hent appen nu
                <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PAGE                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeatureSection />
      <FeatureSpotlight1 />
      <FeatureSpotlight2 />
      <HowItWorksSection />
      <SocialProofSection />
      <PricingSection />
      <AboutSection />
      <CTASection />
    </>
  );
}
