export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#2f2f2f] mb-8">Privatlivspolitik</h1>
      <p className="text-sm text-[#78766d] mb-8">Sidst opdateret: 5. marts 2026</p>

      <div className="prose prose-sm max-w-none text-[#4a4a45] space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">1. Dataansvarlig</h2>
          <p>
            Huska (herefter &ldquo;Huska&rdquo;, &ldquo;vi&rdquo; eller &ldquo;os&rdquo;), drevet af Martin Kristensen &amp; Frederik Hansen, er dataansvarlig
            for behandlingen af de personoplysninger, vi indsamler via appen Huska og tilhørende hjemmeside.
          </p>
          <p>Kontakt: <a href="mailto:kontakt@huska.dk" className="text-[#f58a2d] hover:underline">kontakt@huska.dk</a></p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">2. Hvilke oplysninger indsamler vi?</h2>
          <p>Vi indsamler følgende kategorier af personoplysninger:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Kontooplysninger:</strong> Navn, e-mailadresse, adgangskode (krypteret)</li>
            <li><strong>Familieoplysninger:</strong> Børns navne og aldre, samværsplan, husstandsoplysninger</li>
            <li><strong>Kalenderdata:</strong> Begivenheder, vigtige datoer, afleveringsplaner</li>
            <li><strong>Kommunikation:</strong> Beskeder mellem medforældre</li>
            <li><strong>Økonomi:</strong> Fælles udgifter og udlæg (ingen betalingskortoplysninger — betaling håndteres af Stripe)</li>
            <li><strong>Billeder:</strong> Fotos uploadet til fotoalbummet</li>
            <li><strong>Dagbog:</strong> Dagbogsnotater om børns trivsel</li>
            <li><strong>Tekniske data:</strong> Enhedstype, push notification tokens, app-version</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">3. Formål og retsgrundlag</h2>
          <p>Vi behandler dine personoplysninger til følgende formål:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Levering af tjenesten</strong> (GDPR art. 6(1)(b) — opfyldelse af aftale): Samværsplanlægning, kalender, beskeder, udgiftsdeling</li>
            <li><strong>Push-notifikationer</strong> (GDPR art. 6(1)(a) — samtykke): Påmindelser om afleveringer, nye beskeder osv.</li>
            <li><strong>Betalingsadministration</strong> (GDPR art. 6(1)(b)): Abonnementshåndtering via Stripe</li>
            <li><strong>Forbedring af appen</strong> (GDPR art. 6(1)(f) — legitim interesse): Anonymiseret brugsstatistik</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">4. Deling af data</h2>
          <p>Vi deler kun dine oplysninger med:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Din medforælder:</strong> Kun data der er relevant for fælles forældreskab (samværsplan, kalender, beskeder, udgifter)</li>
            <li><strong>Supabase (databehandler):</strong> Vores database- og autentifikationsudbyder. Data opbevares i EU.</li>
            <li><strong>Stripe (betalingsbehandler):</strong> Håndterer betalinger. Vi gemmer ikke betalingskortoplysninger.</li>
            <li><strong>Apple Push Notification Service:</strong> Til levering af push-notifikationer</li>
          </ul>
          <p>Vi sælger aldrig dine personoplysninger til tredjeparter.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">5. Opbevaring</h2>
          <p>
            Dine data opbevares så længe du har en aktiv konto. Ved sletning af din konto anonymiseres
            alle personhenførbare data inden for 30 dage. Beskeder og fælles data bevares kun for den
            anden parts konto i anonymiseret form.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">6. Dine rettigheder</h2>
          <p>I henhold til GDPR har du følgende rettigheder:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Indsigt:</strong> Du kan se alle dine data direkte i appen</li>
            <li><strong>Berigtigelse:</strong> Du kan redigere dine oplysninger i Indstillinger</li>
            <li><strong>Sletning:</strong> Du kan slette din konto under Indstillinger → Slet konto</li>
            <li><strong>Dataportabilitet:</strong> Kontakt os for at modtage en kopi af dine data</li>
            <li><strong>Indsigelse:</strong> Du kan til enhver tid gøre indsigelse mod behandling baseret på legitim interesse</li>
            <li><strong>Tilbagetrækning af samtykke:</strong> Du kan deaktivere push-notifikationer i iOS Indstillinger</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">7. Sikkerhed</h2>
          <p>
            Vi anvender industristandard sikkerhedsforanstaltninger: krypteret datatransmission (TLS/HTTPS),
            krypterede adgangskoder (bcrypt), row-level security i databasen, og adgangskontrol baseret på
            husstandsmedlemskab.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">8. Børns data</h2>
          <p>
            Huska indsamler oplysninger om børn (navne, aldre, trivsel) som led i samværsplanlægningen.
            Disse data behandles udelukkende efter forældrenes anvisning og er kun tilgængelige for
            husstandens medlemmer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">9. Cookies og tracking</h2>
          <p>
            Appen bruger ikke cookies eller tredjepartstracking. Vi indsamler kun anonymiseret brugsstatistik
            for at forbedre appen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">10. Klageadgang</h2>
          <p>
            Hvis du ønsker at klage over vores behandling af dine personoplysninger, kan du kontakte
            Datatilsynet på <a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer" className="text-[#f58a2d] hover:underline">www.datatilsynet.dk</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">11. Ændringer</h2>
          <p>
            Vi kan opdatere denne privatlivspolitik fra tid til anden. Ved væsentlige ændringer
            vil vi give besked via appen.
          </p>
        </section>
      </div>
    </div>
  );
}
