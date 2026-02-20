/**
 * Official Familieretshuset (Agency of Family Law) document templates.
 * These are publicly available forms used in connection with
 * custody, visitation, residence, mediation, and paternity cases.
 */

export type FamilieretshusetDokument = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: 'samvaer' | 'bopael' | 'forældremyndighed' | 'faderskab' | 'raadgivning' | 'information';
  filename: string;
  /** Approximate page count */
  pages: number;
};

export const familieretshusetKategorier: Record<string, string> = {
  samvaer: 'Samvær',
  bopael: 'Bopæl',
  forældremyndighed: 'Forældremyndighed',
  faderskab: 'Faderskab',
  raadgivning: 'Rådgivning & Mægling',
  information: 'Information',
};

export const familieretshusetDokumenter: FamilieretshusetDokument[] = [
  {
    id: 'frh-001',
    title: 'Aftale om samvær',
    shortTitle: 'Samværsaftale',
    description: 'Formular til forældre der er enige om samvær. Aftalen skal opbevares af begge forældre. Indeholder felter for weekendsamvær, hverdagssamvær, feriesamvær og helligdage.',
    category: 'samvaer',
    filename: 'aftale_om_samvaer.pdf',
    pages: 3,
  },
  {
    id: 'frh-002',
    title: 'Ansøgning om børnesagkyndig rådgivning',
    shortTitle: 'Børnesagkyndig rådg.',
    description: 'Anmodning om børnesagkyndig rådgivning efter forældreansvarslovens § 32. Benyttes når I har brug for professionel vejledning om jeres barns trivsel.',
    category: 'raadgivning',
    filename: 'anmod_bsagkyn_raadg_formular.pdf',
    pages: 4,
  },
  {
    id: 'frh-003',
    title: 'Ansøgning om konfliktmægling',
    shortTitle: 'Konfliktmægling',
    description: 'Anmodning om konfliktmægling efter forældreansvarslovens § 32. Til forældre med fælles børn under 18 år der ønsker hjælp til at løse uenigheder.',
    category: 'raadgivning',
    filename: 'anmod_konfliktm.pdf',
    pages: 4,
  },
  {
    id: 'frh-004',
    title: 'Ansøgning om ændring af bopæl',
    shortTitle: 'Bopælsændring',
    description: 'Ansøgning om ændring af barnets bopæl. Bruges når forældre med fælles forældremyndighed ikke kan blive enige om, hvor barnet skal bo.',
    category: 'bopael',
    filename: 'bopael.pdf',
    pages: 6,
  },
  {
    id: 'frh-005',
    title: 'Registrering af delt bopæl',
    shortTitle: 'Reg. delt bopæl',
    description: 'Anmodning om at registrere delt bopæl i CPR. Begge forældre skal have del i beslutninger, der tidligere blev truffet af bopælsforælderen alene.',
    category: 'bopael',
    filename: 'reg_delt_bopael.pdf',
    pages: 8,
  },
  {
    id: 'frh-006',
    title: 'Ophævelse af delt bopæl',
    shortTitle: 'Ophæv delt bopæl',
    description: 'Anmodning om at ophæve registreringen af delt bopæl i CPR-registret.',
    category: 'bopael',
    filename: 'oph_delt_bopael.pdf',
    pages: 2,
  },
  {
    id: 'frh-007',
    title: 'Ansøgning om ændring af forældremyndighed',
    shortTitle: 'Forældremyndighed',
    description: 'Ansøgning om ændring af forældremyndighed. Bruges når forældrene er uenige om, hvem der skal have forældremyndigheden over barnet.',
    category: 'forældremyndighed',
    filename: 'foraeldremyndighed.pdf',
    pages: 6,
  },
  {
    id: 'frh-008',
    title: 'Forældremyndighed til andre end forældre',
    shortTitle: 'Forældremy. (andre)',
    description: 'Ansøgning om forældremyndighed for andre end de biologiske forældre, fx stedforældre eller ved dødsfald af indehaver af forældremyndigheden.',
    category: 'forældremyndighed',
    filename: 'foraeldremyndighed_andre_end_foraeldre.pdf',
    pages: 4,
  },
  {
    id: 'frh-009',
    title: 'Omsorgs- og ansvarserklæring om faderskab',
    shortTitle: 'Faderskabserkl.',
    description: 'Erklæring om faderskab og fælles forældremyndighed. Formularen fastlægger faderskabet og medfører automatisk fælles forældremyndighed. Tosproglig dansk/engelsk.',
    category: 'faderskab',
    filename: 'ansvarserkl_faderskab.pdf',
    pages: 8,
  },
  {
    id: 'frh-010',
    title: 'Information om midlertidig forældremyndighed',
    shortTitle: 'Midl. forældremynd.',
    description: 'Informationsfolder om midlertidig forældremyndighed over udenlandske mindreårige under 18 med opholdstilladelse i Danmark.',
    category: 'information',
    filename: 'folder_om_uma_260619.pdf',
    pages: 4,
  },
];
