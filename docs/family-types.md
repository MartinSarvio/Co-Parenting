# Familietyper — Komplet Oversigt

## De fire familietyper

Appen understøtter fire familietyper (`HouseholdMode`), som styrer hvilke funktioner, sider og abonnementsstrukturer der er tilgængelige.

---

## 1. Samboende familie (`together`)

**Beskrivelse:** For par der bor sammen og deler dagligdagen.

### Navigation (bundmenu)
- Oversigt → Kalender → Mad & Hjem → Opgaver + Mere-menu

### Tilgængelige sider
| Side | Tilgængelig |
|------|------------|
| Dashboard | Ja |
| Kalender | Ja (fuld deling automatisk) |
| Mad & Hjem | Ja |
| Opgaver | Ja (multi-deltager) |
| Chat | Ja |
| Udgifter | Ja |
| Børneoverblik | Ja |
| Fotoalbum | Ja |
| Årskalender | Ja |
| Samværsplan | **Nej** |
| Aflevering | **Nej** |
| Bytteforespørgsler | **Nej** |
| Professionelt view | **Nej** (kun admin) |

### Rettigheder (`permissions.ts`)
- `canShareCalendar`: true (automatisk fuld deling)
- `canLinkCoParent`: false
- `canRequestSwap`: false
- `canSeePartnerEvents`: true (automatisk)
- `calendarSharingDefault`: `'full'`
- `requiresLinkingForSharing`: false
- `maxShareTargets`: ubegrænset

### Abonnement
- **Billing-model**: Delt (`shared`) — ét fælles abonnement
- **Standard-plan**: Gratis (`free`)
- Opgaver bruger `participants[]` (multi-deltager) i stedet for enkelt-tildeling

---

## 2. Skilt / Co-parenting (`co_parenting`)

**Beskrivelse:** For separerede/skilte forældre med delt forældreansvar.

### Navigation (bundmenu)
- Oversigt → Samvær → Kalender → Aflevering + Mere-menu

### Tilgængelige sider
| Side | Tilgængelig |
|------|------------|
| Dashboard | Ja |
| Samværsplan | Ja |
| Kalender | Ja (opt-in deling) |
| Aflevering | Ja |
| Opgaver | Ja (enkelt-tildeling) |
| Mad & Hjem | Ja |
| Chat | Ja |
| Udgifter | Ja |
| Børneoverblik | Ja |
| Fotoalbum | Ja |
| Årskalender | Ja |
| Bytteforespørgsler | Ja |
| Professionelt view | **Nej** (kun admin) |
| Bevisarkiv | Ja (subscription-gated) |

### Rettigheder (`permissions.ts`)
- `canShareCalendar`: true (opt-in)
- `canLinkCoParent`: true
- `canRequestSwap`: true
- `canSeePartnerEvents`: false (medmindre eksplicit delt)
- `calendarSharingDefault`: `'none'`
- `requiresLinkingForSharing`: true
- `maxShareTargets`: 1

### Abonnement
- **Billing-model**: Separat (`separate`) — hver forælder har eget abonnement
- **Standard-plan**: Gratis (`free`)

---

## 3. Bonusfamilie (`blended`)

**Beskrivelse:** For sammenbragte familier med stedforældre og evt. børn fra flere forhold.

### Navigation (bundmenu)
- Oversigt → Samvær → Kalender → Aflevering + Mere-menu

### Tilgængelige sider
| Side | Tilgængelig |
|------|------------|
| Dashboard | Ja |
| Samværsplan | Ja |
| Kalender | Ja (opt-in, ingen deling som standard) |
| Aflevering | Ja (alle voksne kan modtage) |
| Opgaver | Ja (multi-deltager) |
| Mad & Hjem | Ja |
| Chat | Ja |
| Udgifter | Ja |
| Børneoverblik | Ja |
| Fotoalbum | Ja |
| Årskalender | Ja |
| Bytteforespørgsler | Ja |
| Professionelt view | **Nej** (kun admin) |
| Bevisarkiv | Ja (subscription-gated) |

### Rettigheder (`permissions.ts`)
- `canShareCalendar`: true
- `canLinkCoParent`: true
- `canRequestSwap`: true
- `canSeePartnerEvents`: false (medmindre eksplicit delt)
- `calendarSharingDefault`: `'none'`
- `requiresLinkingForSharing`: true
- `maxShareTargets`: ubegrænset

### Abonnement
- **Billing-model**: Separat (`separate`)
- **Standard-plan**: Gratis (`free`)

### Særligt for bonusfamilier
- Flere voksne i husstanden (stedforældre med `familyMemberRole: 'step_parent'`)
- Afleveringsmodulet viser dropdown til valg af modtager når der er >1 mulig voksen

---

## 4. Enlig forsørger (`single_parent`)

**Beskrivelse:** For enlige forældre med fuld forældremyndighed. Fokus på dokumentation og juridisk beskyttelse.

### Navigation (bundmenu)
- Oversigt → Samvær → Kalender → Opgaver + Mere-menu

### Tilgængelige sider
| Side | Tilgængelig |
|------|------------|
| Dashboard | Ja |
| Samværsplan | Ja |
| Kalender | Ja (ingen deling) |
| Aflevering | **Nej** (ingen modtager) |
| Opgaver | Ja |
| Mad & Hjem | Ja |
| Chat | Ja |
| Udgifter | Ja |
| Børneoverblik | Ja |
| Fotoalbum | Ja |
| Årskalender | Ja |
| Bytteforespørgsler | **Nej** |
| Professionelt view | **Nej** (kun admin) |
| Bevisarkiv | Ja |
| Advokat-adgang | Ja |

### Rettigheder (`permissions.ts`)
- `canShareCalendar`: false
- `canLinkCoParent`: false
- `canRequestSwap`: false
- `canSeePartnerEvents`: false
- `calendarSharingDefault`: `'none'`
- `requiresLinkingForSharing`: false
- `maxShareTargets`: 0

### Abonnement
- **Billing-model**: Separat (`separate`)
- **Standard-plan**: Enlig Plus (`single_parent_plus`) — inkluderer bevisarkiv og advokatadgang

### Unikt for enlig forsørger
- **Bevisarkiv** (`evidenceVaultEnabled`): Gem dokumentation til juridisk brug
- **Auto-arkivér kvitteringer** (`autoArchiveReceipts`)
- **Advokat-adgang** (`lawyerIds[]`): Invitér advokat med direkte adgang
- Upload dokumenter som bevismateriale (authority_document, court_order)

---

## Abonnementsplaner — Feature-matrix

| Feature | Gratis | Family Plus | Enlig Plus |
|---------|--------|-------------|------------|
| Max børn | 1 | 8 | 8 |
| Flere børn | — | Ja | Ja |
| Indkøbsscanner | — | Ja | Ja |
| Udgiftsmodul | Ja | Ja | Ja |
| Send/anmod penge | — | Ja | Ja |
| Faste udgifter | — | Ja | Ja |
| Bevisarkiv | — | — | Ja |
| Advokatadgang | — | — | Ja |
| Familiemedlemmer | — | 6 | 8 |
| Kalenderdeling | — | Ja | Ja |
| Ubegr. kategorier | — | Ja | Ja |

### Priser
- **Gratis**: 0 kr/md
- **Family Plus**: Månedlig eller årlig (17% rabat)
- **Enlig Plus**: Månedlig eller årlig (17% rabat)

### Default-plan per familietype
| Familietype | Standard-plan |
|-------------|--------------|
| Samboende | Gratis |
| Co-parenting | Gratis |
| Bonusfamilie | Gratis |
| Enlig forsørger | Enlig Plus |

---

## Nøglefiler

| Fil | Formål |
|-----|--------|
| `src/types/index.ts` | `HouseholdMode`, `SubscriptionPlan`, `FamilyPermissions` |
| `src/lib/permissions.ts` | Rettigheder per familietype |
| `src/lib/subscription.ts` | Abonnementsplaner og features |
| `src/components/custom/BottomNav.tsx` | Navigation per familietype |
| `src/sections/SettingsView.tsx` | Familietype-valg og indstillinger |
| `src/sections/OnboardingFlow.tsx` | Initial familietypevalg |
| `src/store/index.ts` | State management og mode-enforcement |
