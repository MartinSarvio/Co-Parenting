# Huska — App Store Screenshots Guide

## Påkrævede Screenshot-størrelser

Apple kræver screenshots for mindst én enhedstype. For bedst synlighed: upload til alle.

| Enhed | Opløsning | Påkrævet |
|-------|-----------|----------|
| iPhone 6.9" (16 Pro Max) | 1320 × 2868 | Anbefalet (nyeste) |
| iPhone 6.7" (15 Pro Max) | 1290 × 2796 | Anbefalet |
| iPhone 6.5" (14 Plus) | 1284 × 2778 | Valgfrit |
| iPhone 5.5" (8 Plus) | 1242 × 2208 | Valgfrit (ældre enheder) |
| iPad Pro 13" | 2064 × 2752 | Kun hvis iPad-support |
| iPad Pro 11" | 1668 × 2388 | Kun hvis iPad-support |

**Minimum:** 3 screenshots per enhedstype
**Maximum:** 10 screenshots per enhedstype

---

## Anbefalede Screenshots (rækkefølge)

### Screenshot 1: Dashboard / Overblik
- Vis hovedskærmen med kalender-widget, næste begivenhed, børneoverblik
- Tekst overlay: **"Alt samlet ét sted"**

### Screenshot 2: Samværsplan
- Vis samværskalenderen med farvekodede dage (sort/orange)
- Tekst overlay: **"Overskuelig samværsplan"**

### Screenshot 3: Kalender
- Vis ugevisning med begivenheder og samværsmarkering
- Tekst overlay: **"Fælles kalender for hele familien"**

### Screenshot 4: Kommunikation
- Vis besked-tråden mellem forældre
- Tekst overlay: **"Tryg kommunikation"**

### Screenshot 5: Delte Udgifter
- Vis udgiftsoversigt med balance og kategorier
- Tekst overlay: **"Hold styr på fælles udgifter"**

### Screenshot 6: Børneoverblik
- Vis et barns profil med info, kontaktpersoner, noter
- Tekst overlay: **"Alt om dit barn samlet"**

### Screenshot 7: Mad & Indkøb
- Vis måltidsplanlægning eller indkøbsliste
- Tekst overlay: **"Planlæg ugens måltider"**

### Screenshot 8: Opgaver
- Vis delt opgaveliste
- Tekst overlay: **"Delte opgaver og to-do lister"**

---

## Sådan tager du screenshots

### Metode 1: Xcode Simulator (nemmest)
```bash
# Start simulator med specifik enhed
xcrun simctl boot "iPhone 16 Pro Max"

# Åbn appen i simulator
# Naviger til den ønskede skærm

# Tag screenshot med tastatur:
# Cmd + S i Simulator

# Screenshots gemmes i ~/Desktop/
```

### Metode 2: Fysisk enhed
1. Tilslut iPhone via USB
2. Åbn appen og naviger til skærmen
3. Tryk Side-knap + Volume Up samtidig
4. Find screenshot i Fotos-appen
5. AirDrop til Mac

### Metode 3: Xcode → Window → Devices and Simulators
1. Vælg din tilsluttede enhed
2. Klik "Take Screenshot"
3. Gemmes direkte til Desktop

---

## Screenshot Design Tips

### Gør dette:
- **Brug demo-data** — ikke rigtige navne/data
- **Vis fyldte skærme** — tomt indhold ser dårligt ud
- **Konsistent stil** — samme baggrund/font på tekst overlays
- **Dansk tekst** — da appen er på dansk
- **Status bar** — vis klokkeslæt 9:41 (Apple standard)

### Undgå:
- Personlige data (rigtige navne, emails)
- Tomme lister eller skærme
- Fejlmeddelelser eller loading states
- Screenshots med notification badges

---

## Tekst Overlay Design

Til professionelle screenshots brug et værktøj som:
- **Figma** (gratis) — lav frames i screenshot-størrelse
- **Canva** — hurtig og nem
- **Screenshots Pro** (Mac app)

### Layout forslag:
```
┌─────────────────────┐
│                     │
│   "Overskuelig      │
│    samværsplan"     │
│                     │
│  ┌───────────────┐  │
│  │               │  │
│  │  App screen   │  │
│  │  (85% size)   │  │
│  │               │  │
│  │               │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘

Baggrund: #f2f1ed (app farve)
Tekst: #2F2F2F (sort)
Font: SF Pro Display Bold, 48pt
```

---

## App Preview Video (valgfrit men anbefalet)

- Max 30 sekunder
- Vis de 3-4 vigtigste features i brug
- Opløsning: samme som screenshots
- Format: .mov eller .mp4
- Kan optages med Xcode → Simulator → File → Record Screen

### Foreslået flow:
1. Åbn app → Dashboard (3 sek)
2. Swipe til samværsplan (5 sek)
3. Åbn kalender → byttedag (5 sek)
4. Send besked (5 sek)
5. Vis udgiftsoversigt (5 sek)
6. Vis børneoverblik (5 sek)
7. Fade til logo + tagline (2 sek)
