import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-24 pb-16 bg-[#fafaf9]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a] text-xs font-semibold mb-6">
            <FileText size={14} /> Juridisk
          </div>
          <h1 className="text-4xl sm:text-5xl font-[800] text-[#1a1a1a] tracking-[-0.03em] leading-[1.08]">
            Vilkår og betingelser
          </h1>
          <p className="mt-6 text-[15px] text-[#78766d]">Sidst opdateret: 13. marts 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">1. Introduktion</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">
                Disse vilkår og betingelser (&ldquo;Vilkår&rdquo;) gælder for din brug af Huska-appen og
                hjemmesiden huska.dk (&ldquo;Tjenesten&rdquo;), som drives af Martin Kristensen &amp; Frederik Hansen
                (&ldquo;vi&rdquo;, &ldquo;os&rdquo; eller &ldquo;Huska&rdquo;).
              </p>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Ved at oprette en konto eller bruge Tjenesten accepterer du disse Vilkår. Hvis du ikke
                accepterer Vilkårene, bedes du undlade at bruge Tjenesten.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">2. Tjenestens formål</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Huska er en platform til familiekoordinering, der hjælper forældre og familier med at
                planlægge samvær, dele kalendere, kommunikere, fordele udgifter og organisere hverdagen.
                Tjenesten er beregnet til personlig, ikke-kommerciel brug.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">3. Oprettelse af konto</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">
                For at bruge Tjenesten skal du oprette en konto med gyldige oplysninger. Du er ansvarlig for:
              </p>
              <ul className="space-y-2 text-[14px] text-[#4a4a4a]">
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />At holde dine loginoplysninger fortrolige</li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Al aktivitet der foregår via din konto</li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />At dine oplysninger er korrekte og opdaterede</li>
              </ul>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mt-3">
                Du skal være mindst 18 år for at oprette en konto.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">4. Brugsregler</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">
                Du forpligter dig til at bruge Tjenesten lovligt og med respekt for andre brugere. Du må ikke:
              </p>
              <ul className="space-y-2 text-[14px] text-[#4a4a4a]">
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Bruge Tjenesten til ulovlige eller skadelige formål</li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Uploade indhold der er krænkende, truende eller i strid med andres rettigheder</li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Forsøge at få uautoriseret adgang til andre brugeres data eller systemet</li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Automatisere adgang til Tjenesten uden forudgående tilladelse</li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Videredistribuere, kopiere eller sælge indhold fra Tjenesten</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">5. Indhold og data</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">
                Du ejer det indhold, du uploader til Tjenesten (beskeder, billeder, dokumenter osv.).
                Ved at uploade indhold giver du Huska en begrænset licens til at opbevare, vise og
                behandle dit indhold udelukkende med det formål at levere Tjenesten til dig og dine
                familiemedlemmer.
              </p>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Vi forbeholder os retten til at fjerne indhold, der overtræder disse Vilkår.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">6. Abonnement og betaling</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">
                Huska tilbyder en gratis basisversion (Freemium) samt betalte abonnementer med
                udvidede funktioner. For betalte abonnementer gælder:
              </p>
              <ul className="space-y-2 text-[14px] text-[#4a4a4a]">
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Betaling håndteres via Apple App Store eller andre tredjepartsudbydere</li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Abonnementer fornyes automatisk, medmindre du opsiger inden fornyelsesdatoen</li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Priser kan ændres med mindst 30 dages varsel</li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Refusion sker i overensstemmelse med App Stores gældende politik</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">7. Intellektuel ejendomsret</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Huska-appen, herunder design, kode, logoer, tekst og øvrigt indhold, er beskyttet af
                ophavsret og tilhører Martin Kristensen &amp; Frederik Hansen. Du må ikke kopiere,
                modificere, distribuere eller skabe afledte værker baseret på Tjenesten uden forudgående
                skriftlig tilladelse.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">8. Ansvarsbegrænsning</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">
                Tjenesten leveres &ldquo;som den er&rdquo; uden garantier af nogen art. I det omfang loven tillader det:
              </p>
              <ul className="space-y-2 text-[14px] text-[#4a4a4a]">
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Vi garanterer ikke, at Tjenesten er fejlfri eller uafbrudt tilgængelig</li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Vi er ikke ansvarlige for indirekte tab, følgeskader eller tabt data</li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" />Vores samlede ansvar er begrænset til det beløb, du har betalt for Tjenesten i de seneste 12 måneder</li>
              </ul>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mt-3">
                Huska er et koordineringsværktøj og udgør ikke juridisk, medicinsk eller professionel
                rådgivning. Samværsplaner oprettet i appen erstatter ikke juridisk bindende aftaler.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">9. Opsigelse</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">
                Du kan til enhver tid slette din konto via appen under Indstillinger &rarr; Slet konto.
                Ved sletning vil dine personlige data blive anonymiseret inden for 30 dage i
                overensstemmelse med vores privatlivspolitik.
              </p>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Vi forbeholder os retten til at suspendere eller lukke konti, der overtræder disse
                Vilkår, med eller uden forudgående varsel.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">10. Privatlivspolitik</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Vores behandling af personoplysninger er beskrevet i vores{' '}
                <a href="#privatlivspolitik" className="text-[#1a1a1a] underline underline-offset-2 hover:no-underline">privatlivspolitik</a>,
                som udgør en integreret del af disse Vilkår.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">11. Ændringer af vilkårene</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Vi kan opdatere disse Vilkår fra tid til anden. Ved væsentlige ændringer vil vi give
                besked via appen eller e-mail med mindst 14 dages varsel. Fortsat brug af Tjenesten
                efter ændringer udgør accept af de nye Vilkår.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">12. Lovvalg og tvister</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Disse Vilkår er underlagt dansk ret. Eventuelle tvister, der ikke kan løses i
                mindelighed, afgøres ved de danske domstole.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">13. Kontakt</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Har du spørgsmål til disse Vilkår, kan du kontakte os på:{' '}
                <a href="mailto:kontakt@huska.dk" className="text-[#1a1a1a] underline underline-offset-2 hover:no-underline">kontakt@huska.dk</a>
              </p>
              <p className="text-[14px] text-[#4a4a4a] mt-3">
                Martin Kristensen &amp; Frederik Hansen<br />
                Danmark
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
