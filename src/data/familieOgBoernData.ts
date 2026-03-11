import type { LucideIcon } from 'lucide-react';
import { Baby, Wallet, Home, Thermometer, Heart, GitBranch, Users, PenLine, Shield, Phone } from 'lucide-react';

export interface RatesTable {
  header: string[];
  rows: string[][];
}

export interface FamilieBoernSection {
  title: string;
  text: string;
  highlight?: boolean;
  rates_table?: RatesTable;
  note?: string;
  link?: string;
  phone?: string;
  url?: string;
  app_action?: string;
}

export interface FamilieBoernCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  short_description: string;
  borger_dk_url: string;
  intro: string;
  sections: FamilieBoernSection[];
}

export const familieOgBoernData: FamilieBoernCategory[] = [
  {
    id: 'barsel-og-orlov',
    title: 'Barsel og orlov',
    icon: Baby,
    short_description: 'Orlovsregler, barselsdagpenge og fordeling af uger mellem forældre.',
    borger_dk_url: 'https://www.borger.dk/familie-og-boern/barsel-oversigt',
    intro: 'Som forælder har du ret til barselsorlov med dagpenge, når du får barn. Orloven er som udgangspunkt ligeligt fordelt – hver forælder har 24 uger efter fødslen. Reglerne gælder for børn født 2. august 2022 eller senere.',
    sections: [
      {
        title: 'Mors orlov',
        text: 'Du har ret til 4 ugers graviditetsorlov før termin (op til 8 uger for kommunalt/regionalt ansatte). Efter fødslen har du 24 ugers orlov – heraf er 2 uger øremærket og skal holdes i direkte forlængelse af fødslen, og 8 uger som kan overdrages.',
      },
      {
        title: 'Fars/medmors orlov',
        text: 'Du har ret til 24 ugers orlov efter fødslen. 2 uger er øremærket til de første 10 uger, og 9 uger er øremærket som lønmodtager og kan ikke overdrages til den anden forælder. De resterende 13 uger kan overdrages.',
      },
      {
        title: 'Forældreorlov (32 uger)',
        text: 'Ud over de første 10 uger efter fødsel har I tilsammen 32 ugers forældreorlov, som I kan fordele fleksibelt. I kan forlænge med 8 eller 14 uger (samme dagpengebeløb fordelt over længere tid) eller udskyde op til 5 uger til barnet fylder 9 år.',
      },
      {
        title: 'Barselsdagpenge',
        text: 'Maks 5.085 kr./uge i 2026 (137,43 kr./time). Udbetales sidste torsdag i måneden. Mange lønmodtagere har ret til fuld løn under dele af orloven via overenskomst – tjek din ansættelseskontrakt.',
        highlight: true,
      },
      {
        title: 'Vigtige frister',
        text: 'Mor skal varsle arbejdsgiver senest 3 måneder før termin. Far/medmor skal varsle senest 4 uger før. Ansøgning om barselsdagpenge skal ske senest 8 uger efter lønstop.',
      },
      {
        title: 'Selvstændige',
        text: 'Fra 5. januar 2026 må du arbejde op til 3,5 timer/uge i din virksomhed og stadig få fulde barselsdagpenge. Du kan i visse situationer søge undtagelse fra de 9 øremærkede uger.',
      },
      {
        title: 'Sorgorlov',
        text: 'Forældre, der mister et barn (dødfødt eller dør inden 18 år), har ret til 26 ugers sorgorlov med dagpenge.',
      },
    ],
  },
  {
    id: 'familieydelser',
    title: 'Familieydelser',
    icon: Wallet,
    short_description: 'Børnecheck, børnetilskud, børnebidrag og andre økonomiske ydelser til familier.',
    borger_dk_url: 'https://www.borger.dk/familie-og-boern/Familieydelser-oversigt',
    intro: 'Der findes en række økonomiske ydelser til børnefamilier i Danmark. Nogle udbetales automatisk, andre kræver ansøgning. Her er et samlet overblik over, hvad du kan have ret til.',
    sections: [
      {
        title: 'Børne- og ungeydelse (børnecheck)',
        text: 'Udbetales automatisk, skattefrit, og deles som udgangspunkt ligeligt mellem forældre med fælles forældremyndighed.',
        rates_table: {
          header: ['Barnets alder', 'Beløb (2026)', 'Udbetaling'],
          rows: [
            ['0–2 år', '5.370 kr./kvartal', 'Kvartalsvis (d. 20/1, 20/4, 20/7, 20/10)'],
            ['3–6 år', '4.251 kr./kvartal', 'Kvartalsvis'],
            ['7–14 år', '3.345 kr./kvartal', 'Kvartalsvis'],
            ['15–17 år', '1.115 kr./måned', 'Månedligt (d. 20.)'],
          ],
        },
        note: 'Aftrapning: Tjener du over 961.100 kr./år, nedsættes din halvdel med 2% af det overskydende. Den anden forælders andel påvirkes ikke.',
        link: 'https://www.borger.dk/familie-og-boern/Familieydelser-oversigt/Boerne-ungeydelse',
      },
      {
        title: 'Børnetilskud',
        text: 'Skal søges. Skattefrit. Typisk for enlige forsørgere, studerende eller pensionister.',
        rates_table: {
          header: ['Type', 'Beløb (2026)', 'Hvem'],
          rows: [
            ['Ordinært børnetilskud', '6.964 kr./kvartal', 'Enlige forsørgere'],
            ['Ekstra børnetilskud', '7.096 kr./år (ét samlet beløb)', 'Enlige forsørgere (uanset antal børn)'],
            ['Særligt børnetilskud', '5.025 kr./kvartal', 'Børn med kun én forælder / ukendt far'],
            ['Flerbørnstilskud', '2.874 kr./kvartal pr. ekstra barn', 'Tvillinger, trillinger m.fl. (til barnet fylder 7)'],
            ['Bidragsbetalende pensionist', 'Maks 4.449 kr./kvartal', 'Pensionister der betaler børnebidrag'],
          ],
        },
        link: 'https://www.borger.dk/familie-og-boern/Familieydelser-oversigt/boernetilskud',
      },
      {
        title: 'Børnebidrag',
        text: 'Forældre har forsørgelsespligt. Bor I ikke sammen, kan den ene forælder pålægges at betale bidrag til den anden. I kan selv aftale beløbet – ellers fastsætter Familieretshuset det ud fra normalbidragstaksten.',
        rates_table: {
          header: ['Type', 'Beløb', 'Bemærkning'],
          rows: [
            ['Normalbidrag (2025)', '1.603 kr./md.', 'Grundbeløb 1.419 kr. + tillæg 184 kr.'],
            ['Skattefradrag', 'Kun for grundbeløbet', 'Tillægget giver ikke fradrag'],
          ],
        },
        note: '2026-takster offentliggøres af Familieretshuset. Kan I ikke blive enige, træffer Familieretshuset afgørelse.',
        link: 'https://www.borger.dk/familie-og-boern/Familieydelser-oversigt/Boernebidrag',
      },
      {
        title: 'Bidrag ved fødsel og navngivning',
        text: 'Hvis I ikke bor sammen, kan den ene forælder blive pålagt at betale et engangsbeløb til dækning af udgifter i forbindelse med fødsel og navngivning/dåb. Bidraget fastsættes af Familieretshuset.',
        link: 'https://www.borger.dk/familie-og-boern/Familieydelser-oversigt/Boernebidrag/Bidrag-foedsel-navngivning-konfirmation',
      },
      {
        title: 'Konfirmationsbidrag',
        text: 'Et engangsbeløb som den bidragspligtige forælder kan pålægges at betale til barnets konfirmation eller tilsvarende begivenhed. Skal søges hos Familieretshuset.',
        link: 'https://www.borger.dk/familie-og-boern/Familieydelser-oversigt/Boernebidrag/Bidrag-foedsel-navngivning-konfirmation',
      },
      {
        title: 'Beklædningsbidrag',
        text: 'Kan fastsættes af Familieretshuset som supplement til det løbende børnebidrag, hvis der er særligt behov for dækning af barnets beklædningsudgifter.',
        link: 'https://www.borger.dk/familie-og-boern/Familieydelser-oversigt/Boernebidrag',
      },
      {
        title: 'Uddannelsesbidrag',
        text: 'Forældre kan pålægges at betale uddannelsesbidrag til unge mellem 18 og 24 år, der er under uddannelse. Bidraget fastsættes af Familieretshuset og afhænger af den unges og forældrenes økonomiske forhold.',
        link: 'https://www.borger.dk/familie-og-boern/Familieydelser-oversigt/Boernebidrag/Uddannelsesbidrag',
      },
      {
        title: 'Ægtefællebidrag',
        text: 'Ikke det samme som børnebidrag. Kan pålægges den ene ægtefælle ved separation eller skilsmisse, hvis den anden part ikke kan forsørge sig selv. Fastsættes enten ved aftale, af Familieretshuset eller af retten. Kan være tidsbegrænset.',
        link: 'https://www.borger.dk/familie-og-boern/Familieydelser-oversigt/aegtefaellebidrag',
      },
    ],
  },
  {
    id: 'boernepasning',
    title: 'Børnepasning',
    icon: Home,
    short_description: 'Dagtilbud, pasningsgaranti, frit valg og tilskud til privat pasning.',
    borger_dk_url: 'https://www.borger.dk/familie-og-boern/boernepasning-oversigt',
    intro: 'Alle børn i Danmark har ret til en plads i et dagtilbud. Kommunen har pasningsgaranti, men du skal selv skrive dit barn op – og det er en god idé at gøre det i god tid, da ventelister kan være lange.',
    sections: [
      {
        title: 'Dagpleje og vuggestue',
        text: 'Typisk fra barnet er ca. 26 uger (når barslen slutter). Kommunen tilbyder plads i dagpleje, vuggestue eller integreret institution.',
      },
      {
        title: 'Børnehave',
        text: 'Fra barnet er ca. 3 år tilbydes plads i børnehave. Tilbuddet gælder som hovedregel fra den 1. i den måned, barnet fylder 3 år.',
      },
      {
        title: 'SFO og fritidsordning',
        text: 'Fra skolestart kan barnet komme i skolefritidsordning (SFO) eller fritidshjem.',
      },
      {
        title: 'Frit valg af institution',
        text: 'Du har ret til at vælge dagtilbud i en anden kommune, men kan risikere at betale en eventuel prisforskel.',
      },
      {
        title: 'Økonomisk fripladstilskud',
        text: 'Er husstandsindkomsten under en vis grænse, kan du søge om hel eller delvis fripladstilskud. Søges via Digital Pladsanvisning.',
      },
      {
        title: 'Tilskud til privat pasning',
        text: 'Kommunen kan give tilskud til privat pasning – fx privat dagpleje, au pair eller fleksibel pasningsordning.',
      },
    ],
  },
  {
    id: 'barn-syg-omsorgsdage',
    title: 'Barn syg og omsorgsdage',
    icon: Thermometer,
    short_description: 'Dine rettigheder når dit barn er sygt, og regler for omsorgsdage.',
    borger_dk_url: 'https://www.borger.dk/familie-og-boern/barn-syg-omsorgsdage',
    intro: 'Bliver dit barn sygt, har du som forælder i de fleste tilfælde ret til fravær fra arbejde. Reglerne afhænger af din overenskomst og ansættelsesaftale – det er ikke lovbestemt i alle tilfælde.',
    sections: [
      {
        title: 'Barnets 1. og 2. sygedag',
        text: 'De fleste overenskomster giver ret til fravær med løn på barnets 1. og evt. 2. sygedag. Det er ikke en lovfæstet ret, men en aftale mellem arbejdsmarkedets parter. Tjek altid din egen overenskomst eller kontrakt.',
      },
      {
        title: 'Omsorgsdage',
        text: 'Mange offentligt ansatte har ret til 2 omsorgsdage pr. barn pr. kalenderår. I den private sektor afhænger det af overenskomsten. Omsorgsdage bruges typisk ved barnets sygdom, lægebesøg eller lignende.',
      },
      {
        title: 'Pasning af alvorligt sygt barn',
        text: 'Hvis dit barn er alvorligt sygt og indlagt eller kræver pleje i hjemmet, kan du have ret til dagpenge under fraværet. Kontakt din kommune for ansøgning.',
      },
      {
        title: 'Tabt arbejdsfortjeneste',
        text: 'Har dit barn en betydelig og varig funktionsnedsættelse eller kronisk sygdom, der kræver pasning i hjemmet, kan du søge om kompensation for tabt arbejdsfortjeneste efter Barnets lov § 87. Det bevilges af kommunen.',
      },
    ],
  },
  {
    id: 'aegteskab-og-parforhold',
    title: 'Ægteskab og parforhold',
    icon: Heart,
    short_description: 'Vielse, prøvelsesattest, ægtepagt og formuefællesskab.',
    borger_dk_url: 'https://www.borger.dk/familie-og-boern/aegteskab-og-parforhold',
    intro: 'I Danmark kan I blive gift borgerligt eller kirkeligt. Der er en række regler om prøvelsesattest, formueforhold og navneskift, som er gode at kende inden vielsen.',
    sections: [
      {
        title: 'Prøvelsesattest',
        text: 'Inden vielsen skal kommunen udstede en prøvelsesattest, der bekræfter, at I begge opfylder betingelserne for at indgå ægteskab. Attesten er gyldig i 4 måneder.',
      },
      {
        title: 'Borgerlig og kirkelig vielse',
        text: 'Borgerlig vielse foretages af kommunen. Kirkelig vielse kan ske i folkekirken eller et godkendt trossamfund. Begge former er juridisk gyldige.',
      },
      {
        title: 'Formuefællesskab',
        text: 'Når I gifter jer, opstår der automatisk formuefællesskab (fælleseje). Det betyder, at jeres formuer som udgangspunkt deles ligeligt ved skilsmisse.',
      },
      {
        title: 'Ægtepagt',
        text: 'Ønsker I at bestemte værdier (fx bolig, virksomhed, arv) skal være særeje, skal I oprette en ægtepagt. Den skal tinglyses i Personbogen for at være gyldig.',
      },
      {
        title: 'Registreret partnerskab',
        text: 'Siden 2012 kan par af samme køn blive gift på lige vilkår. Eksisterende registrerede partnerskaber kan omdannes til ægteskab.',
      },
    ],
  },
  {
    id: 'naar-i-gaar-fra-hinanden',
    title: 'Når I går fra hinanden',
    icon: GitBranch,
    short_description: 'Separation, skilsmisse, samvær, bopæl og deling af ydelser.',
    borger_dk_url: 'https://www.borger.dk/familie-og-boern/Naar-I-gaar-fra-hinanden',
    intro: 'En skilsmisse eller separation rejser mange spørgsmål – særligt når der er børn involveret. Her er et overblik over de vigtigste juridiske og praktiske ting, I skal forholde jer til.',
    sections: [
      {
        title: 'Separation og skilsmisse',
        text: 'Er I enige om at gå fra hinanden, kan I søge direkte skilsmisse. Er I uenige om vilkårene, kan I søge separation først (6 måneders refleksionsperiode). Ansøgning sker via Familieretshuset – det koster 820 kr. (2026) i gebyr.',
      },
      {
        title: 'Bopæl og samvær',
        text: 'I skal aftale, hvor barnet skal have bopæl (bopælsforælder) og hvornår barnet er hos den anden (samværsforælder). Mange vælger en 7/7-ordning, men alle modeller er mulige. Er I uenige, kan Familieretshuset og i sidste ende retten afgøre det.',
      },
      {
        title: 'Børnebidrag ved brud',
        text: 'Bopælsforælderen kan søge om børnebidrag fra samværsforælderen. Normalbidrag 2025: 1.603 kr./md. Ved uenighed fastsætter Familieretshuset bidraget.',
      },
      {
        title: 'Deling af børne- og ungeydelse',
        text: 'Ydelsen deles som udgangspunkt ligeligt ved fælles forældremyndighed. Ved flytning efter 19.10.2021 deles automatisk. Ønsker I en anden fordeling, kræves dokumentation for samværsordning (min. 9 ud af 14 dage) eller erklæring fra Familieretshuset.',
      },
      {
        title: 'Bolig og formue',
        text: 'Hvem bliver boende afhænger af ejerforhold, lejekontrakt og børnenes behov. Formuefællesskab deles som udgangspunkt ligeligt. Særeje (via ægtepagt) holdes udenfor.',
      },
      {
        title: 'Hjælp og mægling',
        text: 'Familieretshuset tilbyder gratis rådgivning, børnesagkyndig rådgivning og mægling. Det er en god idé at søge hjælp tidligt for at undgå langvarige konflikter.',
      },
    ],
  },
  {
    id: 'faderskab-medmoderskab-foraeldremyndighed',
    title: 'Faderskab, medmoderskab og forældremyndighed',
    icon: Users,
    short_description: 'Registrering af forældreskab og regler for fælles og ene-forældremyndighed.',
    borger_dk_url: 'https://www.borger.dk/familie-og-boern/Faderskab-medmoderskab-foraeldremyndighed',
    intro: 'Når et barn fødes, skal det juridiske forældreskab fastslås. I mange tilfælde sker det automatisk, men der er situationer, hvor I aktivt skal handle.',
    sections: [
      {
        title: 'Faderskab',
        text: 'Er I gift, registreres manden automatisk som far. Er I ugifte, skal faderskabet anerkendes – det kan gøres digitalt via borger.dk inden fødslen (fra uge 28) eller efterfølgende via Familieretshuset.',
      },
      {
        title: 'Medmoderskab',
        text: 'Kvindelige par kan registrere medmoderskab, hvis barnet er undfanget ved assisteret reproduktion på en dansk godkendt klinik eller med en kendt donor. Omsorgs- og ansvarserklæring underskrives digitalt.',
      },
      {
        title: 'Fælles forældremyndighed',
        text: 'Opstår automatisk, hvis I er gift. Er I ugifte, kan I registrere fælles forældremyndighed digitalt – det sker ofte i forbindelse med faderskabs-/medmoderskabserklæringen.',
      },
      {
        title: 'Eneforældremyndighed',
        text: 'Kan søges hos Familieretshuset, hvis der er alvorlige uenigheder eller bekymring for barnets trivsel. Retten træffer den endelige afgørelse ud fra barnets bedste interesser.',
      },
      {
        title: 'Barnets bopæl',
        text: 'Ved uenighed om bopæl kan Familieretshuset og retten afgøre, hvor barnet skal have folkeregisteradresse. Afgørelsen træffes ud fra barnets bedste og tager hensyn til stabilitet, tilknytning og forældrenes samarbejdsevne.',
      },
    ],
  },
  {
    id: 'navne-og-navneaendring',
    title: 'Navne og navneændring',
    icon: PenLine,
    short_description: 'Navngivning af barn, navnelister og regler for navneændring.',
    borger_dk_url: 'https://www.borger.dk/familie-og-boern/Navne-og-navneaendring',
    intro: 'Dit barn skal have et navn inden 6 måneder efter fødslen. Der er klare regler for, hvilke navne der er godkendt, og hvordan du kan ændre navn senere.',
    sections: [
      {
        title: 'Navngivning af barnet',
        text: 'Skal ske inden 6 måneder efter fødslen. For folkekirkemedlemmer sker det via kirkekontoret (typisk i forbindelse med dåb). For andre sker det via personregistrering hos kommunen.',
      },
      {
        title: 'Godkendte navne',
        text: 'Navne på den officielle godkendte navneliste kan frit vælges som fornavne. Ønsker du et navn, der ikke er på listen, skal det godkendes af Familieretshuset.',
      },
      {
        title: 'Efternavn',
        text: 'Dit barn kan bære mors, fars eller begges efternavn (med bindestreg). Ved uenighed beholder barnet det efternavn, det er registreret med ved fødslen.',
      },
      {
        title: 'Navneændring',
        text: 'Navneændring søges via borger.dk. Det koster 500 kr. i gebyr. Undtagelser: Navneændring i forbindelse med vielse eller inden 3 måneder efter barnets fødsel er gratis.',
      },
    ],
  },
  {
    id: 'udsatte-boern-og-unge',
    title: 'Udsatte børn og unge',
    icon: Shield,
    short_description: 'Underretningspligt, børn i mistrivsel og kommunens ansvar.',
    borger_dk_url: 'https://www.borger.dk/familie-og-boern/Udsatte-boern-og-unge',
    intro: 'Alle borgere i Danmark har pligt til at underrette kommunen, hvis de er bekymrede for et barn eller en ungs trivsel. Kommunen har pligt til at vurdere henvendelsen inden 24 timer.',
    sections: [
      {
        title: 'Almindelig underretningspligt (§ 135)',
        text: 'Enhver borger, der får kendskab til at et barn under 18 år udsættes for vanrøgt, nedværdigende behandling eller lever under forhold, der bringer dets sundhed eller udvikling i fare, har pligt til at underrette kommunen. Du kan gøre det anonymt.',
      },
      {
        title: 'Skærpet underretningspligt (§ 133)',
        text: 'Fagpersoner – lærere, pædagoger, læger, sundhedsplejersker m.fl. – har en skærpet underretningspligt, der går forud for tavshedspligten. Du behøver ikke vide med sikkerhed – en formodning er nok.',
      },
      {
        title: 'Anonym underretning',
        text: 'Du kan underrette anonymt, men vær opmærksom på at forældrene har ret til at se selve underretningen. Undgå derfor detaljer, der kan afsløre din identitet, hvis du ønsker at forblive anonym.',
      },
      {
        title: 'Hvad sker der efter underretningen?',
        text: 'Kommunen vurderer inden 24 timer, om der er behov for akut handling. Derefter kontaktes familien, og det vurderes om der skal igangsættes en børnefaglig undersøgelse. Du får en kvittering inden 6 hverdage, hvis du har oplyst dit navn – men du bliver ikke orienteret om sagens forløb.',
      },
      {
        title: 'Hvis kommunen ikke handler',
        text: 'Oplever du, at kommunen ikke reagerer tilstrækkeligt, kan du underrette Ankestyrelsen direkte.',
      },
      {
        title: 'Underret digitalt',
        text: 'Du kan sende en digital underretning til din kommune via EG Selvbetjening.',
      },
    ],
  },
  {
    id: 'brug-for-raad-og-hjaelp',
    title: 'Brug for råd og hjælp',
    icon: Phone,
    short_description: 'Gratis rådgivning, kontaktoplysninger og hjælpetilbud til familier.',
    borger_dk_url: 'https://www.borger.dk/familie-og-boern',
    intro: 'Der er en lang række gratis rådgivnings- og hjælpetilbud for familier i Danmark. Du behøver ikke stå alene med dine spørgsmål.',
    sections: [
      {
        title: 'Familieretshuset',
        text: 'Hjælper med samvær, forældremyndighed, bopæl, separation, skilsmisse, børnebidrag og ægtefællebidrag. Tilbyder også gratis rådgivning og mægling.',
        phone: '72 56 70 00',
        url: 'https://familieretshuset.dk',
      },
      {
        title: 'Udbetaling Danmark – Familieydelser',
        text: 'Spørgsmål om børne- og ungeydelse, børnetilskud, barselsdagpenge og andre familieydelser.',
        phone: '70 12 80 62',
        url: 'https://www.borger.dk/familie-og-boern/Familieydelser-oversigt',
      },
      {
        title: 'Din kommunes familieafdeling',
        text: 'Rådgivning og støtte til børn og familier, herunder underretninger, forebyggende indsatser og praktisk hjælp. Kontaktoplysninger finder du på din kommunes hjemmeside.',
      },
      {
        title: 'Børns Vilkår / BørneTelefonen',
        text: 'Gratis, anonym rådgivning for børn og unge der har det svært. Åben alle dage.',
        phone: '116 111',
        url: 'https://bornsvilkar.dk',
      },
      {
        title: 'ForældreTelefonen (Børns Vilkår)',
        text: 'Gratis rådgivning for forældre, bedsteforældre og andre voksne, der er bekymrede for et barn.',
        phone: '35 55 55 57',
        url: 'https://bornsvilkar.dk/foraeldre/foraeldretelefonen/',
      },
      {
        title: 'Mødrehjælpen',
        text: 'Rådgivning og støtte til gravide og forældre i sårbare situationer – økonomi, juridisk hjælp, familierådgivning og fællesskaber.',
        phone: '33 45 86 30',
        url: 'https://moedrehjaelpen.dk',
      },
    ],
  },
];
