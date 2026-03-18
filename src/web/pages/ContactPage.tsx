import { Mail, MapPin, MessageCircle, HelpCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-24 pb-16 bg-[#fafaf9]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a] text-xs font-semibold mb-6">
            <Mail size={14} /> Kontakt
          </div>
          <h1 className="text-4xl sm:text-5xl font-[800] text-[#1a1a1a] tracking-[-0.03em] leading-[1.08]">
            Vi er her for at hjælpe
          </h1>
          <p className="mt-6 text-lg text-[#4a4a4a] max-w-2xl mx-auto leading-relaxed">
            Har du spørgsmål, feedback eller brug for hjælp? Vi er altid klar til at høre fra dig.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: Mail, title: 'E-mail', desc: 'kontakt@huska.dk', href: 'mailto:kontakt@huska.dk', linkText: 'Send e-mail' },
              { icon: MapPin, title: 'Lokation', desc: 'Danmark', href: undefined, linkText: undefined },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-2xl bg-white border border-[#e5e3dc] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="w-11 h-11 rounded-xl bg-[#1a1a1a]/5 flex items-center justify-center mb-4">
                  <item.icon size={21} className="text-[#1a1a1a]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-1">{item.title}</h3>
                {item.href ? (
                  <a href={item.href} className="text-[14px] text-[#1a1a1a] underline underline-offset-2 hover:no-underline">
                    {item.desc}
                  </a>
                ) : (
                  <p className="text-[14px] text-[#4a4a4a]">{item.desc}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info sections */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="p-7 rounded-2xl bg-white border border-[#e5e3dc]">
              <div className="w-11 h-11 rounded-xl bg-[#1a1a1a]/5 flex items-center justify-center mb-4">
                <HelpCircle size={21} className="text-[#1a1a1a]" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-2">Support</h3>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Oplever du tekniske problemer med appen, eller har du brug for hjælp til at komme i gang?
                Send os en e-mail på{' '}
                <a href="mailto:kontakt@huska.dk" className="text-[#1a1a1a] underline underline-offset-2 hover:no-underline">kontakt@huska.dk</a>,
                så vender vi tilbage hurtigst muligt.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-[#e5e3dc]">
              <div className="w-11 h-11 rounded-xl bg-[#1a1a1a]/5 flex items-center justify-center mb-4">
                <MessageCircle size={21} className="text-[#1a1a1a]" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-2">Feedback</h3>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Vi er altid interesserede i at høre, hvordan vi kan gøre Huska bedre.
                Har du idéer til nye funktioner eller forbedringer? Del dem gerne med os —
                din feedback er med til at forme appen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hvem står bag */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] mb-3 tracking-[-0.02em]">Hvem står bag?</h2>
          <p className="text-[#4a4a4a] max-w-2xl mx-auto leading-relaxed">
            Huska er grundlagt af <strong className="text-[#1a1a1a]">Martin Kristensen</strong> og <strong className="text-[#1a1a1a]">Frederik Hansen</strong>.
            Vi bygger Huska for at gøre hverdagen lettere for danske familier.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#1a1a1a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-[800] text-white tracking-[-0.02em]">
            Klar til at komme i gang?
          </h2>
          <p className="mt-4 text-white/60 max-w-lg mx-auto leading-relaxed">
            Download Huska og begynd at koordinere jeres familie — helt gratis.
          </p>
          <a
            href="#funktioner"
            className="group inline-flex items-center justify-center gap-2.5 mt-8 px-8 py-4 text-[15px] font-bold text-[#1a1a1a] bg-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            Hent appen
          </a>
        </div>
      </section>
    </div>
  );
}
