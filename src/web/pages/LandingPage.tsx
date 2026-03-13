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
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HERO                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] right-[-150px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#f58a2d]/15 to-[#f7a95c]/5 blur-xl" />
        <div className="absolute bottom-[-150px] left-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#f58a2d]/8 to-transparent blur-xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-16 md:pb-28 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-[#f58a2d]/20 text-[#e8773f] text-xs font-semibold mb-8 shadow-sm">
              <Heart size={14} className="fill-[#f58a2d]/30" /> Lavet til familier i Danmark
            </div>

            <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem] font-extrabold text-[#2f2f2f] leading-[1.05] tracking-tight">
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

            <p className="mt-6 text-[1.1rem] text-[#5f5d56] max-w-[440px] leading-[1.7]">
              Én sandhedskilde for hele familien. Samværsplan, kalender,
              kommunikation, udgifter og meget mere — samlet i én app.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-semibold text-white rounded-full shadow-lg shadow-[#f58a2d]/25 hover:shadow-xl hover:shadow-[#f58a2d]/35 transition-shadow duration-200"
                style={{ background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)' }}
              >
                <Smartphone size={18} />
                Hent til iPhone
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="#funktioner"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-semibold text-[#2f2f2f] rounded-full border border-[#d8d7cf] bg-white/80 hover:bg-white hover:border-[#c5c3bc] transition-colors duration-200"
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
/*  FEATURES                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const features = [
  { icon: Calendar, title: 'Samværsplan', desc: 'Planlæg samvær med fast 7/7, 10/4 eller fleksibel model. Altid overblik over hvem der har børnene.', highlight: true },
  { icon: CalendarHeart, title: 'Kalender', desc: 'Fælles familiekalender med begivenheder, aktiviteter og vigtige datoer for alle.' },
  { icon: MessageCircle, title: 'Kommunikation', desc: 'Struktureret kommunikation mellem forældre. Tråde, beskeder og delt historik.' },
  { icon: CheckSquare, title: 'Opgaver', desc: 'Fordel og følg op på familiens opgaver. Se hvem der gør hvad og hvornår.' },
  { icon: UtensilsCrossed, title: 'Mad & Indkøb', desc: 'Madplan og indkøbslister. Se ugens bedste tilbud fra lokale butikker.' },
  { icon: Wallet, title: 'Udgifter', desc: 'Del udgifter retfærdigt. Hold styr på budgetter, balancer og kvitteringer.' },
  { icon: FileText, title: 'Dokumenter', desc: 'Opbevar vigtige dokumenter sikkert. Altid tilgængelige for begge forældre.' },
  { icon: Camera, title: 'Fotoalbum', desc: 'Del minder med familien. Organisér billeder i albums og del med den anden forælder.' },
  { icon: BookOpen, title: 'Dagbog', desc: 'Hold styr på hverdagen med noter og dagbogsindlæg. Se historik over tid.' },
  { icon: CalendarHeart, title: 'Vigtige Datoer', desc: 'Glem aldrig en vigtig dag. Fødselsdage, lægebesøg og andre milepæle.' },
  { icon: Scale, title: 'Beslutningslog', desc: 'Dokumentér fælles beslutninger. Altid enighed om hvad der er aftalt.' },
  { icon: Tag, title: 'Tilbud', desc: 'Se ugens bedste tilbud fra danske supermarkeder. Spar penge på dagligvarer.' },
];

function FeatureSection() {
  const highlight = features[0];
  const rest = features.slice(1);

  return (
    <section id="funktioner" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-[#f9f8f5] to-[#f2f1ed] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f58a2d]/8 text-[#e8773f] text-xs font-semibold mb-4">
            <Zap size={13} /> Alt-i-én platform
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#2f2f2f] tracking-tight">
            Alt hvad din familie har brug for
          </h2>
          <p className="mt-4 text-[#78766d] max-w-lg mx-auto text-[1.05rem] leading-relaxed">
            Fra samværsplan til dagligvarer — Huska samler alle familiens funktioner på ét sted.
          </p>
        </div>

        <div className="mb-8">
          <div className="group relative p-8 rounded-3xl border border-[#f58a2d]/20 bg-gradient-to-br from-white to-[#fff8f0] hover:shadow-lg hover:shadow-[#f58a2d]/8 transition-shadow duration-200 overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-[#f58a2d]/5 blur-xl pointer-events-none" />
            <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f7a95c] to-[#e8773f] flex items-center justify-center shadow-lg shadow-[#f58a2d]/20 shrink-0">
                <highlight.icon size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-[#2f2f2f]">{highlight.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#f58a2d]/10 text-[#e8773f] text-[10px] font-bold uppercase tracking-wide">Populær</span>
                </div>
                <p className="text-[#5f5d56] leading-relaxed max-w-xl">{highlight.desc}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl bg-white/80 border border-[#e8e6df] hover:border-[#f58a2d]/25 hover:shadow-md hover:shadow-[#f58a2d]/5 transition-shadow duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-[#f58a2d]/8 flex items-center justify-center mb-4 group-hover:bg-[#f58a2d]/12 transition-colors duration-200">
                <f.icon size={21} className="text-[#f58a2d]" />
              </div>
              <h3 className="text-[15px] font-bold text-[#2f2f2f]">{f.title}</h3>
              <p className="mt-1.5 text-[13px] text-[#78766d] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const stats = [
  { icon: Zap, value: '12+', label: 'Funktioner' },
  { icon: Heart, value: '100%', label: 'Gratis' },
  { icon: Globe, value: 'Dansk', label: 'Bygget i DK' },
  { icon: Lock, value: 'Sikker', label: 'Krypteret data' },
];

function StatsSection() {
  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-5 rounded-2xl bg-white/60 border border-[#e8e6df]">
              <s.icon size={22} className="mx-auto text-[#f58a2d] mb-3" />
              <p className="text-2xl font-extrabold text-[#2f2f2f] tracking-tight">{s.value}</p>
              <p className="text-[12px] text-[#9a978f] font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { num: '1', title: 'Opret din familie', desc: 'Download appen og opret en familieprofil. Vælg jeres familiemodel — co-parenting, sammensat eller under samme tag.', icon: Users },
  { num: '2', title: 'Invitér den anden forælder', desc: 'Send en invitation, så begge forældre kan se og opdatere fælles information i realtid.', icon: HandHeart },
  { num: '3', title: 'Koordinér hverdagen', desc: 'Brug samværsplan, kalender, opgaver og kommunikation til at skabe struktur og reducere konflikter.', icon: Sparkles },
];

function HowItWorksSection() {
  return (
    <section id="hvordan" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#f2f1ed] via-[#f7f6f2] to-white/50 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2f2f2f] tracking-tight">
            Kom i gang på 3 trin
          </h2>
          <p className="mt-3 text-[#78766d] text-[1.05rem]">
            Det tager under 5 minutter at sætte op.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-[52px] left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-[#f58a2d]/20 via-[#f58a2d]/30 to-[#f58a2d]/20" />

          {steps.map((s) => (
            <div key={s.num} className="text-center relative">
              <div className="relative inline-block mb-5">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-[#f58a2d]/20 relative z-10"
                  style={{ background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)' }}
                >
                  <s.icon size={26} />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border-2 border-[#f58a2d] flex items-center justify-center text-[11px] font-extrabold text-[#f58a2d] z-20">
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

const familyTypes = [
  { icon: HandHeart, label: 'Co-parenting', desc: 'Fast eller fleksibel samværsplan' },
  { icon: Baby, label: 'Sammensatte familier', desc: 'Flere børn, flere kalendere' },
  { icon: Home, label: 'Under samme tag', desc: 'Fordel opgaver og udgifter' },
  { icon: Briefcase, label: 'Professionelle', desc: 'Socialrådgivere og sagsbehandlere' },
];

function AboutSection() {
  return (
    <section id="om" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#2f2f2f] to-[#1a1a1a]" />
      <div className="absolute top-[-100px] right-[-50px] w-[400px] h-[400px] rounded-full bg-[#f58a2d]/8 blur-xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-[1.1] tracking-tight">
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

          <div className="grid grid-cols-2 gap-4">
            {familyTypes.map((item) => (
              <div
                key={item.label}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors duration-200"
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

function CTASection() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative text-center rounded-[2rem] p-12 md:p-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fef3e7] via-[#fff0de] to-[#fde8d0]" />
          <div className="absolute top-[-80px] right-[-40px] w-[300px] h-[300px] rounded-full bg-[#f58a2d]/10 blur-xl pointer-events-none" />
          <div className="absolute bottom-[-60px] left-[-30px] w-[250px] h-[250px] rounded-full bg-[#f58a2d]/8 blur-xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 text-[#e8773f] text-xs font-bold mb-6 shadow-sm">
              <Sparkles size={14} /> Gratis at bruge
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2f2f2f] tracking-tight">
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
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[15px] font-bold text-white rounded-full shadow-lg shadow-[#f58a2d]/30 hover:shadow-xl hover:shadow-[#f58a2d]/40 transition-shadow duration-200"
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

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeatureSection />
      <StatsSection />
      <HowItWorksSection />
      <AboutSection />
      <CTASection />
    </>
  );
}
