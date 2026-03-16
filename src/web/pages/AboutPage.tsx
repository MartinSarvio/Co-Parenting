import { Heart, Users, Shield, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-24 pb-16 bg-[#fafaf9]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a] text-xs font-semibold mb-6">
            <Heart size={14} /> Om Huska
          </div>
          <h1 className="text-4xl sm:text-5xl font-[800] text-[#1a1a1a] tracking-[-0.03em] leading-[1.08]">
            Vi gør hverdagen lettere for danske familier
          </h1>
          <p className="mt-6 text-lg text-[#4a4a4a] max-w-2xl mx-auto leading-relaxed">
            Huska er skabt med én klar mission: at samle alt det vigtige ét sted — så familier kan fokusere på det der virkelig tæller.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
            {[
              { icon: Heart, title: 'Vores mission', desc: 'Mindre friktion i hverdagen giver mere tid til det der virkelig tæller: at være sammen med dem, man holder af.' },
              { icon: Users, title: 'For alle familier', desc: 'Co-parenting, sammensatte familier, under samme tag — Huska er designet til alle familietyper.' },
              { icon: Shield, title: 'Privatliv først', desc: 'Dine data er dine. Vi sælger aldrig personoplysninger, og alt opbevares sikkert i EU.' },
              { icon: Sparkles, title: 'Dansk kvalitet', desc: 'Bygget i Danmark, til danske familier. Med forståelse for dansk familiekultur og lovgivning.' },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-2xl bg-white border border-[#e5e3dc] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[#1a1a1a]/5">
                  <item.icon size={22} className="text-[#1a1a1a]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-2">{item.title}</h3>
                <p className="text-[14px] text-[#4a4a4a] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hvem står bag */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] text-center mb-3 tracking-[-0.02em]">Hvem står bag?</h2>
          <p className="text-center text-[#4a4a4a] mb-10 max-w-2xl mx-auto">
            Huska er grundlagt af <strong className="text-[#1a1a1a]">Martin Kristensen</strong> og <strong className="text-[#1a1a1a]">Frederik Hansen</strong>.
            Vi har selv oplevet, hvor svært det kan være at koordinere hverdagen i en familie — og
            vi savnede et enkelt, dansk værktøj der kunne samle samværsplan, kalender, kommunikation
            og udgifter på ét sted.
          </p>
          <p className="text-center text-[#4a4a4a] max-w-2xl mx-auto">
            Derfor byggede vi Huska: en app lavet af forældre, til forældre.
          </p>
        </div>
      </section>

      {/* Hvad er Huska */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] text-center mb-3 tracking-[-0.02em]">Hvad er Huska?</h2>
          <p className="text-center text-[#4a4a4a] mb-10 max-w-2xl mx-auto">
            Huska er en alt-i-én platform til familiekoordinering. Appen samler de vigtigste funktioner, som familier har brug for i hverdagen.
          </p>

          <div className="rounded-2xl border border-[#e5e3dc] overflow-hidden bg-white">
            {[
              { name: 'Samværsplan', desc: 'Planlæg samvær med faste eller fleksible modeller' },
              { name: 'Fælles kalender', desc: 'Alle begivenheder og vigtige datoer ét sted' },
              { name: 'Kommunikation', desc: 'Strukturerede beskeder og beskedtråde' },
              { name: 'Udgiftsdeling', desc: 'Hold styr på fælles udgifter og balancer' },
              { name: 'Opgaver', desc: 'Fordel og følg op på familiens to-dos' },
              { name: 'Mad & indkøb', desc: 'Madplaner og indkøbslister' },
              { name: 'Dokumenter & fotos', desc: 'Opbevar og del vigtige filer og minder' },
            ].map((item, i, arr) => (
              <div key={item.name} className={`px-6 py-4 flex items-center gap-4 ${i < arr.length - 1 ? 'border-b border-[#e5e3dc]/60' : ''} hover:bg-[#fafaf9] transition-colors`}>
                <span className="text-[14px] font-bold text-[#1a1a1a] w-40 shrink-0">{item.name}</span>
                <span className="text-[14px] text-[#4a4a4a]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For alle familietyper */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] text-center mb-3 tracking-[-0.02em]">For alle familietyper</h2>
          <p className="text-center text-[#4a4a4a] mb-10 max-w-2xl mx-auto">
            Huska er designet til at understøtte alle typer familier.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: 'Co-parenting', desc: 'Fast eller fleksibel samværsplan mellem to hjem. Fuld koordinering af børnenes hverdag.' },
              { title: 'Sammensatte familier', desc: 'Flere børn, flere kalendere, ét overblik. Håndtér kompleksiteten enkelt.' },
              { title: 'Under samme tag', desc: 'Fordel opgaver og udgifter i hverdagen. Hold styr på det hele sammen.' },
              { title: 'Professionelle', desc: 'Socialrådgivere og sagsbehandlere der støtter familier med professionelt overblik.' },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-2xl bg-white border border-[#e5e3dc]">
                <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-2">{item.title}</h3>
                <p className="text-[14px] text-[#4a4a4a] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-[#1a1a1a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-[800] text-white tracking-[-0.02em]">
            Har du spørgsmål?
          </h2>
          <p className="mt-4 text-white/60 max-w-lg mx-auto leading-relaxed">
            Vi vil meget gerne høre fra dig. Kontakt os på kontakt@huska.dk.
          </p>
          <a
            href="mailto:kontakt@huska.dk"
            className="group inline-flex items-center justify-center gap-2.5 mt-8 px-8 py-4 text-[15px] font-bold text-[#1a1a1a] bg-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            Kontakt os
          </a>
        </div>
      </section>
    </div>
  );
}
