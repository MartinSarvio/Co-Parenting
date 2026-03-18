import { useState } from 'react';
import {
  Building2,
  Check,
  Shield,
  BarChart3,
  FileText,
  Users,
  ArrowRight,
  Heart,
  Send,
} from 'lucide-react';

const proFeatures = [
  { icon: BarChart3, title: 'Professionelt dashboard', desc: 'Fuldt overblik over alle sager med statistik og KPI\'er.' },
  { icon: FileText, title: 'Referater & dokumentation', desc: 'Automatisk referat-generering og struktureret sagshistorik.' },
  { icon: Shield, title: 'Risikovurdering', desc: 'Værktøjer til at identificere og dokumentere risikofaktorer.' },
  { icon: Users, title: 'Sagsbehandler-overblik', desc: 'Fordel og følg sager på tværs af teamet.' },
];

export default function PartnerPage() {
  const [form, setForm] = useState({ name: '', email: '', organisation: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Partnerhenvendelse fra ${form.organisation || form.name}`);
    const body = encodeURIComponent(`Navn: ${form.name}\nOrganisation: ${form.organisation}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:kontakt@huska.dk?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#f2f1ed]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1a1a1a]/[0.02] blur-[80px]" style={{ animation: 'meshFloat 12s ease-in-out infinite' }} />
          <div className="absolute bottom-[-10%] left-[-8%] w-[400px] h-[400px] rounded-full bg-[#1a1a1a]/[0.015] blur-[60px]" style={{ animation: 'meshFloat 10s ease-in-out infinite reverse' }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a] text-xs font-semibold mb-6">
            <Building2 size={14} /> For kommuner & professionelle
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-[#2f2f2f] tracking-[-0.03em] leading-[1.1]">
            Professionelt værktøj til
            <span className="block text-[#2f2f2f]">
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
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[#1a1a1a]/[0.04]">
                  <f.icon size={22} className="text-[#1a1a1a]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#2f2f2f] mb-1">{f.title}</h3>
                <p className="text-[13px] text-[#78766d] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-[14px] text-[#78766d] mt-8">
            Familier bruger appen <strong className="text-[#2f2f2f]">gratis</strong> — finansieret af kommunen.
          </p>
        </div>
      </section>

      {/* Contact form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#2f2f2f] mb-3">Kontakt os</h2>
            <p className="text-[#78766d] text-[1.05rem]">
              Fortæl os om jeres behov — vi vender tilbage med en skræddersyet løsning.
            </p>
          </div>

          <div className="p-8 rounded-2xl backdrop-blur-sm bg-white/70 border border-white/40 shadow-lg shadow-black/[0.03]">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Heart size={28} className="text-[#2f2f2f] mb-4" />
                <p className="text-lg font-bold text-[#2f2f2f]">Tak for din henvendelse!</p>
                <p className="text-[14px] text-[#78766d] mt-2">Vi vender tilbage hurtigst muligt.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5f5d56] mb-1.5">Navn</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Dit navn"
                      className="w-full px-4 py-3 rounded-xl border border-[#e5e3dc] bg-white text-[14px] text-[#2f2f2f] placeholder:text-[#b5b3ab] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5f5d56] mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="din@email.dk"
                      className="w-full px-4 py-3 rounded-xl border border-[#e5e3dc] bg-white text-[14px] text-[#2f2f2f] placeholder:text-[#b5b3ab] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5f5d56] mb-1.5">Organisation</label>
                  <input
                    type="text"
                    value={form.organisation}
                    onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                    placeholder="Kommune, familieretshus, eller andet"
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e3dc] bg-white text-[14px] text-[#2f2f2f] placeholder:text-[#b5b3ab] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5f5d56] mb-1.5">Besked</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Fortæl os om jeres behov..."
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e3dc] bg-white text-[14px] text-[#2f2f2f] placeholder:text-[#b5b3ab] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]/20 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="group w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-[15px] font-bold text-white bg-[#1a1a1a] shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Send size={16} />
                  Send henvendelse
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-[13px] text-[#78766d] mt-6">
            Eller skriv direkte til <a href="mailto:kontakt@huska.dk" className="text-[#2f2f2f] font-medium hover:underline">kontakt@huska.dk</a>
          </p>
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
