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
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#f58a2d]/20 to-[#f7a95c]/5 blur-[80px]" style={{ animation: 'meshFloat 12s ease-in-out infinite' }} />
        <div className="absolute bottom-[-10%] left-[-8%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#f58a2d]/10 to-transparent blur-[70px]" style={{ animation: 'meshFloat 10s ease-in-out infinite reverse' }} />
        <div className="absolute top-[30%] left-[40%] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-[#fbbf24]/8 to-[#f58a2d]/5 blur-[60px]" style={{ animation: 'meshFloat 14s ease-in-out infinite 2s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-16 md:pb-28 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-[#f58a2d]/20 text-[#e8773f] text-xs font-semibold mb-8 shadow-sm backdrop-blur-sm">
              <Heart size={14} className="fill-[#f58a2d]/30" /> Lavet til familier i Danmark
            </div>

            <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.5rem] font-[800] text-[#2f2f2f] leading-[1.02] tracking-[-0.03em]">
              Koordinér
              <br />
              hverdagen
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 40%, #e8773f 100%)' }}
              >
                med din familie
              </span>
            </h1>

            <p className="mt-6 text-[1.15rem] text-[#5f5d56] max-w-[460px] leading-[1.7]">
              Én sandhedskilde for hele familien. Samværsplan, kalender,
              kommunikation, udgifter og meget mere — samlet i én app.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-8 py-4 text-[15px] font-semibold text-white rounded-full shadow-lg shadow-[#f58a2d]/25 hover:shadow-xl hover:shadow-[#f58a2d]/35 hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)' }}
              >
                <Smartphone size={18} />
                Hent til iPhone
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="#funktioner"
                className="inline-flex items-center gap-2 px-7 py-4 text-[15px] font-semibold text-[#2f2f2f] rounded-full border border-[#d8d7cf] bg-white/80 backdrop-blur-sm hover:bg-white hover:border-[#c5c3bc] hover:-translate-y-0.5 transition-all duration-300"
              >
                Se funktioner
                <ArrowDown size={16} />
              </a>
            </div>

            <div className="mt-8 flex items-center gap-6 text-[13px] text-[#9a978f]">
              <span className="flex items-center gap-1.5"><Shield size={15} className="text-[#78766d]" /> Sikker</span>
              <span className="flex items-center gap-1.5"><Clock size={15} className="text-[#78766d]" /> Tidsbesparende</span>
              <span className="flex items-center gap-1.5 text-[#f58a2d] font-bold">
                <Sparkles size={15} /> Gratis
              </span>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              <div className="absolute inset-0 scale-110 rounded-[3.5rem] bg-gradient-to-b from-[#f58a2d]/15 to-transparent blur-xl" />

              <div className="relative w-[290px] h-[590px] bg-gradient-to-b from-[#fafafa] to-white rounded-[3rem] shadow-2xl shadow-black/15 border border-[#e0ded8] p-3">
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

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 40C240 70 480 80 720 60C960 40 1200 10 1440 30V80H0V40Z" fill="white" fillOpacity="0.5" />
        </svg>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FEATURES — Bento Grid with color-coded cards                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Feature {
  icon: typeof Calendar;
  title: string;
  desc: string;
  color: string;
  bgFrom: string;
  bgTo: string;
  badge?: string;
}

const features: Feature[] = [
  { icon: Calendar, title: 'Samværsplan', desc: 'Planlæg samvær med fast 7/7, 10/4 eller fleksibel model. Altid overblik over hvem der har børnene.', color: '#f58a2d', bgFrom: '#fff7ed', bgTo: '#fff0de', badge: 'Populær' },
  { icon: CalendarHeart, title: 'Kalender', desc: 'Fælles familiekalender med begivenheder, aktiviteter og vigtige datoer for alle.', color: '#3b82f6', bgFrom: '#eff6ff', bgTo: '#dbeafe' },
  { icon: MessageCircle, title: 'Kommunikation', desc: 'Struktureret kommunikation mellem forældre. Tråde, beskeder og delt historik.', color: '#8b5cf6', bgFrom: '#f5f3ff', bgTo: '#ede9fe' },
  { icon: Wallet, title: 'Udgifter', desc: 'Del udgifter retfærdigt. Hold styr på budgetter, balancer og kvitteringer.', color: '#10b981', bgFrom: '#ecfdf5', bgTo: '#d1fae5' },
  { icon: CheckSquare, title: 'Opgaver', desc: 'Fordel og følg op på familiens opgaver. Se hvem der gør hvad og hvornår.', color: '#f43f5e', bgFrom: '#fff1f2', bgTo: '#ffe4e6' },
  { icon: UtensilsCrossed, title: 'Mad & Indkøb', desc: 'Madplan og indkøbslister. Se ugens bedste tilbud fra lokale butikker.', color: '#06b6d4', bgFrom: '#ecfeff', bgTo: '#cffafe' },
  { icon: FileText, title: 'Dokumenter', desc: 'Opbevar vigtige dokumenter sikkert. Altid tilgængelige for begge forældre.', color: '#6366f1', bgFrom: '#eef2ff', bgTo: '#e0e7ff' },
  { icon: Camera, title: 'Fotoalbum', desc: 'Del minder med familien. Organisér billeder i albums.', color: '#ec4899', bgFrom: '#fdf2f8', bgTo: '#fce7f3' },
  { icon: BookOpen, title: 'Dagbog', desc: 'Hold styr på hverdagen med noter og dagbogsindlæg.', color: '#f59e0b', bgFrom: '#fffbeb', bgTo: '#fef3c7' },
  { icon: Scale, title: 'Beslutningslog', desc: 'Dokumentér fælles beslutninger. Altid enighed om hvad der er aftalt.', color: '#14b8a6', bgFrom: '#f0fdfa', bgTo: '#ccfbf1' },
  { icon: Tag, title: 'Tilbud', desc: 'Se ugens bedste tilbud fra danske supermarkeder.', color: '#a855f7', bgFrom: '#faf5ff', bgTo: '#f3e8ff' },
  { icon: CalendarHeart, title: 'Vigtige Datoer', desc: 'Glem aldrig fødselsdage, lægebesøg og milepæle.', color: '#ef4444', bgFrom: '#fef2f2', bgTo: '#fee2e2' },
];

function FeatureCard({ f, index, visible }: { f: Feature; index: number; visible: boolean }) {
  return (
    <div
      className={`group relative p-6 rounded-2xl backdrop-blur-sm border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${visible ? 'animate-slideUp' : 'opacity-0'}`}
      style={{
        background: `linear-gradient(135deg, ${f.bgFrom} 0%, ${f.bgTo} 100%)`,
        borderColor: `${f.color}15`,
        borderTopWidth: '3px',
        borderTopColor: `${f.color}40`,
        animationDelay: `${index * 80}ms`,
        boxShadow: `0 1px 3px ${f.color}08`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 12px 32px ${f.color}15, 0 4px 8px ${f.color}10`;
        e.currentTarget.style.borderColor = `${f.color}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 1px 3px ${f.color}08`;
        e.currentTarget.style.borderColor = `${f.color}15`;
      }}
    >
      {/* Subtle glow */}
      <div
        className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full blur-[60px] opacity-30 pointer-events-none"
        style={{ background: f.color }}
      />

      <div className="relative">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${f.color}15` }}
        >
          <f.icon size={24} style={{ color: f.color }} />
        </div>

        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-[15px] font-bold text-[#2f2f2f]">{f.title}</h3>
          {f.badge && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{ background: `${f.color}15`, color: f.color }}
            >
              {f.badge}
            </span>
          )}
        </div>
        <p className="text-[13px] text-[#78766d] leading-relaxed">{f.desc}</p>
      </div>
    </div>
  );
}

function FeatureSection() {
  const { ref, visible } = useInView(0.1);

  const heroFeature = features[0];
  const primaryFeatures = features.slice(1, 6);
  const secondaryFeatures = features.slice(6);

  return (
    <section id="funktioner" className="py-24 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-[#f9f8f5] to-[#f2f1ed] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`text-center mb-16 ${visible ? 'animate-slideUp' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f58a2d]/8 text-[#e8773f] text-xs font-semibold mb-4">
            <Zap size={13} /> Alt-i-én platform
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-[800] text-[#2f2f2f] tracking-[-0.03em]">
            Alt hvad din familie har brug for
          </h2>
          <p className="mt-4 text-[#78766d] max-w-lg mx-auto text-[1.05rem] leading-relaxed">
            Fra samværsplan til dagligvarer — Huska samler alle familiens funktioner på ét sted.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Hero feature — spans 2 columns */}
          <div
            className={`md:col-span-2 group relative p-8 rounded-3xl backdrop-blur-sm border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${visible ? 'animate-slideUp' : 'opacity-0'}`}
            style={{
              background: `linear-gradient(135deg, ${heroFeature.bgFrom} 0%, ${heroFeature.bgTo} 100%)`,
              borderColor: `${heroFeature.color}20`,
              borderTopWidth: '3px',
              borderTopColor: `${heroFeature.color}50`,
              boxShadow: `0 4px 16px ${heroFeature.color}10`,
            }}
          >
            <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ background: heroFeature.color }} />

            <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `linear-gradient(135deg, #f7a95c, #e8773f)`, boxShadow: `0 8px 24px ${heroFeature.color}30` }}
              >
                <heroFeature.icon size={28} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <h3 className="text-xl font-bold text-[#2f2f2f]">{heroFeature.title}</h3>
                  <span className="px-2.5 py-1 rounded-full bg-[#f58a2d]/10 text-[#e8773f] text-[10px] font-bold uppercase tracking-wide">
                    {heroFeature.badge}
                  </span>
                </div>
                <p className="text-[#5f5d56] leading-relaxed max-w-xl text-[15px]">{heroFeature.desc}</p>
              </div>
            </div>
          </div>

          {/* First regular feature beside hero */}
          <FeatureCard f={primaryFeatures[0]} index={1} visible={visible} />
        </div>

        {/* Primary features — 3 column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {primaryFeatures.slice(1).map((f, i) => (
            <FeatureCard key={f.title} f={f} index={i + 2} visible={visible} />
          ))}
        </div>

        {/* Secondary features — compact grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {secondaryFeatures.map((f, i) => (
            <div
              key={f.title}
              className={`group text-center p-4 rounded-xl backdrop-blur-sm border transition-all duration-300 hover:-translate-y-1 ${visible ? 'animate-slideUp' : 'opacity-0'}`}
              style={{
                background: `linear-gradient(180deg, ${f.bgFrom} 0%, white 100%)`,
                borderColor: `${f.color}15`,
                animationDelay: `${(i + 7) * 80}ms`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 24px ${f.color}12`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2.5 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${f.color}12` }}
              >
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <p className="text-[13px] font-semibold text-[#2f2f2f]">{f.title}</p>
              <p className="text-[11px] text-[#9a978f] mt-0.5 leading-snug">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HOW IT WORKS — Enhanced with gradient path and stagger                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const steps = [
  { num: '1', title: 'Opret din familie', desc: 'Download appen og opret en familieprofil. Vælg jeres familiemodel — co-parenting, sammensat eller under samme tag.', icon: Users, color: '#3b82f6' },
  { num: '2', title: 'Invitér den anden forælder', desc: 'Send en invitation, så begge forældre kan se og opdatere fælles information i realtid.', icon: HandHeart, color: '#8b5cf6' },
  { num: '3', title: 'Koordinér hverdagen', desc: 'Brug samværsplan, kalender, opgaver og kommunikation til at skabe struktur og reducere konflikter.', icon: Sparkles, color: '#f58a2d' },
];

function HowItWorksSection() {
  const { ref, visible } = useInView();

  return (
    <section id="hvordan" className="py-24 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#f2f1ed] via-[#f7f6f2] to-white/50 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`text-center mb-16 ${visible ? 'animate-slideUp' : 'opacity-0'}`}>
          <h2 className="text-3xl sm:text-4xl font-[800] text-[#2f2f2f] tracking-[-0.03em]">
            Kom i gang på 3 trin
          </h2>
          <p className="mt-3 text-[#78766d] text-[1.05rem]">
            Det tager under 5 minutter at sætte op.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Gradient connecting line */}
          <div className="hidden md:block absolute top-[52px] left-[20%] right-[20%] h-[3px] rounded-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #f58a2d)' }} />

          {steps.map((s, i) => (
            <div
              key={s.num}
              className={`text-center relative ${visible ? 'animate-slideUp' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <div className="relative inline-block mb-5">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg relative z-10 transition-transform duration-300 hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${s.color}cc, ${s.color})`, boxShadow: `0 8px 24px ${s.color}30` }}
                >
                  <s.icon size={26} />
                </div>
                <div
                  className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center text-[11px] font-extrabold z-20"
                  style={{ borderColor: s.color, color: s.color }}
                >
                  {s.num}
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#2f2f2f]">{s.title}</h3>
              <p className="mt-2 text-[14px] text-[#78766d] max-w-[280px] mx-auto leading-relaxed">{s.desc}</p>
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
    <section className="py-20 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#fff7ed] via-white to-[#f2f1ed] pointer-events-none" />
      <div className="absolute top-[-100px] left-[-50px] w-[400px] h-[400px] rounded-full bg-[#f58a2d]/6 blur-[80px] pointer-events-none" style={{ animation: 'meshFloat 10s ease-in-out infinite' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className={visible ? 'animate-slideIn' : 'opacity-0'}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: '#f58a2d15', color: '#f58a2d' }}>
              <Calendar size={13} /> Samværsplan
            </div>
            <h3 className="text-2xl sm:text-3xl font-[800] text-[#2f2f2f] tracking-[-0.02em] leading-tight">
              Altid overblik over
              <span className="block" style={{ color: '#f58a2d' }}>hvem der har børnene</span>
            </h3>
            <p className="mt-4 text-[#5f5d56] leading-relaxed text-[1.05rem]">
              Vælg mellem 7/7, 10/4, 14/14 eller lav din helt egen model. Samværsplanen synkroniserer automatisk,
              så begge forældre altid kan se den aktuelle plan.
            </p>
            <ul className="mt-6 space-y-3">
              {['Fast eller fleksibel model', 'Automatisk synkronisering', 'Ferie- og helligdage inkluderet'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[14px] text-[#5f5d56]">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f58a2d15' }}>
                    <CheckSquare size={13} style={{ color: '#f58a2d' }} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={`flex justify-center ${visible ? 'animate-slideInRight' : 'opacity-0'}`}>
            <div className="relative w-[260px] h-[520px] bg-gradient-to-b from-[#fafafa] to-white rounded-[2.5rem] shadow-2xl shadow-black/10 border border-[#e0ded8] p-2.5">
              <div className="w-full h-full rounded-[2rem] overflow-hidden bg-[#f2f1ed] flex items-center justify-center">
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
    <section className="py-20 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#f5f3ff] via-white to-[#f2f1ed] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-50px] w-[400px] h-[400px] rounded-full bg-[#8b5cf6]/6 blur-[80px] pointer-events-none" style={{ animation: 'meshFloat 12s ease-in-out infinite reverse' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image first on md+ */}
          <div className={`flex justify-center order-2 md:order-1 ${visible ? 'animate-slideIn' : 'opacity-0'}`}>
            <div className="relative">
              {/* Chat bubbles mockup */}
              <div className="w-[300px] space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[220px] px-4 py-3 rounded-2xl rounded-tr-md text-[13px] text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                    Kan du hente Magnus kl. 15 i morgen?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[220px] px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-[#e5e3dc] text-[13px] text-[#2f2f2f] shadow-sm">
                    Selvfølgelig! Jeg henter ham fra SFO 👍
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[220px] px-4 py-3 rounded-2xl rounded-tr-md text-[13px] text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                    Perfekt, så opdaterer jeg kalenderen ✓
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[220px] px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-[#e5e3dc] text-[13px] text-[#2f2f2f] shadow-sm">
                    Super. Skal jeg tage madpakke med? 🥪
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`order-1 md:order-2 ${visible ? 'animate-slideInRight' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: '#8b5cf615', color: '#8b5cf6' }}>
              <MessageCircle size={13} /> Kommunikation
            </div>
            <h3 className="text-2xl sm:text-3xl font-[800] text-[#2f2f2f] tracking-[-0.02em] leading-tight">
              Struktureret dialog
              <span className="block" style={{ color: '#8b5cf6' }}>uden misforståelser</span>
            </h3>
            <p className="mt-4 text-[#5f5d56] leading-relaxed text-[1.05rem]">
              Hold al kommunikation samlet ét sted. Tråde og beskeder giver overblik og historik —
              perfekt til co-parenting hvor klarhed er alt.
            </p>
            <ul className="mt-6 space-y-3">
              {['Alt gemt som dokumentation', 'Tråde pr. emne', 'Push-notifikationer i realtid'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[14px] text-[#5f5d56]">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#8b5cf615' }}>
                    <CheckSquare size={13} style={{ color: '#8b5cf6' }} />
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
    <section className="py-20 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#f2f1ed] to-[#f7f6f2] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`text-center mb-12 ${visible ? 'animate-slideUp' : 'opacity-0'}`}>
          <h2 className="text-3xl sm:text-4xl font-[800] text-[#2f2f2f] tracking-[-0.03em]">
            Familier elsker Huska
          </h2>
          <p className="mt-3 text-[#78766d] text-[1.05rem]">
            Brugt af familier over hele Danmark
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`relative p-6 rounded-2xl backdrop-blur-xl bg-white/70 border border-white/40 shadow-lg shadow-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${visible ? 'animate-slideUp' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <Quote size={20} className="text-[#f58a2d]/30 mb-3" />

              <p className="text-[14px] text-[#5f5d56] leading-relaxed mb-4">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f58a2d] to-[#e8773f] flex items-center justify-center text-white text-[13px] font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#2f2f2f]">{t.name}</p>
                  <p className="text-[11px] text-[#9a978f]">{t.type}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={12} className="fill-[#f58a2d] text-[#f58a2d]" />
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

const proFeatures = [
  'Alt i Familie — gratis',
  'Professionelt dashboard',
  'Risikovurdering & referater',
  'Sagsbehandler-overblik',
  'Ubegrænsede sager',
  'Dedikeret support & onboarding',
];

const kommunePlans = [
  { size: 'Lille', borgere: '< 30.000', sager: '~50–150', pris: '60.000–80.000' },
  { size: 'Mellem', borgere: '30–60.000', sager: '~150–400', pris: '80.000–120.000' },
  { size: 'Stor', borgere: '> 60.000', sager: '400+', pris: '120.000–200.000' },
];

function PricingSection() {
  const { ref, visible } = useInView();

  return (
    <section id="priser" className="py-24 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#f7f6f2] via-white to-[#f2f1ed] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`text-center mb-16 ${visible ? 'animate-slideUp' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#10b981]/8 text-[#10b981] text-xs font-semibold mb-4">
            <Sparkles size={13} /> Enkel prismodel
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-[800] text-[#2f2f2f] tracking-[-0.03em]">
            Gratis for familier.
            <span className="block" style={{ color: '#f58a2d' }}>Professionel adgang for kommuner.</span>
          </h2>
          <p className="mt-4 text-[#78766d] max-w-lg mx-auto text-[1.05rem] leading-relaxed">
            Huska er gratis for alle familier. Kommuner og professionelle kan tilkøbe avancerede funktioner.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {/* Familie — Gratis */}
          <div
            className={`relative p-8 rounded-3xl backdrop-blur-sm bg-white/70 border border-white/40 shadow-lg shadow-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${visible ? 'animate-slideUp' : 'opacity-0'}`}
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#10b98115' }}>
                <Heart size={24} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2f2f2f]">Familie</h3>
                <p className="text-[12px] text-[#9a978f]">For alle familier</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-[800] text-[#2f2f2f]">Gratis</span>
              <span className="text-[#9a978f] text-sm ml-2">— for altid</span>
            </div>

            <ul className="space-y-3 mb-8">
              {familyFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[14px] text-[#5f5d56]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#10b98115' }}>
                    <Check size={12} style={{ color: '#10b981' }} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3.5 rounded-xl font-semibold text-[#10b981] bg-[#10b981]/8 hover:bg-[#10b981]/15 transition-colors duration-200"
            >
              Hent appen gratis
            </a>
          </div>

          {/* Kommune / Professionel */}
          <div
            className={`relative p-8 rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${visible ? 'animate-slideUp' : 'opacity-0'}`}
            style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #fff0de 100%)',
              borderColor: '#f58a2d30',
              borderTopWidth: '3px',
              borderTopColor: '#f58a2d60',
              animationDelay: '200ms',
              boxShadow: '0 8px 32px #f58a2d10',
            }}
          >
            {/* Popular badge */}
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 rounded-full bg-[#f58a2d]/10 text-[#e8773f] text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                <Crown size={11} /> Anbefalet
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #f7a95c, #e8773f)', boxShadow: '0 4px 16px #f58a2d30' }}>
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2f2f2f]">Kommune</h3>
                <p className="text-[12px] text-[#9a978f]">For professionelle</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-[800] text-[#2f2f2f]">Kr. 299</span>
              <span className="text-[#9a978f] text-sm ml-1">/md. pr. sagsbehandler</span>
            </div>

            <ul className="space-y-3 mb-8">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[14px] text-[#5f5d56]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f58a2d15' }}>
                    <Check size={12} style={{ color: '#f58a2d' }} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="mailto:kontakt@huska.dk?subject=Kommune-licens"
              className="block w-full text-center py-3.5 rounded-xl font-semibold text-white shadow-lg shadow-[#f58a2d]/25 hover:shadow-xl hover:shadow-[#f58a2d]/35 transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)' }}
            >
              Kontakt os for tilbud
            </a>
          </div>
        </div>

        {/* Kommune-licens tabel */}
        <div className={`max-w-3xl mx-auto ${visible ? 'animate-slideUp' : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-[#2f2f2f]">Kommune-licens (fast årspris)</h3>
            <p className="text-[14px] text-[#78766d] mt-1">Ubegrænsede sagsbehandlere og sager inkluderet. Familier bruger appen gratis.</p>
          </div>

          <div className="rounded-2xl backdrop-blur-xl bg-white/70 border border-white/40 shadow-lg shadow-black/[0.03] overflow-hidden">
            <div className="grid grid-cols-4 text-[12px] font-bold text-[#78766d] uppercase tracking-wider px-6 py-3 border-b border-[#e8e6df]/50 bg-[#f9f8f5]/50">
              <div>Størrelse</div>
              <div>Borgere</div>
              <div>Årlige sager</div>
              <div>Årspris</div>
            </div>
            {kommunePlans.map((p, i) => (
              <div
                key={p.size}
                className={`grid grid-cols-4 px-6 py-4 text-[14px] text-[#5f5d56] ${i < kommunePlans.length - 1 ? 'border-b border-[#e8e6df]/30' : ''} hover:bg-[#f58a2d]/3 transition-colors`}
              >
                <div className="font-semibold text-[#2f2f2f]">{p.size}</div>
                <div>{p.borgere}</div>
                <div>{p.sager}</div>
                <div className="font-semibold text-[#f58a2d]">Kr. {p.pris}/år</div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f58a2d]/8 text-[14px]">
              <Sparkles size={14} className="text-[#f58a2d]" />
              <span className="text-[#5f5d56]"><strong className="text-[#2f2f2f]">Pilot-tilbud:</strong> 3 måneders gratis prøveperiode for de første kommuner</span>
            </div>
          </div>
        </div>
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
    <section id="om-section" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#2f2f2f] to-[#1a1a1a]" />
      <div className="absolute top-[-100px] right-[-50px] w-[400px] h-[400px] rounded-full bg-[#f58a2d]/8 blur-[80px] pointer-events-none" style={{ animation: 'meshFloat 10s ease-in-out infinite' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className={visible ? 'animate-slideIn' : 'opacity-0'}>
            <h2 className="text-3xl sm:text-4xl font-[800] text-white leading-[1.1] tracking-[-0.03em]">
              Bygget til familier
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 60%, #ffb366 100%)' }}
              >
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
                <item.icon size={22} className="text-[#f58a2d] mb-3" />
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
    <section className="py-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative text-center rounded-[2rem] p-12 md:p-20 overflow-hidden ${visible ? 'animate-slideUp' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#fef3e7] via-[#fff0de] to-[#fde8d0]" />
          <div className="absolute top-[-80px] right-[-40px] w-[300px] h-[300px] rounded-full bg-[#f58a2d]/10 blur-[60px] pointer-events-none" style={{ animation: 'meshFloat 8s ease-in-out infinite' }} />
          <div className="absolute bottom-[-60px] left-[-30px] w-[250px] h-[250px] rounded-full bg-[#f58a2d]/8 blur-[50px] pointer-events-none" style={{ animation: 'meshFloat 10s ease-in-out infinite reverse' }} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-[#e8773f] text-xs font-bold mb-6 shadow-sm">
              <Sparkles size={14} /> Gratis at bruge
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-[#2f2f2f] tracking-[-0.03em]">
              Klar til at koordinere
              <br />
              <span style={{ color: '#f58a2d' }}>hverdagen?</span>
            </h2>
            <p className="mt-4 text-[#5f5d56] max-w-md mx-auto text-[1.05rem] leading-relaxed">
              Hent Huska gratis og kom i gang med at skabe mere struktur og mindre friktion i din families hverdag.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[15px] font-bold text-white rounded-full shadow-lg shadow-[#f58a2d]/30 hover:shadow-xl hover:shadow-[#f58a2d]/40 hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)' }}
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
