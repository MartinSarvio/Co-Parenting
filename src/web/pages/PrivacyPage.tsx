import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-24 pb-16 bg-[#fafaf9]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a] text-xs font-semibold mb-6">
            <Shield size={14} /> Privatliv
          </div>
          <h1 className="text-4xl sm:text-5xl font-[800] text-[#1a1a1a] tracking-[-0.03em] leading-[1.08]">
            Privatlivspolitik
          </h1>
          <p className="mt-6 text-[15px] text-[#78766d]">Sidst opdateret: 5. marts 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">1. Dataansvarlig</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">
                Huska (herefter &ldquo;Huska&rdquo;, &ldquo;vi&rdquo; eller &ldquo;os&rdquo;), drevet af Martin Kristensen &amp; Frederik Hansen, er dataansvarlig
                for behandlingen af de personoplysninger, vi indsamler via appen Huska og tilhørende hjemmeside.
              </p>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Kontakt: <a href="mailto:kontakt@huska.dk" className="text-[#1a1a1a] underline underline-offset-2 hover:no-underline">kontakt@huska.dk</a>
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">2. Hvilke oplysninger indsamler vi?</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">Vi indsamler følgende kategorier af personoplysninger:</p>
              <ul className="space-y-2 text-[14px] text-[#4a4a4a]">
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Kontooplysninger:</strong> Navn, e-mailadresse, adgangskode (krypteret)</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Familieoplysninger:</strong> Børns navne og aldre, samværsplan, husstandsoplysninger</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Kalenderdata:</strong> Begivenheder, vigtige datoer, afleveringsplaner</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Kommunikation:</strong> Beskeder mellem medforældre</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Økonomi:</strong> Fælles udgifter og udlæg (ingen betalingskortoplysninger — betaling håndteres af Stripe)</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Billeder:</strong> Fotos uploadet til fotoalbummet</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Dagbog:</strong> Dagbogsnotater om børns trivsel</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Tekniske data:</strong> Enhedstype, push notification tokens, app-version</span></li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">3. Formål og retsgrundlag</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">Vi behandler dine personoplysninger til følgende formål:</p>
              <ul className="space-y-2 text-[14px] text-[#4a4a4a]">
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Levering af tjenesten</strong> (GDPR art. 6(1)(b) — opfyldelse af aftale): Samværsplanlægning, kalender, beskeder, udgiftsdeling</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Push-notifikationer</strong> (GDPR art. 6(1)(a) — samtykke): Påmindelser om afleveringer, nye beskeder osv.</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Betalingsadministration</strong> (GDPR art. 6(1)(b)): Abonnementshåndtering via Stripe</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Forbedring af appen</strong> (GDPR art. 6(1)(f) — legitim interesse): Anonymiseret brugsstatistik</span></li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">4. Deling af data</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">Vi deler kun dine oplysninger med:</p>
              <ul className="space-y-2 text-[14px] text-[#4a4a4a]">
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Din medforælder:</strong> Kun data der er relevant for fælles forældreskab (samværsplan, kalender, beskeder, udgifter)</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Supabase (databehandler):</strong> Vores database- og autentifikationsudbyder. Data opbevares i EU.</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Stripe (betalingsbehandler):</strong> Håndterer betalinger. Vi gemmer ikke betalingskortoplysninger.</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Apple Push Notification Service:</strong> Til levering af push-notifikationer</span></li>
              </ul>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mt-3">Vi sælger aldrig dine personoplysninger til tredjeparter.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">5. Opbevaring</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Dine data opbevares så længe du har en aktiv konto. Ved sletning af din konto anonymiseres
                alle personhenførbare data inden for 30 dage. Beskeder og fælles data bevares kun for den
                anden parts konto i anonymiseret form.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">6. Dine rettigheder</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-3">I henhold til GDPR har du følgende rettigheder:</p>
              <ul className="space-y-2 text-[14px] text-[#4a4a4a]">
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Indsigt:</strong> Du kan se alle dine data direkte i appen</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Berigtigelse:</strong> Du kan redigere dine oplysninger i Indstillinger</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Sletning:</strong> Du kan slette din konto under Indstillinger &rarr; Slet konto</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Dataportabilitet:</strong> Kontakt os for at modtage en kopi af dine data</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Indsigelse:</strong> Du kan til enhver tid gøre indsigelse mod behandling baseret på legitim interesse</span></li>
                <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0 mt-2" /><span><strong className="text-[#1a1a1a]">Tilbagetrækning af samtykke:</strong> Du kan deaktivere push-notifikationer i iOS Indstillinger</span></li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">7. Sikkerhed</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Vi anvender industristandard sikkerhedsforanstaltninger: krypteret datatransmission (TLS/HTTPS),
                krypterede adgangskoder (bcrypt), row-level security i databasen, og adgangskontrol baseret på
                husstandsmedlemskab.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">8. Børns data</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Huska indsamler oplysninger om børn (navne, aldre, trivsel) som led i samværsplanlægningen.
                Disse data behandles udelukkende efter forældrenes anvisning og er kun tilgængelige for
                husstandens medlemmer.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">9. Cookies og tracking</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Appen bruger ikke cookies eller tredjepartstracking. Vi indsamler kun anonymiseret brugsstatistik
                for at forbedre appen.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">10. Klageadgang</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Hvis du ønsker at klage over vores behandling af dine personoplysninger, kan du kontakte
                Datatilsynet på <a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer" className="text-[#1a1a1a] underline underline-offset-2 hover:no-underline">www.datatilsynet.dk</a>.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">11. Ændringer</h2>
              <p className="text-[14px] text-[#4a4a4a] leading-relaxed">
                Vi kan opdatere denne privatlivspolitik fra tid til anden. Ved væsentlige ændringer
                vil vi give besked via appen.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
