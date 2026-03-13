import { motion } from 'framer-motion';
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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] right-[-150px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#f58a2d]/15 to-[#f7a95c]/5 blur-xl" />
        <div className="absolute bottom-[-150px] left-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#f58a2d]/8 to-transparent blur-xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-16 md:pb-28 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
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
                <Sparkles size={15} /> Freemium
              </span>
            </div>
          </motion.div>

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
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
          </motion.div>
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

const heroFeatures = [
  {
    icon: Calendar,
    title: 'Samværsplan',
    desc: 'Planlæg samvær med fast 7/7, 10/4 eller fleksibel model. Altid overblik over hvem der har børnene — ingen misforståelser.',
    color: 'from-[#fff4e6] to-[#ffe8cc]',
    iconBg: 'from-[#f7a95c] to-[#e8773f]',
    items: ['7/7 og 10/4 modeller', 'Fleksibel tilpasning', 'Delt kalendervisning'],
  },
  {
    icon: MessageCircle,
    title: 'Kalender & Kommunikation',
    desc: 'Fælles familiekalender kombineret med struktureret kommunikation. Tråde, beskeder og delt historik — alt på ét sted.',
    color: 'from-[#f0f4ff] to-[#e4ecff]',
    iconBg: 'from-[#6b8cff] to-[#4a6cf7]',
    items: ['Fælles begivenheder', 'Beskedtråde', 'Push-notifikationer'],
  },
  {
    icon: Wallet,
    title: 'Udgifter & Opgaver',
    desc: 'Del udgifter retfærdigt og fordel familiens opgaver. Hold styr på budgetter, balancer og hvem der gør hvad.',
    color: 'from-[#f0fdf4] to-[#dcfce7]',
    iconBg: 'from-[#4ade80] to-[#22c55e]',
    items: ['Delte budgetter', 'Opgavefordeling', 'Kvitteringssporing'],
  },
];

const gridFeatures = [
  { icon: UtensilsCrossed, title: 'Mad & Indkøb', desc: 'Madplan og indkøbslister med ugens bedste tilbud.' },
  { icon: FileText, title: 'Dokumenter', desc: 'Opbevar vigtige dokumenter sikkert og delt.' },
  { icon: Camera, title: 'Fotoalbum', desc: 'Del minder og organisér billeder i albums.' },
  { icon: BookOpen, title: 'Dagbog', desc: 'Noter og dagbogsindlæg med historik.' },
  { icon: CalendarHeart, title: 'Vigtige Datoer', desc: 'Fødselsdage, lægebesøg og milepæle.' },
  { icon: Scale, title: 'Beslutningslog', desc: 'Dokumentér fælles beslutninger.' },
  { icon: CheckSquare, title: 'Opgaver', desc: 'Fordel og følg op på familiens to-dos.' },
  { icon: Tag, title: 'Tilbud', desc: 'Ugens bedste tilbud fra danske butikker.' },
  { icon: Users, title: 'Familietyper', desc: 'Tilpasset co-parenting og sammensatte familier.' },
];

function FeatureSection() {
  return (
    <section id="funktioner" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-[#f9f8f5] to-[#f2f1ed] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f58a2d]/8 text-[#e8773f] text-xs font-semibold mb-4">
            <Zap size={13} /> Alt-i-én platform
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#2f2f2f] tracking-tight">
            Alt hvad din familie har brug for
          </h2>
          <p className="mt-4 text-[#78766d] max-w-lg mx-auto text-[1.05rem] leading-relaxed">
            Fra samværsplan til dagligvarer — Huska samler alle familiens funktioner på ét sted.
          </p>
        </motion.div>

        {/* Hero features — alternating large cards */}
        <div className="space-y-8 mb-20">
          {heroFeatures.map((feature, i) => {
            const isReversed = i % 2 !== 0;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: isReversed ? 60 : -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`rounded-3xl bg-gradient-to-br ${feature.color} p-8 md:p-12 overflow-hidden`}
              >
                <div className={`grid md:grid-cols-2 gap-8 items-center ${isReversed ? 'md:[direction:rtl]' : ''}`}>
                  <div className={isReversed ? 'md:[direction:ltr]' : ''}>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center shadow-lg mb-6`}>
                      <feature.icon size={26} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#2f2f2f] mb-3">{feature.title}</h3>
                    <p className="text-[#5f5d56] leading-relaxed text-[1.05rem] mb-6">{feature.desc}</p>
                    <ul className="space-y-2.5">
                      {feature.items.map((item) => (
                        <li key={item} className="flex items-center gap-2.5 text-[14px] text-[#4a4a4a]">
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${feature.iconBg} flex items-center justify-center shrink-0`}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`flex justify-center ${isReversed ? 'md:[direction:ltr]' : ''}`}>
                    <div className="relative w-48 h-48 md:w-56 md:h-56">
                      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.iconBg} opacity-10`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <feature.icon size={80} className="text-[#2f2f2f]/15" strokeWidth={1} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Compact grid — remaining features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gridFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="feature-card-hover group p-6 rounded-2xl bg-white/80 border border-[#e8e6df] cursor-default"
            >
              <div className="w-11 h-11 rounded-xl bg-[#f58a2d]/8 flex items-center justify-center mb-4 group-hover:bg-[#f58a2d]/15 transition-colors duration-200">
                <f.icon size={21} className="text-[#f58a2d]" />
              </div>
              <h3 className="text-[15px] font-bold text-[#2f2f2f]">{f.title}</h3>
              <p className="mt-1.5 text-[13px] text-[#78766d] leading-relaxed">{f.desc}</p>
            </motion.div>
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
  { icon: Zap, value: '12+', label: 'Funktioner' },
  { icon: Heart, value: 'Freemium', label: 'Gratis basisfunktioner' },
  { icon: Globe, value: 'Dansk', label: 'Bygget i DK' },
  { icon: Lock, value: 'Sikker', label: 'Krypteret data' },
];

function StatsSection() {
  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center p-5 rounded-2xl bg-white/60 border border-[#e8e6df]"
            >
              <s.icon size={22} className="mx-auto text-[#f58a2d] mb-3" />
              <p className="text-2xl font-extrabold text-[#2f2f2f] tracking-tight">{s.value}</p>
              <p className="text-[12px] text-[#9a978f] font-medium mt-0.5">{s.label}</p>
            </motion.div>
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
  return (
    <section id="hvordan" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#f2f1ed] via-[#f7f6f2] to-white/50 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2f2f2f] tracking-tight">
            Kom i gang på 3 trin
          </h2>
          <p className="mt-3 text-[#78766d] text-[1.05rem]">
            Det tager under 5 minutter at sætte op.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-[52px] left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-[#f58a2d]/20 via-[#f58a2d]/30 to-[#f58a2d]/20" />

          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              className="text-center relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
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
            </motion.div>
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
    <section id="om-section" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#2f2f2f] to-[#1a1a1a]" />
      <div className="absolute top-[-100px] right-[-50px] w-[400px] h-[400px] rounded-full bg-[#f58a2d]/8 blur-xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
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
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {familyTypes.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors duration-200"
              >
                <item.icon size={22} className="text-[#f58a2d] mb-3" />
                <p className="text-[14px] font-semibold text-white">{item.label}</p>
                <p className="text-[12px] text-white/50 mt-1">{item.desc}</p>
              </motion.div>
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
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative text-center rounded-[2rem] p-12 md:p-20 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#fef3e7] via-[#fff0de] to-[#fde8d0]" />
          <div className="absolute top-[-80px] right-[-40px] w-[300px] h-[300px] rounded-full bg-[#f58a2d]/10 blur-xl pointer-events-none" />
          <div className="absolute bottom-[-60px] left-[-30px] w-[250px] h-[250px] rounded-full bg-[#f58a2d]/8 blur-xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 text-[#e8773f] text-xs font-bold mb-6 shadow-sm">
              <Sparkles size={14} /> Kom i gang i dag
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2f2f2f] tracking-tight">
              Klar til at koordinere
              <br />
              <span style={{ color: '#f58a2d' }}>hverdagen?</span>
            </h2>
            <p className="mt-4 text-[#5f5d56] max-w-md mx-auto text-[1.05rem] leading-relaxed">
              Hent Huska og kom i gang med at skabe mere struktur og mindre friktion i din families hverdag.
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
        </motion.div>
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
      <StatsSection />
      <HowItWorksSection />
      <AboutSection />
      <CTASection />
    </>
  );
}
