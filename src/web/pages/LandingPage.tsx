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
  Smartphone,
  Sparkles,
  Shield,
  Globe,
  Lock,
  Zap,
  HandHeart,
  Baby,
  Home,
  Briefcase,
  Mail,
  MapPin,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  HERO                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function HeroSection() {
  return (
    <section className="pt-10 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[2rem] bg-[#f5f5f5] p-8 md:p-12 lg:p-16">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Text */}
            <div className="animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[13px] font-medium text-[#4a4a4a] shadow-xs mb-8">
                <Sparkles size={14} className="text-[#f58a2d]" />
                Alt-i-én familiapp
              </div>

              <h1 className="font-display text-[2.75rem] sm:text-[3.25rem] lg:text-[4rem] text-[#1a1a1a] leading-[1.05] tracking-tight">
                Koordinér
                <br />
                hverdagen med
                <br />
                <span className="text-[#f58a2d]">din familie</span>
              </h1>

              <p className="mt-6 text-[1.05rem] text-[#6b7280] max-w-[440px] leading-[1.7]">
                Én app for hele familien. Samværsplan, kalender, kommunikation,
                udgifter og meget mere — samlet ét sted.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-semibold text-white bg-[#1a1a1a] rounded-full hover:bg-[#333] transition-colors duration-200"
                >
                  <Smartphone size={18} />
                  Hent til iPhone
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a
                  href="#funktioner"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-semibold text-[#1a1a1a] rounded-full border border-[#d1d5db] hover:border-[#9ca3af] transition-colors duration-200"
                >
                  Se funktioner
                </a>
              </div>

              <div className="mt-8 flex items-center gap-5 text-[13px] text-[#9ca3af]">
                <span className="flex items-center gap-1.5"><Shield size={14} /> Sikker</span>
                <span className="flex items-center gap-1.5"><Globe size={14} /> Dansk</span>
                <span className="flex items-center gap-1.5"><Zap size={14} /> Gratis</span>
              </div>
            </div>

            {/* Right — Phone mockup */}
            <div className="flex justify-center animate-fadeIn" style={{ animationDelay: '0.15s' }}>
              <div className="relative">
                {/* Phone frame */}
                <div className="relative w-[280px] sm:w-[300px] h-[570px] sm:h-[612px] bg-[#1a1a1a] rounded-[3rem] p-[10px] shadow-2xl shadow-black/20">
                  {/* Notch */}
                  <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-[#1a1a1a] rounded-b-2xl z-20" />
                  {/* Screen */}
                  <div className="w-full h-full rounded-[2.3rem] overflow-hidden bg-white">
                    <img
                      src="/app-screenshot.png"
                      alt="Huska app — Samværsplan"
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback if screenshot doesn't exist yet
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        target.parentElement!.classList.add('bg-gradient-to-br', 'from-[#f58a2d]', 'to-[#e8773f]', 'flex', 'items-center', 'justify-center');
                        target.parentElement!.innerHTML = '<div class="text-center"><img src="/huska-logo.svg" alt="Huska" class="w-20 h-20 rounded-2xl shadow-lg mx-auto mb-4" /><p class="text-white text-xl font-bold">Huska</p><p class="text-white/70 text-sm mt-1">Husk alt det vigtige</p></div>';
                      }}
                    />
                  </div>
                </div>

                {/* Floating badge */}
                <div className="hidden md:flex absolute -bottom-4 -left-8 glass rounded-2xl px-4 py-3 shadow-glass items-center gap-3 animate-float">
                  <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                    <Calendar size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1a1a1a]">12+ funktioner</p>
                    <p className="text-[11px] text-[#9ca3af]">Samlet i én app</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TRUST BAR                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const trustItems = [
  { icon: HandHeart, label: 'Co-parenting' },
  { icon: Baby, label: 'Sammensatte familier' },
  { icon: Home, label: 'Under samme tag' },
  { icon: Briefcase, label: 'Professionelle' },
];

function TrustBar() {
  return (
    <section className="py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[12px] text-[#b0b0b0] font-medium uppercase tracking-[0.15em] mb-8">
          Designet til alle familietyper
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-[#b0b0b0] hover:text-[#6b7280] transition-colors">
              <item.icon size={20} strokeWidth={1.5} />
              <span className="text-[14px] font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FEATURES                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const heroFeatures = [
  {
    icon: Calendar,
    title: 'Samværsplan',
    desc: 'Planlæg samvær med fast 7/7, 10/4 eller fleksibel model. Altid overblik over hvem der har børnene — med ugevisning, skiftedetaljer og ferieplanlægning.',
    visual: [
      { label: '7/7', sub: 'En uge hos hver' },
      { label: '10/4', sub: '10 dage / 4 dage' },
      { label: 'Tilpasset', sub: 'Din egen plan' },
    ],
    accent: 'from-[#fff7ed] to-[#fff1e0]',
    iconBg: 'bg-[#f58a2d]',
  },
  {
    icon: MessageCircle,
    title: 'Kalender & Kommunikation',
    desc: 'Fælles familiekalender med begivenheder og aktiviteter. Struktureret kommunikation mellem forældre med tråde, beskeder og delt historik.',
    visual: [
      { label: 'Kalender', sub: 'Fælles overblik' },
      { label: 'Beskeder', sub: 'Tråde & historik' },
      { label: 'Deling', sub: 'Real-time sync' },
    ],
    accent: 'from-[#eff6ff] to-[#e0edff]',
    iconBg: 'bg-[#3b82f6]',
  },
  {
    icon: Wallet,
    title: 'Udgifter & Opgaver',
    desc: 'Del udgifter retfærdigt og hold styr på budgetter. Fordel og følg op på familiens opgaver — se hvem der gør hvad og hvornår.',
    visual: [
      { label: 'Budget', sub: 'Balancer & deling' },
      { label: 'Opgaver', sub: 'Fordel ansvar' },
      { label: 'Historik', sub: 'Fuld oversigt' },
    ],
    accent: 'from-[#f0fdf4] to-[#dcfce7]',
    iconBg: 'bg-[#22c55e]',
  },
];

const moreFeatures = [
  { icon: UtensilsCrossed, title: 'Mad & Indkøb', desc: 'Madplan, indkøbslister og ugens bedste tilbud.' },
  { icon: FileText, title: 'Dokumenter', desc: 'Opbevar vigtige dokumenter sikkert og tilgængeligt.' },
  { icon: Camera, title: 'Fotoalbum', desc: 'Del minder og organisér billeder i albums.' },
  { icon: BookOpen, title: 'Dagbog', desc: 'Noter og dagbogsindlæg med historik over tid.' },
  { icon: CalendarHeart, title: 'Vigtige Datoer', desc: 'Fødselsdage, lægebesøg og milepæle.' },
  { icon: Scale, title: 'Beslutningslog', desc: 'Dokumentér fælles beslutninger og aftaler.' },
  { icon: Tag, title: 'Tilbud', desc: 'Ugens bedste tilbud fra danske supermarkeder.' },
  { icon: CheckSquare, title: 'Rutiner', desc: 'Spor daglige rutiner for morgen, dag og aften.' },
  { icon: Users, title: 'Overleveringer', desc: 'Strukturerede overleveringer mellem forældre.' },
];

function FeatureSection() {
  return (
    <section id="funktioner" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-[12px] text-[#f58a2d] font-semibold uppercase tracking-[0.15em] mb-3">Funktioner</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] text-[#1a1a1a] tracking-tight">
            Alt hvad din familie har brug for
          </h2>
          <p className="mt-4 text-[#6b7280] max-w-lg mx-auto text-[1.05rem] leading-relaxed">
            Fra samværsplan til dagligvarer — Huska samler alle familiens funktioner på ét sted.
          </p>
        </div>

        {/* Hero features — alternating large cards */}
        <div className="space-y-6 mb-12">
          {heroFeatures.map((f, idx) => (
            <div
              key={f.title}
              className={`rounded-[1.5rem] bg-gradient-to-br ${f.accent} p-8 md:p-10`}
            >
              <div className={`grid md:grid-cols-2 gap-8 items-center ${idx % 2 === 1 ? 'md:direction-rtl' : ''}`}>
                {/* Text side */}
                <div className={idx % 2 === 1 ? 'md:order-2' : ''}>
                  <div className={`w-12 h-12 rounded-2xl ${f.iconBg} flex items-center justify-center mb-5`}>
                    <f.icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-display text-2xl text-[#1a1a1a] mb-3">{f.title}</h3>
                  <p className="text-[15px] text-[#6b7280] leading-relaxed max-w-md">{f.desc}</p>
                </div>
                {/* Visual side */}
                <div className={`flex gap-3 ${idx % 2 === 1 ? 'md:order-1' : ''}`}>
                  {f.visual.map((v) => (
                    <div key={v.label} className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-white/80">
                      <p className="text-[15px] font-bold text-[#1a1a1a]">{v.label}</p>
                      <p className="text-[12px] text-[#9ca3af] mt-1">{v.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* More features — compact grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moreFeatures.map((f) => (
            <div
              key={f.title}
              className="group flex items-start gap-4 p-5 rounded-xl bg-white border border-[#ebebeb] hover:shadow-md hover:border-[#d1d5db] transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0 group-hover:bg-[#ebebeb] transition-colors">
                <f.icon size={18} className="text-[#f58a2d]" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#1a1a1a]">{f.title}</h4>
                <p className="text-[13px] text-[#9ca3af] mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  STATS                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const stats = [
  { value: '12+', label: 'Funktioner', icon: Zap },
  { value: '100%', label: 'Gratis', icon: Sparkles },
  { value: 'Dansk', label: 'Bygget i DK', icon: Globe },
  { value: 'Sikker', label: 'Krypteret data', icon: Lock },
];

function StatsSection() {
  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[1.5rem] bg-[#1a1a1a] px-8 py-12 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon size={22} className="mx-auto text-[#f58a2d] mb-3" />
                <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">{s.value}</p>
                <p className="text-[13px] text-white/50 font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
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
  return (
    <section id="hvordan" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[12px] text-[#f58a2d] font-semibold uppercase tracking-[0.15em] mb-3">Kom i gang</p>
          <h2 className="font-display text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight">
            3 nemme trin
          </h2>
          <p className="mt-3 text-[#6b7280] text-[1.05rem]">
            Det tager under 5 minutter at sætte op.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div key={s.num} className="bg-white rounded-2xl border border-[#ebebeb] p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-5">
                <span className="text-white text-lg font-bold">{s.num}</span>
              </div>
              <h3 className="text-[17px] font-bold text-[#1a1a1a]">{s.title}</h3>
              <p className="mt-2 text-[14px] text-[#9ca3af] leading-relaxed">{s.desc}</p>
            </div>
          ))}
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
  return (
    <section id="om" className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[1.5rem] bg-[#f5f5f5] p-8 md:p-12 lg:p-16">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {/* Text */}
            <div>
              <p className="text-[12px] text-[#f58a2d] font-semibold uppercase tracking-[0.15em] mb-3">Om Huska</p>
              <h2 className="font-display text-3xl sm:text-[2.5rem] text-[#1a1a1a] leading-[1.1] tracking-tight">
                Bygget til familier i Danmark
              </h2>
              <p className="mt-5 text-[#6b7280] leading-relaxed text-[15px]">
                Huska er skabt med én mission: at gøre hverdagen lettere for danske familier.
                Uanset om I er samboende, co-parenting eller en sammensat familie, fortjener I
                et redskab der samler alt ét sted — uden forvirring og med fuld gennemsigtighed.
              </p>
              <p className="mt-4 text-[#6b7280] leading-relaxed text-[15px]">
                Vi tror på, at mindre friktion i hverdagen giver mere tid til det der virkelig tæller:
                at være sammen med dem, man holder af.
              </p>

              <div className="mt-8 p-5 rounded-xl bg-white border border-[#ebebeb]">
                <h3 className="text-[14px] font-bold text-[#1a1a1a] mb-2">Vores vision</h3>
                <p className="text-[13px] text-[#9ca3af] leading-relaxed">
                  At blive Danmarks foretrukne platform for familiekoordinering — hvor alle familier,
                  uanset struktur, kan finde overblik, ro og samarbejde i hverdagen.
                </p>
              </div>
            </div>

            {/* Family type cards */}
            <div className="grid grid-cols-2 gap-4">
              {familyTypes.map((item) => (
                <div
                  key={item.label}
                  className="p-5 rounded-xl bg-white border border-[#ebebeb] hover:shadow-sm transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center mb-3">
                    <item.icon size={20} className="text-[#f58a2d]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#1a1a1a]">{item.label}</p>
                  <p className="text-[12px] text-[#9ca3af] mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CONTACT                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ContactSection() {
  return (
    <section id="kontakt" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[12px] text-[#f58a2d] font-semibold uppercase tracking-[0.15em] mb-3">Kontakt</p>
          <h2 className="font-display text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight">
            Har du spørgsmål?
          </h2>
          <p className="mt-3 text-[#6b7280] text-[1.05rem]">
            Vi hører gerne fra dig. Skriv til os, og vi vender tilbage hurtigst muligt.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#f5f5f5]">
              <Mail size={20} className="text-[#f58a2d] shrink-0" />
              <div>
                <p className="text-[12px] text-[#9ca3af] font-medium">Email</p>
                <p className="text-[14px] font-semibold text-[#1a1a1a]">kontakt@huska.dk</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#f5f5f5]">
              <MapPin size={20} className="text-[#f58a2d] shrink-0" />
              <div>
                <p className="text-[12px] text-[#9ca3af] font-medium">Lokation</p>
                <p className="text-[14px] font-semibold text-[#1a1a1a]">Danmark</p>
              </div>
            </div>
          </div>

          <a
            href="mailto:kontakt@huska.dk"
            className="group flex items-center justify-center gap-2 w-full px-6 py-3.5 text-[15px] font-semibold text-white bg-[#1a1a1a] rounded-full hover:bg-[#333] transition-colors"
          >
            <Mail size={18} />
            Send os en email
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CTA                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CTASection() {
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[1.5rem] bg-[#1a1a1a] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
              Klar til at koordinere
              <br />
              hverdagen?
            </h2>
            <p className="mt-5 text-white/50 max-w-md mx-auto text-[1.05rem] leading-relaxed">
              Hent Huska gratis og kom i gang med at skabe mere struktur
              og mindre friktion i din families hverdag.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[15px] font-bold text-[#1a1a1a] bg-white rounded-full hover:bg-[#f0f0f0] transition-colors duration-200"
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
      <TrustBar />
      <FeatureSection />
      <StatsSection />
      <HowItWorksSection />
      <AboutSection />
      <ContactSection />
      <CTASection />
    </>
  );
}
