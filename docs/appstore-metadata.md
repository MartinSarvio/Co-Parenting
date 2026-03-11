# Huska — App Store Metadata

## App Information
- **Bundle ID:** dk.huska.app
- **Kategori:** Lifestyle
- **Sekundær kategori:** Productivity
- **Aldersrating:** 4+ (ingen anstødeligt indhold)
- **Pris:** Gratis (med in-app køb)

---

## App Store Beskrivelse (Dansk)

### Kort beskrivelse (promotional text, 170 tegn)
Huska gør hverdagen nemmere for familier. Kalender, samværsplan, delte udgifter, kommunikation og meget mere — samlet i én app.

### Lang beskrivelse (max 4000 tegn)

Huska er den komplette familieapp, der samler alt det praktiske ét sted — uanset om I bor sammen, er skilte, har en sammenbragt familie eller er enlig forælder.

**Samværsplan & Kalender**
Hold styr på hvem der har børnene hvornår med en overskuelig samværsplan. Se ugen, måneden eller hele året i ét blik. Bed om byttedag med et enkelt swipe, og del kalenderen med bedsteforældre og andre familiemedlemmer.

**Kommunikation**
Skriv beskeder direkte i appen — alt er samlet og dokumenteret. Perfekt til forældre der har brug for en struktureret kommunikationskanal.

**Delte Udgifter**
Opret udgifter, del regningen, og hold styr på hvem der skylder hvad. Se analyser over jeres forbrug og sæt budgetmål.

**Børneoverblik**
Saml vigtig information om hvert barn: kontaktpersoner, allergier, milepæle og daglige noter. Del afleveringsnotater når børnene skifter hjem.

**Opgaver & Dokumenter**
Del to-do lister, gem vigtige dokumenter, og skriv referat fra forældremøder. Alt er tilgængeligt for begge forældre.

**Mad & Indkøb**
Planlæg ugens måltider, lav indkøbslister, og find de bedste tilbud fra dagligvarebutikker. Hold styr på hvad der er i køleskabet.

**Dagbog & Fotoalbum**
Del hverdagens øjeblikke med fotos og dagbogsnotater, så begge forældre kan følge med i børnenes hverdag.

**Tilpasset til din familie**
Huska tilpasser sig din familiestruktur:
• Samværsfamilie — delt kalender og samværsplan
• Kernefamilie — samlet husholdning
• Sammenbragt familie — fleksibel opsætning
• Enlig forælder — ekstra dokumentationsværktøjer

**Huska Family Plus** (abonnement)
• Op til 8 børn
• Tilbudsscanner til dagligvarer
• Betalinger mellem forældre
• Kalender-deling med familiemedlemmer
• Ubegrænsede udgiftskategorier

**Huska Single Parent Plus** (abonnement)
• Alt i Family Plus
• Sikkert dokumentarkiv til samværssager
• Advokatadgang
• Ekstra beskyttelse

---

## Keywords (max 100 tegn)
```
samvær,forældre,kalender,skilsmisse,børn,familie,udgifter,samværsplan,dagbog,kommunikation
```

(100 tegn inkl. kommaer)

---

## What's New (version 1.0)
```
Første version af Huska!

• Samværsplan med byttedag-anmodninger
• Delt kalender med uge- og årsvisning
• Beskeder mellem forældre
• Delte udgifter med analyse
• Børneoverblik med afleveringsnotater
• Opgaver, dokumenter og dagbog
• Fotoalbum
• Måltidsplanlægning og indkøbslister
• Tilbudsscanner fra danske butikker
```

---

## Support URL
(Du skal have en URL — kan være en simpel side på dit domæn)
Forslag: https://huska.dk/support

## Privacy Policy URL
(Kræves af Apple)
Forslag: https://huska.dk/privacy

---

## Privatlivspolitik — Skabelon

### Privatlivspolitik for Huska

**Sidst opdateret:** [dato]

Huska ("vi", "os") respekterer dit privatliv. Denne politik beskriver hvilke data vi indsamler og hvordan vi bruger dem.

**Data vi indsamler:**
- Kontooplysninger (email, navn)
- Familiedata (børns navne, aldre, samværsplan)
- Beskeder mellem forældre
- Udgifter og betalingsoplysninger
- Fotos og dokumenter du uploader
- Push notification tokens (til notifikationer)

**Hvordan vi bruger data:**
- Levere appens funktioner
- Synkronisere data mellem forældre
- Sende push notifikationer
- Forbedre appen

**Deling af data:**
- Vi sælger IKKE dine data
- Data deles KUN med den medforælder du inviterer
- Vi bruger Supabase til sikker dataopbevaring (EU-baseret)

**Dine rettigheder (GDPR):**
- Ret til indsigt i dine data
- Ret til at få data slettet
- Ret til dataportabilitet
- Kontakt: [din email]

**Børns privatliv:**
Huska indsamler børns navne og aldre for at levere familiefeatures. Denne data er kun synlig for forældre i husstanden.

---

## Apple Developer Portal — Trin-for-trin

### 1. Registrer App ID
1. Gå til https://developer.apple.com/account
2. Klik "Certificates, Identifiers & Profiles"
3. Vælg "Identifiers" i menuen
4. Klik (+) → vælg "App IDs" → "App"
5. Description: "Huska"
6. Bundle ID: Explicit → `dk.huska.app`
7. Capabilities: Sæt flueben ved **Push Notifications**
8. Klik "Continue" → "Register"

### 2. Opret APNs Key
1. Gå til "Keys" i menuen
2. Klik (+)
3. Key Name: "Huska APNs Key"
4. Sæt flueben ved **Apple Push Notifications service (APNs)**
5. Klik "Continue" → "Register"
6. **DOWNLOAD .p8 filen** (kan kun downloades ÉN gang!)
7. Noter **Key ID** (vises på siden)
8. Noter dit **Team ID** (vises øverst i højre hjørne af Developer Portal)

### 3. Upload APNs Key til Supabase
1. Gå til dit Supabase projekt dashboard
2. Project Settings → Push Notifications (eller Authentication → Providers)
3. Upload .p8 filen
4. Angiv Key ID og Team ID
5. Bundle ID: `dk.huska.app`

### 4. Opret App i App Store Connect
1. Gå til https://appstoreconnect.apple.com
2. Klik "My Apps" → (+) → "New App"
3. Platform: iOS
4. Name: "Huska"
5. Primary Language: Danish
6. Bundle ID: dk.huska.app (vælg fra dropdown)
7. SKU: `dk.huska.app` (eller `huska-ios-1`)
8. Full Access: Alle brugere
9. Klik "Create"

### 5. Udfyld App Information
1. Under "App Information":
   - Subtitle: "Familiens fælles hverdag"
   - Category: Lifestyle
   - Secondary Category: Productivity
   - Content Rights: "Does not contain third-party content"
   - Age Rating: udfyld spørgeskema (svar nej til alt)

2. Under "Pricing and Availability":
   - Pris: Free
   - Availability: Alle lande (eller kun Danmark til start)

3. Under "App Privacy":
   - Link til privatlivspolitik
   - Udfyld privacy questionnaire baseret på data ovenfor

### 6. Xcode — Vælg Team & Build
1. Åbn `/ios/App/App.xcworkspace` i Xcode
2. Vælg "App" target → Signing & Capabilities
3. Vælg dit Team fra dropdown
4. Xcode opretter automatisk provisioning profile
5. Tilføj capability: Push Notifications (klik +Capability)
6. Build: Product → Build (Cmd+B) — verificer ingen fejl
7. Archive: Product → Archive
8. Upload: Distribute App → App Store Connect → Upload
