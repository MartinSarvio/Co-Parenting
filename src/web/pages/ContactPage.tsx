import { Mail, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#2f2f2f] mb-8">Kontakt</h1>

      <div className="prose prose-sm max-w-none text-[#4a4a45] space-y-6">
        <p>
          Har du spørgsmål, feedback eller brug for hjælp? Vi er altid klar til at høre fra dig.
          Du er velkommen til at kontakte os på en af følgende måder.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 not-prose">
          <div className="p-6 rounded-2xl bg-white border border-[#e8e6df]">
            <div className="w-11 h-11 rounded-xl bg-[#f58a2d]/8 flex items-center justify-center mb-4">
              <Mail size={21} className="text-[#f58a2d]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#2f2f2f] mb-1">E-mail</h3>
            <a href="mailto:kontakt@huska.dk" className="text-[14px] text-[#f58a2d] hover:underline">
              kontakt@huska.dk
            </a>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#e8e6df]">
            <div className="w-11 h-11 rounded-xl bg-[#f58a2d]/8 flex items-center justify-center mb-4">
              <MapPin size={21} className="text-[#f58a2d]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#2f2f2f] mb-1">Lokation</h3>
            <p className="text-[14px] text-[#78766d]">Danmark</p>
          </div>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">Hvem står bag?</h2>
          <p>
            Huska er grundlagt af <strong>Martin Kristensen</strong> og <strong>Frederik Hansen</strong>.
            Vi bygger Huska for at gøre hverdagen lettere for danske familier.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">Support</h2>
          <p>
            Oplever du tekniske problemer med appen, eller har du brug for hjælp til at komme i gang?
            Send os en e-mail på{' '}
            <a href="mailto:kontakt@huska.dk" className="text-[#f58a2d] hover:underline">kontakt@huska.dk</a>,
            så vender vi tilbage hurtigst muligt.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">Feedback</h2>
          <p>
            Vi er altid interesserede i at høre, hvordan vi kan gøre Huska bedre.
            Har du idéer til nye funktioner eller forbedringer? Del dem gerne med os —
            din feedback er med til at forme appen.
          </p>
        </section>
      </div>
    </div>
  );
}
