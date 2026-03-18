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
  { icon: BarChart3, title: 'Professionelt dashboard', desc: 'Fuldt overblik over alle sager med statistik og KPI\'er.' },
  { icon: FileText, title: 'Referater & dokumentation', desc: 'Automatisk referat-generering og struktureret sagshistorik.' },
  { icon: Shield, title: 'Risikovurdering', desc: 'Værktøjer til at identificere og dokumentere risikofaktorer.' },
  { icon: Users, title: 'Sagsbehandler-overblik', desc: 'Fordel og følg sager på tværs af teamet.' },
];

const kommunePlans = [
  { size: 'Lille', borgere: '< 30.000', sager: '~50–150', pris: '60.000–80.000' },
  { size: 'Mellem', borgere: '30–60.000', sager: '~150–400', pris: '80.000–120.000' },
  { size: 'Stor', borgere: '> 60.000', sager: '400+', pris: '120.000–200.000' },
];

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-[#f2f1ed]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#f58a2d]/10 blur-[80px]" style={{ animation: 'meshFloat 12s ease-in-out infinite' }} />
          <div className="absolute bottom-[-10%] left-[-8%] w-[400px] h-[400px] rounded-full bg-[#f7a95c]/8 blur-[60px]" style={{ animation: 'meshFloat 10s ease-in-out infinite reverse' }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f58a2d]/8 text-[#e8773f] text-xs font-semibold mb-6">
            <Building2 size={14} /> For kommuner & professionelle
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-[#2f2f2f] tracking-[-0.03em] leading-[1.1]">
            Professionelt værktøj til
            <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 40%, #e8773f 100%)' }}>
              kommuner og sagsbehandlere
            </span>
          </h1>

          <p className="mt-6 text-[1.1rem] text-[#5f5d56] max-w-2xl mx-auto leading-relaxed">
            Giv familier det bedste redskab til samarbejde — og giv sagsbehandlere et professionelt dashboard
            med overblik, referater og risikovurdering.
          </p>
        </div>
      </section>

      {/* Professional features */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#2f2f2f] text-center mb-10">Hvad er inkluderet?</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {proFeatures.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl backdrop-blur-sm bg-white/70 border border-white/40 shadow-lg shadow-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: '#f58a2d15' }}>
                  <f.icon size={22} style={{ color: '#f58a2d' }} />
                </div>
                <h3 className="text-[15px] font-bold text-[#2f2f2f] mb-1">{f.title}</h3>
                <p className="text-[13px] text-[#78766d] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-[14px] text-[#78766d] mt-8">
            Familier bruger appen <strong className="text-[#f58a2d]">gratis</strong> — finansieret af kommunen.
          </p>
        </div>
      </section>

      {/* Pricing options */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#2f2f2f] text-center mb-3">Prismodeller</h2>
          <p className="text-center text-[#78766d] mb-10">Vælg den model der passer til jeres behov.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Per-sagsbehandler */}
            <div className="p-7 rounded-2xl backdrop-blur-sm bg-white/70 border border-white/40 shadow-lg shadow-black/[0.03]">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-[#1a1a1a]" />
                <h3 className="text-[15px] font-bold text-[#2f2f2f]">Per sagsbehandler</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-[800] text-[#2f2f2f]">Kr. 299–499</span>
                <span className="text-[#9a978f] text-sm ml-1">/md. pr. sagsbehandler</span>
              </div>
              <p className="text-[13px] text-[#78766d] mb-4 leading-relaxed">
                Lav indgangsbarriere — perfekt til at teste platformen med et mindre team.
              </p>
              <ul className="space-y-2">
                {['Ingen binding', 'Start med 1 sagsbehandler', 'Skalér efter behov'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[13px] text-[#5f5d56]">
                    <Check size={12} className="text-[#1a1a1a] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Kommune-licens */}
            <div
              className="relative p-7 rounded-2xl border overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #fff7ed, #fff0de)',
                borderColor: '#f58a2d30',
                borderTopWidth: '3px',
                borderTopColor: '#f58a2d60',
                boxShadow: '0 8px 32px #f58a2d10',
              }}
            >
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 rounded-full bg-[#f58a2d]/10 text-[#e8773f] text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                  <Crown size={10} /> Anbefalet
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-[#f58a2d]" />
                <h3 className="text-[15px] font-bold text-[#2f2f2f]">Kommune-licens</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-[800] text-[#2f2f2f]">Fast årspris</span>
              </div>
              <p className="text-[13px] text-[#78766d] mb-4 leading-relaxed">
                Simpelt for kommunens budgettering — fast beløb, ingen overraskelser. Ubegrænsede sagsbehandlere og sager.
              </p>
              <ul className="space-y-2">
                {['Ubegrænsede brugere', 'Inkl. support & onboarding', 'Familier bruger appen gratis'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[13px] text-[#5f5d56]">
                    <Check size={12} className="text-[#f58a2d] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Kommune-licens tabel */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-[#2f2f2f] text-center mb-4">Kommune-licens priser</h3>

            <div className="rounded-2xl backdrop-blur-xl bg-white/70 border border-white/40 shadow-lg shadow-black/[0.03] overflow-hidden">
              <div className="grid grid-cols-4 text-[11px] font-bold text-[#78766d] uppercase tracking-wider px-5 py-3 border-b border-[#e8e6df]/50 bg-[#f9f8f5]/50">
                <div>Størrelse</div>
                <div>Borgere</div>
                <div>Årlige sager</div>
                <div>Årspris</div>
              </div>
              {kommunePlans.map((p, i) => (
                <div
                  key={p.size}
                  className={`grid grid-cols-4 px-5 py-3.5 text-[14px] text-[#5f5d56] ${i < kommunePlans.length - 1 ? 'border-b border-[#e8e6df]/30' : ''} hover:bg-[#f58a2d]/3 transition-colors`}
                >
                  <div className="font-semibold text-[#2f2f2f]">{p.size}</div>
                  <div>{p.borgere}</div>
                  <div>{p.sager}</div>
                  <div className="font-semibold text-[#f58a2d]">Kr. {p.pris}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pilot-tilbud */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative text-center rounded-[2rem] p-10 md:p-14 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #fef3e7, #fff0de, #fde8d0)' }}
          >
            <div className="absolute top-[-60px] right-[-30px] w-[250px] h-[250px] rounded-full bg-[#f58a2d]/10 blur-[50px] pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 text-[#e8773f] text-xs font-bold mb-5 shadow-sm">
                <Sparkles size={14} /> Pilot-tilbud
              </div>

              <h2 className="text-2xl sm:text-3xl font-[800] text-[#2f2f2f] tracking-[-0.02em]">
                3 måneders gratis pilot
              </h2>
              <p className="mt-4 text-[#5f5d56] max-w-lg mx-auto leading-relaxed">
                De første kommuner kan teste Huska gratis i 3 måneder. Formålet er at dokumentere
                effekten: reduceret sagsbehandlingstid og bedre forældresamarbejde.
              </p>
              <p className="mt-3 text-[14px] text-[#78766d]">
                Ved succes: overgang til årslicens med 20% rabat i år 1.
              </p>

              <a
                href="mailto:kontakt@huska.dk?subject=Pilot-tilbud%20for%20kommune"
                className="group inline-flex items-center justify-center gap-2.5 mt-8 px-8 py-4 text-[15px] font-bold text-white rounded-full shadow-lg shadow-[#f58a2d]/30 hover:shadow-xl hover:shadow-[#f58a2d]/40 hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #f7a95c 0%, #f58a2d 50%, #e8773f 100%)' }}
              >
                Kontakt os
                <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Back link */}
      <div className="text-center pb-16">
        <a href="#" className="text-[14px] text-[#78766d] hover:text-[#2f2f2f] transition-colors">
          ← Tilbage til forsiden
        </a>
      </div>
    </div>
  );
}
