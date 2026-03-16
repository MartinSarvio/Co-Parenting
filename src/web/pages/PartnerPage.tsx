import {
  Building2,
  Check,
  Shield,
  BarChart3,
  FileText,
  Users,
  Sparkles,
  ArrowRight,
  Clock,
  Crown,
} from 'lucide-react';

const proFeatures = [
  { icon: BarChart3, title: 'Professionelt dashboard', desc: 'Fuldt overblik over alle sager med statistik og KPI\'er. Se sagsstatus, fordelinger og tendenser i realtid.' },
  { icon: FileText, title: 'Referater & dokumentation', desc: 'Automatisk referat-generering og struktureret sagshistorik. Alt dokumenteret med tidsstempler.' },
  { icon: Shield, title: 'Risikovurdering', desc: 'Værktøjer til at identificere og dokumentere risikofaktorer tidligt i forløbet.' },
  { icon: Users, title: 'Sagsbehandler-overblik', desc: 'Fordel og følg sager på tværs af teamet. Se arbejdsbelastning og status pr. medarbejder.' },
];

const kommunePlans = [
  { size: 'Lille', borgere: '< 30.000', sager: '~50–150', pris: '60.000–80.000' },
  { size: 'Mellem', borgere: '30–60.000', sager: '~150–400', pris: '80.000–120.000' },
  { size: 'Stor', borgere: '> 60.000', sager: '400+', pris: '120.000–200.000' },
];

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20 bg-[#fafaf9]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#1a1a1a]/5 blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a] text-xs font-semibold mb-6">
            <Building2 size={14} /> For kommuner & professionelle
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-[800] text-[#1a1a1a] tracking-[-0.03em] leading-[1.08]">
            Professionelt værktøj til kommuner og sagsbehandlere
          </h1>

          <p className="mt-6 text-lg text-[#4a4a4a] max-w-2xl mx-auto leading-relaxed">
            Giv familier det bedste redskab til samarbejde — og giv sagsbehandlere et professionelt dashboard
            med overblik, referater og risikovurdering.
          </p>
        </div>
      </section>

      {/* Professional features */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] text-center mb-3 tracking-[-0.02em]">Hvad er inkluderet?</h2>
          <p className="text-center text-[#4a4a4a] mb-12">Alt hvad kommunen har brug for til effektiv sagsbehandling.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {proFeatures.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-white border border-[#e5e3dc] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[#1a1a1a]/5">
                  <f.icon size={22} className="text-[#1a1a1a]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-2">{f.title}</h3>
                <p className="text-[14px] text-[#4a4a4a] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-[14px] text-[#4a4a4a] mt-10">
            Familier bruger appen <strong className="text-[#1a1a1a]">gratis</strong> — finansieret af kommunen.
          </p>
        </div>
      </section>

      {/* Pricing options */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] text-center mb-3 tracking-[-0.02em]">Prismodeller</h2>
          <p className="text-center text-[#4a4a4a] mb-12">Vælg den model der passer til jeres behov og budget.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* Per-sagsbehandler */}
            <div className="p-7 rounded-2xl bg-white border border-[#e5e3dc]">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-[#1a1a1a]" />
                <h3 className="text-[15px] font-bold text-[#1a1a1a]">Per sagsbehandler</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-[800] text-[#1a1a1a]">Kr. 299–499</span>
                <span className="text-[#78766d] text-sm ml-1">/md. pr. sagsbehandler</span>
              </div>
              <p className="text-[14px] text-[#4a4a4a] mb-5 leading-relaxed">
                Lav indgangsbarriere — perfekt til at teste platformen med et mindre team.
              </p>
              <ul className="space-y-3">
                {['Ingen binding', 'Start med 1 sagsbehandler', 'Skalér efter behov'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[14px] text-[#1a1a1a]">
                    <Check size={16} className="text-[#1a1a1a] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Kommune-licens */}
            <div className="relative p-7 rounded-2xl bg-white border-2 border-[#1a1a1a] overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 rounded-full bg-[#1a1a1a] text-white text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                  <Crown size={10} /> Anbefalet
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-[#1a1a1a]" />
                <h3 className="text-[15px] font-bold text-[#1a1a1a]">Kommune-licens</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-[800] text-[#1a1a1a]">Fast årspris</span>
              </div>
              <p className="text-[14px] text-[#4a4a4a] mb-5 leading-relaxed">
                Simpelt for kommunens budgettering — fast beløb, ingen overraskelser. Ubegrænsede sagsbehandlere og sager.
              </p>
              <ul className="space-y-3">
                {['Ubegrænsede brugere', 'Inkl. support & onboarding', 'Familier bruger appen gratis'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[14px] text-[#1a1a1a]">
                    <Check size={16} className="text-[#1a1a1a] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Kommune-licens tabel */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-[#1a1a1a] text-center mb-6">Kommune-licens priser</h3>

            <div className="rounded-2xl border border-[#e5e3dc] overflow-hidden bg-white">
              <div className="grid grid-cols-4 text-[12px] font-bold text-[#78766d] uppercase tracking-wider px-6 py-4 border-b border-[#e5e3dc] bg-[#fafaf9]">
                <div>Størrelse</div>
                <div>Borgere</div>
                <div>Årlige sager</div>
                <div>Årspris</div>
              </div>
              {kommunePlans.map((p, i) => (
                <div
                  key={p.size}
                  className={`grid grid-cols-4 px-6 py-4 text-[14px] ${i < kommunePlans.length - 1 ? 'border-b border-[#e5e3dc]/60' : ''} hover:bg-[#fafaf9] transition-colors`}
                >
                  <div className="font-semibold text-[#1a1a1a]">{p.size}</div>
                  <div className="text-[#4a4a4a]">{p.borgere}</div>
                  <div className="text-[#4a4a4a]">{p.sager}</div>
                  <div className="font-bold text-[#1a1a1a]">Kr. {p.pris}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pilot-tilbud */}
      <section className="py-20 bg-[#1a1a1a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold mb-6">
            <Sparkles size={14} /> Pilot-tilbud
          </div>

          <h2 className="text-2xl sm:text-3xl font-[800] text-white tracking-[-0.02em]">
            3 måneders gratis pilot
          </h2>
          <p className="mt-4 text-white/60 max-w-lg mx-auto leading-relaxed">
            De første kommuner kan teste Huska gratis i 3 måneder. Formålet er at dokumentere
            effekten: reduceret sagsbehandlingstid og bedre forældresamarbejde.
          </p>
          <p className="mt-3 text-[14px] text-white/40">
            Ved succes: overgang til årslicens med 20% rabat i år 1.
          </p>

          <a
            href="mailto:kontakt@huska.dk?subject=Pilot-tilbud%20for%20kommune"
            className="group inline-flex items-center justify-center gap-2.5 mt-8 px-8 py-4 text-[15px] font-bold text-[#1a1a1a] bg-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            Kontakt os
            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>
    </div>
  );
}
