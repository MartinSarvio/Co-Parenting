# GDPR-compliance — status & roadmap

## Nuværende styrker

- EU-dataresidence (Supabase i EU)
- Row Level Security på alle tabeller (husstand-isolation)
- Privatlivspolitik (opdateret marts 2026)
- Brugersletning med anonymisering (delete_my_account()-funktion)
- Professionel rolle med sagsisolation
- TLS/HTTPS + bcrypt password-hashing

## Kritiske mangler for kommunal brug

### 1. MitID-autentificering (BLOKKER)
- Kommunale services KRÆVER MitID/NemID til stærk autentificering
- Nuværende: kun email/password
- Handling: Integrer MitID via Nets eID-broker eller Signaturgruppen
- Estimat: 4-8 ugers udvikling + certificeringsproces

### 2. Databehandleraftale / DPA (BLOKKER)
- Juridisk aftale mellem kommune og Huska som databehandler
- Skal specificere: datakategorier, formål, underbehandlere, sikkerhedsforanstaltninger
- Handling: Udarbejd standard-DPA skabelon med jurist

### 3. Audit-logging (BLOKKER)
- Ingen sporing af hvem der har tilgået hvilke data hvornår
- Kommuner kræver fuld audit trail
- Handling: Implementer audit_log-tabel med immutable insert-only logs

### 4. Brudnotifikation / GDPR Art. 33 (BLOKKER)
- Ingen incident response-plan
- 72-timers notifikationsfrist til Datatilsynet
- Handling: Dokumenter procedure + implementer teknisk bruddetektering

## Vigtige mangler (kort sigt)

### 5. Felt-niveau kryptering
- Børnenavne, sundhedsdata, CPR (hvis indsamlet) bør krypteres
- Handling: Implementer encryption-at-rest for sensitive felter

### 6. Data-retention politik
- Ingen automatisk arkivering/sletning af afsluttede sager
- Handling: Definer retentionsperioder pr. datatype (f.eks. 7 år for afsluttede sager)

### 7. Dataportabilitet
- GDPR Art. 20 kræver maskinlæsbar eksport
- Handling: Implementer JSON/CSV-eksport af alle persondata

### 8. Samtykkeregistrering
- Mangler eksplicit samtykke-UI med tilbagetrækningsmekanisme
- Handling: Samtykke-dialog ved registrering + settings-side
