import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store';
import { OverblikSidePanel } from '@/components/custom/OverblikSidePanel';
import { useApiActions } from '@/hooks/useApiActions';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  Stethoscope,
  GraduationCap,
  Users,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Baby,
  Brain,
  Sparkles,
  // X available if needed
  Eye,
  RefreshCw,
  Waves,
  Target,
  Link,
  LayoutGrid,
  ListOrdered,
  Map,
  Scale,
  Globe,
  Footprints,
  MessageCircle,
  Wand2,
  School,
  BookOpen,
  Trophy,
  Search,
} from 'lucide-react';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInYears, differenceInMonths, differenceInWeeks, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { Milestone } from '@/types';

// ─── Tigerspring (Wonder Weeks) & Development Stages ────────────────────────
interface DevelopmentStage {
  id: string;
  type: 'tigerspring' | 'phase';
  number?: number;            // Tigerspring 1-10
  weekStart: number;          // Start in weeks from birth
  weekEnd?: number;           // End in weeks (for phases)
  title: string;
  subtitle: string;
  crisisSymptoms: string[];
  newSkills: string[];
  tips: string[];
  link: string;
  icon: string;
}

// Map icon names to Lucide components
const stageIconMap: Record<string, LucideIcon> = {
  eye: Eye,
  'refresh-cw': RefreshCw,
  waves: Waves,
  target: Target,
  link: Link,
  'layout-grid': LayoutGrid,
  'list-ordered': ListOrdered,
  map: Map,
  scale: Scale,
  globe: Globe,
  footprints: Footprints,
  'message-circle': MessageCircle,
  wand: Wand2,
  school: School,
  'book-open': BookOpen,
  trophy: Trophy,
  search: Search,
  brain: Brain,
  'graduation-cap': GraduationCap,
};

const developmentStages: DevelopmentStage[] = [
  // ── 10 Tigerspring ──
  {
    id: 'ts1', type: 'tigerspring', number: 1, weekStart: 5, icon: 'eye',
    title: 'Sansernes verden åbner sig',
    subtitle: 'Tigerspring 1 · Uge 5',
    crisisSymptoms: ['Mere græd end normalt', 'Vil holdes og bæres konstant', 'Dårligere søvn og appetit', 'Mere opmærksom på omgivelserne'],
    newSkills: ['Følger genstande med øjnene', 'Reagerer på lyde og stemmer', 'Første sociale smil', 'Opdager egne hænder'],
    tips: ['Giv ekstra nærvær og kropskontakt', 'Tal blidt og syng for barnet', 'Vis kontrastrige billeder', 'Vær tålmodig med den ekstra uro'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-0-1-aar/barnets-udvikling-0-2-maaneder/',
  },
  {
    id: 'ts2', type: 'tigerspring', number: 2, weekStart: 8, icon: 'refresh-cw',
    title: 'Mønstre & rytmer',
    subtitle: 'Tigerspring 2 · Uge 8',
    crisisSymptoms: ['Kræver mere opmærksomhed', 'Utrøstelig græd', 'Sover dårligt', 'Sutte- og klamreadfærd'],
    newSkills: ['Genkender enkle mønstre', 'Kan holde hovedet mere stabilt', 'Laver gurgle-lyde', 'Viser interesse for hænder og fødder'],
    tips: ['Brug rutiner og gentagelse', 'Leg med rasle og bløde legetøj', 'Lav øjenkontakt og smil ofte', 'Gå korte ture for frisk luft'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-0-1-aar/barnets-udvikling-2-4-maaneder/',
  },
  {
    id: 'ts3', type: 'tigerspring', number: 3, weekStart: 12, icon: 'waves',
    title: 'Overgangs-verden',
    subtitle: 'Tigerspring 3 · Uge 12',
    crisisSymptoms: ['Mere klynkende', 'Vil sutte og bæres hele tiden', 'Urolig søvn', 'Skifter hurtigt mellem glad og ked'],
    newSkills: ['Glidende bevægelser med arme og ben', 'Griber efter ting bevidst', 'Drejer hoved mod lyde', 'Mere varierede lyde og pludren'],
    tips: ['Tilbyd gribelegetøj', 'Leg "flyve-baby" og gyngespil', 'Snak med barnet om hvad I gør', 'Acceptér at rutinen ændrer sig midlertidigt'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-0-1-aar/barnets-udvikling-2-4-maaneder/',
  },
  {
    id: 'ts4', type: 'tigerspring', number: 4, weekStart: 19, icon: 'target',
    title: 'Begivenhedernes verden',
    subtitle: 'Tigerspring 4 · Uge 19',
    crisisSymptoms: ['Søvnproblemer og uro', 'Græder lettere og oftere', 'Vil have mere kontakt', 'Appetitændringer'],
    newSkills: ['Forstår årsag-virkning', 'Griber målrettet efter ting', 'Ruller fra mave til ryg', 'Griner højt og pludrer mere'],
    tips: ['Leg med "forsvind og kom igen"', 'Tilbyd ting barnet kan undersøge', 'Sæt ord på handlinger (nu tager vi bleen af)', 'Hold fast i gode rutiner'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-0-1-aar/barnets-udvikling-4-6-maaneder/',
  },
  {
    id: 'ts5', type: 'tigerspring', number: 5, weekStart: 26, icon: 'link',
    title: 'Relationer og sammenhænge',
    subtitle: 'Tigerspring 5 · Uge 26',
    crisisSymptoms: ['Mere klæbende og utryg', 'Fremmedangst begynder', 'Søvn bliver forstyrret', 'Vil ikke lægges fra sig'],
    newSkills: ['Forstår afstande og rum', 'Begynder at kravle eller bevæge sig', 'Fremmedangst (genkender "mine" vs "fremmede")', 'Undersøger ting mere systematisk'],
    tips: ['Respektér fremmedangsten', 'Leg med simple klodser og stable-ting', 'Babysikr hjemmet — barnet bliver mobilt', 'Giv tid til at vænne sig til nye mennesker'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-0-1-aar/barnets-udvikling-6-9-maaneder/',
  },
  {
    id: 'ts6', type: 'tigerspring', number: 6, weekStart: 37, icon: 'layout-grid',
    title: 'Kategorisering',
    subtitle: 'Tigerspring 6 · Uge 37',
    crisisSymptoms: ['Klynger sig til forældre', 'Humørsvingninger', 'Vil gøre ting selv men bliver frustreret', 'Protesterer mod bleskift og påklædning'],
    newSkills: ['Sorterer og kategoriserer ting', 'Forstår "inde i" og "oven på"', 'Peger og siger enkle ord', 'Efterligner handlinger og lyde'],
    tips: ['Tilbyd sorteringslegetøj (farver, former)', 'Navngiv ting i hverdagen', 'Lad barnet "hjælpe" med simple opgaver', 'Vær tålmodig med frustrationer'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-0-1-aar/barnets-udvikling-9-12-maaneder/',
  },
  {
    id: 'ts7', type: 'tigerspring', number: 7, weekStart: 46, icon: 'list-ordered',
    title: 'Sekvenser og procedurer',
    subtitle: 'Tigerspring 7 · Uge 46',
    crisisSymptoms: ['Raserianfald og frustration', 'Klæbende adfærd vender tilbage', 'Nægter at sove', 'Kræsent med mad'],
    newSkills: ['Forstår rækkefølge (først sko, så gå ud)', 'Kan stable og bygge', 'Bruger ting som "værktøj"', 'Forsøger at sige flere ord'],
    tips: ['Fortæl hvad der skal ske (nu vasker vi hænder, så spiser vi)', 'Tilbyd bygge- og konstruktionslegetøj', 'Læs bøger med enkle historier', 'Giv valgmuligheder (rød eller blå trøje?)'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-1-5-aar/barnets-udvikling-1-aar/',
  },
  {
    id: 'ts8', type: 'tigerspring', number: 8, weekStart: 55, icon: 'map',
    title: 'Programmer og handlingsplaner',
    subtitle: 'Tigerspring 8 · Uge 55',
    crisisSymptoms: ['Stædighed og "nej"-fase', 'Vil bestemme selv', 'Vrede-udbrud', 'Separation anxiety'],
    newSkills: ['Planlægger simple handlinger', 'Rolleleg begynder (fodre dukken)', 'Vokser ordforråd hurtigt', 'Kan pege ud ting i bøger'],
    tips: ['Giv plads til selvstændighed', 'Sæt tydelige, kærlige grænser', 'Leg rollelege (lege køkken, dukker)', 'Brug positive formuleringer (gå pænt i stedet for lad være med at løbe)'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-1-5-aar/barnets-udvikling-1-aar/',
  },
  {
    id: 'ts9', type: 'tigerspring', number: 9, weekStart: 60, icon: 'scale',
    title: 'Principper og normer',
    subtitle: 'Tigerspring 9 · Uge 60',
    crisisSymptoms: ['Trodsalder intensiveres', 'Nægter at samarbejde', 'Udfordrer regler bevidst', 'Kan virke aggressiv (slå, bide)'],
    newSkills: ['Forstår regler og normer', 'Kan forhandle og insistere', 'Udvikler empati', 'Laver mere kompleks rolleleg'],
    tips: ['Vær konsekvent med regler', 'Anerkend følelser (du er vred, det forstår jeg)', 'Giv forudsigelighed', 'Leg med andre børn for social træning'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-1-5-aar/barnets-udvikling-2-aar/',
  },
  {
    id: 'ts10', type: 'tigerspring', number: 10, weekStart: 75, icon: 'globe',
    title: 'Systemer — verdens store sammenhæng',
    subtitle: 'Tigerspring 10 · Uge 75',
    crisisSymptoms: ['Svære følelsesmæssige udsving', 'Mareridt og søvnproblemer', 'Klamrer sig til rutiner', 'Kan virke urolig og usikker'],
    newSkills: ['Forstår systemer og sammenhænge', 'Begynder at forstå tid (i morgen, i går)', 'Kan lege med andre børn', 'Fantasileg blomstrer'],
    tips: ['Forklar sammenhænge i hverdagen', 'Besvar "hvorfor"-spørgsmål tålmodigt', 'Brug billedbøger om følelser', 'Giv rum til fantasileg og kreativitet'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-1-5-aar/barnets-udvikling-2-aar/',
  },

  // ── Post-tigerspring development phases ──
  {
    id: 'phase-1-2', type: 'phase', weekStart: 52, weekEnd: 104, icon: 'footprints',
    title: 'Den krydsende toddler',
    subtitle: '1–2 år',
    crisisSymptoms: ['Trodsanfald begynder', 'Frustrationer over begrænsninger', 'Separationsangst kan blusse op', 'Afprøver grænser konstant'],
    newSkills: ['Går selvstændigt', 'Siger 10-50 ord', 'Forstår simple instruktioner', 'Peger og viser ting til voksne'],
    tips: ['Babysikr grundigt — alt udforskes', 'Navngiv følelser for barnet', 'Tilbyd simple valgmuligheder', 'Masser af bevægelse og udeliv'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-1-5-aar/barnets-udvikling-1-aar/',
  },
  {
    id: 'phase-2-3', type: 'phase', weekStart: 104, weekEnd: 156, icon: 'message-circle',
    title: 'Sprogets eksplosion og jeg-bevidsthed',
    subtitle: '2–3 år',
    crisisSymptoms: ['Trodsalder i fuld blomst', '"Nej!" og "Selv!" dominerer', 'Kan blive fysisk (slå, bide, sparke)', 'Intense følelsesmæssige udbrud'],
    newSkills: ['Sprog eksploderer til 200-1000 ord', 'Sætninger med 2-4 ord', 'Begynder at forstå "mig/dig"', 'Toilettræning bliver muligt'],
    tips: ['Giv plads til selvstændighed inden for rammer', 'Brug korte, klare sætninger', 'Anerkend følelser før du korrigerer adfærd', 'Læs højt hver dag'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-1-5-aar/barnets-udvikling-2-aar/',
  },
  {
    id: 'phase-3-4', type: 'phase', weekStart: 156, weekEnd: 208, icon: 'wand',
    title: 'Fantasiens guldalder og spørgsmålsstormen',
    subtitle: '3–4 år',
    crisisSymptoms: ['Mareridt og natteangst', 'Bang for mørke og monstre', '"Hvorfor?"-spørgsmål i uendelighed', 'Kan lyve for første gang'],
    newSkills: ['Fantasileg i komplekse scenarier', 'Tegner cirkler og "mennesker"', 'Forstår grundlæggende tal og farver', 'Kan fortælle korte historier'],
    tips: ['Tag fantasien alvorligt', 'Besvar spørgsmål tålmodigt', 'Leg med andre børn regelmæssigt', 'Introducer simple brætspil'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-1-5-aar/barnets-udvikling-3-aar/',
  },
  {
    id: 'phase-4-6', type: 'phase', weekStart: 208, weekEnd: 312, icon: 'school',
    title: 'Regler, fairness og identitet',
    subtitle: '4–6 år',
    crisisSymptoms: ['Optaget af retfærdighed', 'Sammenligner sig med andre børn', 'Kan ekskludere andre i leg', 'Bekymringer om at "gøre det forkert"'],
    newSkills: ['Forstår regler i spil og leg', 'Kan skrive eget navn', 'Udvikler venskaber', 'Begynder at forstå tid og dage'],
    tips: ['Leg brætspil og øv at tabe/vinde', 'Tal om venskaber og konflikter', 'Forbered skolestart gradvist', 'Giv ansvar (dække bord, rydde op)'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-1-5-aar/barnets-udvikling-4-aar/',
  },
  {
    id: 'phase-6-8', type: 'phase', weekStart: 312, weekEnd: 416, icon: 'book-open',
    title: 'Konkrete operationer og læringsidentitet',
    subtitle: '6–8 år',
    crisisSymptoms: ['Præstationsangst kan opstå', 'Social sammenligning intensiveres', 'Kan føle sig "dum" ved udfordringer', 'Konflikter med venner bliver dybere'],
    newSkills: ['Lærer at læse og regne', 'Logisk tænkning udvikles', 'Kan se ting fra andres perspektiv', 'Forstår tid, penge og mål'],
    tips: ['Ros indsats, ikke resultat', 'Hjælp med lektier uden at overtage', 'Støt venskaber aktivt', 'Hold fast i gode sengetidsrutiner'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-5-18-aar/barnets-udvikling-6-10-aar/',
  },
  {
    id: 'phase-8-10', type: 'phase', weekStart: 416, weekEnd: 520, icon: 'trophy',
    title: 'Industri vs. mindreværd',
    subtitle: '8–10 år',
    crisisSymptoms: ['Kan tvivle på egne evner', 'Social hierarki bliver vigtigt', 'Mobning kan forekomme', 'Begynder at holde ting for sig selv'],
    newSkills: ['Mestrer komplekse færdigheder (sport, musik)', 'Udvikler hobbyer og interesser', 'Kan arbejde selvstændigt', 'Moral og retfærdighed er vigtig'],
    tips: ['Støt barnets interesser og hobbyer', 'Tal åbent om mobning og venskaber', 'Giv passende ansvar og frihed', 'Vær tilgængelig uden at trænge sig på'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-5-18-aar/barnets-udvikling-6-10-aar/',
  },
  {
    id: 'phase-10-13', type: 'phase', weekStart: 520, weekEnd: 676, icon: 'search',
    title: 'Identitetssøgning og venners voksende magt',
    subtitle: '10–13 år',
    crisisSymptoms: ['Puberteten begynder', 'Humørsvingninger og irritabilitet', 'Trækker sig fra forældre', 'Intens optagethed af venner'],
    newSkills: ['Abstrakt tænkning begynder', 'Stærke meninger og holdninger', 'Digital kompetence vokser', 'Kan reflektere over egne følelser'],
    tips: ['Giv plads men bevar forbindelsen', 'Tal om krop og pubertet åbent', 'Sæt rammer for skærmtid sammen', 'Vis interesse for deres verden'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-5-18-aar/barnets-udvikling-10-13-aar/',
  },
  {
    id: 'phase-13-15', type: 'phase', weekStart: 676, weekEnd: 780, icon: 'brain',
    title: 'Identitetskrise og hjernens ombygning',
    subtitle: '13–15 år',
    crisisSymptoms: ['Intens identitetssøgning', 'Konflikter med autoriteter', 'Risikoadfærd kan opstå', 'Følelsesmæssig ustabilitet'],
    newSkills: ['Udvikler egne værdier', 'Kan tænke hypotetisk og filosofisk', 'Forstår komplekse sociale dynamikker', 'Udvikler romantiske interesser'],
    tips: ['Lyt mere end du taler', 'Vær en tryg base de kan vende tilbage til', 'Diskutér (snarere end diktér) regler', 'Tal åbent om risici uden at skræmme'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-5-18-aar/barnets-udvikling-13-15-aar/',
  },
  {
    id: 'phase-16-18', type: 'phase', weekStart: 780, weekEnd: 936, icon: 'graduation-cap',
    title: 'Identitetskonsolidering og fremtid',
    subtitle: '16–18 år',
    crisisSymptoms: ['Eksistentielle spørgsmål', 'Pres om uddannelse og fremtid', 'Kan trække sig eller teste grænser', 'Behov for både frihed og støtte'],
    newSkills: ['Konsoliderer identitet og værdier', 'Kan planlægge langsigtet', 'Dybe og meningsfulde venskaber', 'Ansvarsfølelse og selvstændighed'],
    tips: ['Behandl dem som unge voksne', 'Vær rådgiver, ikke diktator', 'Hjælp med fremtidsplaner uden at presse', 'Hold familietid hellig trods travlhed'],
    link: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-telefonraadgivning/telefonraadgivning-5-18-aar/barnets-udvikling-16-18-aar/',
  },
];

const milestoneCategories = [
  { value: 'health', label: 'Sundhed', icon: Stethoscope, color: 'bg-rose-100 text-rose-600' },
  { value: 'school', label: 'Skole', icon: GraduationCap, color: 'bg-blue-100 text-blue-600' },
  { value: 'development', label: 'Udvikling', icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
  { value: 'social', label: 'Social', icon: Users, color: 'bg-purple-100 text-purple-600' },
];


export function Borneoverblik() {
  const {
    activeTab,
    currentUser,
    users,
    children,
    milestones,
    milestonesAction,
    setMilestonesAction,
    milestoneFormMode,
    setMilestoneFormMode,
  } = useAppStore();
  const { createMilestone, updateMilestone: apiUpdateMilestone, deleteMilestone: apiDeleteMilestone } = useApiActions();
  const [isSaving, setIsSaving] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [stageDetailOpen, setStageDetailOpen] = useState(false);
  const [viewingStageIndex, setViewingStageIndex] = useState<number | null>(null);
  const [newMilestone, setNewMilestone] = useState<{
    title: string;
    description: string;
    date: string;
    category: Milestone['category'];
  }>({
    title: '',
    description: '',
    date: '',
    category: 'development',
  });

  const currentChild = children[0];
  const parent1 = users.find(u => u.id === currentChild?.parent1Id);
  // Stable parent2: if co-parent not in app, show "Forælder 2" pill
  const rawParent2 = users.find(u => u.id === currentChild?.parent2Id);
  const parent2 = rawParent2 && rawParent2.id !== parent1?.id
    ? rawParent2
    : null;
  const parent2Name = parent2?.name || 'Forælder 2';

  // Calculate age
  const getAge = () => {
    if (!currentChild) return '';
    const birthDate = parseISO(currentChild.birthDate);
    const years = differenceInYears(new Date(), birthDate);
    const months = differenceInMonths(new Date(), birthDate) % 12;

    if (years === 0) return `${months} måneder`;
    if (months === 0) return `${years} år`;
    return `${years} år og ${months} måneder`;
  };

  // ── Tigerspring / Development Stage Calculation ──
  const stageInfo = useMemo(() => {
    if (!currentChild) return null;
    const birthDate = parseISO(currentChild.birthDate);
    const ageWeeks = differenceInWeeks(new Date(), birthDate);
    const ageMonths = differenceInMonths(new Date(), birthDate);

    // Find the current stage based on child's age in weeks
    // For tigerspring: child is "in" a tigerspring when within ±2 weeks of the weekStart
    // For phases: child is in the phase when ageWeeks is between weekStart and weekEnd

    let currentIndex = -1;

    // First check phases (post-tigerspring) — only if child is older than ~18 months
    if (ageWeeks >= 78) {
      // After tigerspring 10, use phases
      for (let i = developmentStages.length - 1; i >= 0; i--) {
        const stage = developmentStages[i];
        if (stage.type === 'phase' && stage.weekEnd && ageWeeks >= stage.weekStart && ageWeeks < stage.weekEnd) {
          currentIndex = i;
          break;
        }
      }
    }

    // If no phase matched, check tigerspring (for younger children)
    if (currentIndex === -1) {
      // Find the closest tigerspring the child is currently in or approaching
      const tigersprings = developmentStages.filter(s => s.type === 'tigerspring');

      for (let i = tigersprings.length - 1; i >= 0; i--) {
        const ts = tigersprings[i];
        const tsIdx = developmentStages.indexOf(ts);
        // Child is "in" this tigerspring if within 2 weeks before to 2 weeks after
        if (ageWeeks >= ts.weekStart - 2 && ageWeeks <= ts.weekStart + 2) {
          currentIndex = tsIdx;
          break;
        }
        // Child has passed this tigerspring — show it as current until next one
        if (ageWeeks > ts.weekStart + 2) {
          // Find next tigerspring
          const nextTs = tigersprings[i + 1];
          if (nextTs) {
            // Between two tigersprings: show the upcoming one if within 3 weeks, else show passed one
            if (ageWeeks >= nextTs.weekStart - 3) {
              currentIndex = developmentStages.indexOf(nextTs);
            } else {
              currentIndex = tsIdx;
            }
          } else {
            currentIndex = tsIdx; // Last tigerspring
          }
          break;
        }
      }

      // Very young baby — hasn't reached first tigerspring yet
      if (currentIndex === -1 && ageWeeks < tigersprings[0].weekStart) {
        currentIndex = 0;
      }
    }

    // Fallback
    if (currentIndex === -1) currentIndex = developmentStages.length - 1;

    const currentStage = developmentStages[currentIndex];

    // Progress within stage
    let progress = 0;
    if (currentStage.type === 'tigerspring') {
      // Progress relative to approach → peak → after
      const diff = ageWeeks - (currentStage.weekStart - 2);
      progress = Math.min(1, Math.max(0, diff / 4)); // 4 weeks window
    } else if (currentStage.weekEnd) {
      const range = currentStage.weekEnd - currentStage.weekStart;
      progress = Math.min(1, Math.max(0, (ageWeeks - currentStage.weekStart) / range));
    }

    return {
      currentIndex,
      currentStage,
      ageWeeks,
      ageMonths,
      progress,
      totalStages: developmentStages.length,
    };
  }, [currentChild]);

  const handleAddMilestone = async () => {
    if (!newMilestone.title || !newMilestone.date || !currentChild) return;
    setIsSaving(true);
    try {
      await createMilestone({
        childId: currentChild.id,
        title: newMilestone.title,
        description: newMilestone.description,
        date: newMilestone.date,
        category: newMilestone.category,
        addedBy: currentUser?.id || '',
        photos: [],
      });
      toast.success('Milepæl tilføjet');
      setMilestoneFormMode(null);
      setNewMilestone({ title: '', description: '', date: '', category: 'development' });
    } catch {
      toast.error('Kunne ikke tilføje milepæl');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone || !newMilestone.title || !newMilestone.date) return;
    setIsSaving(true);
    try {
      await apiUpdateMilestone(editingMilestone.id, {
        title: newMilestone.title,
        description: newMilestone.description || undefined,
        date: newMilestone.date,
        category: newMilestone.category,
      });
      toast.success('Milepæl opdateret');
      setMilestoneFormMode(null);
      setEditingMilestone(null);
      setNewMilestone({ title: '', description: '', date: '', category: 'development' });
    } catch {
      toast.error('Kunne ikke opdatere milepæl');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!editingMilestone) return;

    await apiDeleteMilestone(editingMilestone.id);

    setMilestoneFormMode(null);
    setEditingMilestone(null);
    setNewMilestone({ title: '', description: '', date: '', category: 'development' });
    toast.success('Milepæl slettet');
  };


  if (!currentChild) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-500">Intet barn fundet</p>
      </div>
    );
  }

  // ─── Listen to milestonesAction from TopBar ───
  useEffect(() => {
    if (milestonesAction === 'add') {
      setNewMilestone({ title: '', description: '', date: '', category: 'development' });
      setMilestoneFormMode('add');
      setMilestonesAction(null);
    }
  }, [milestonesAction, setMilestonesAction]);

  // ─── Milestones: full-page add form ───
  if (activeTab === 'milestones' && milestoneFormMode === 'add') {
    return (
      <div className="space-y-3 py-1">
        <OverblikSidePanel />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground">Titel</Label>
            <Input
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
              placeholder="F.eks. Første skoledag"
              className="rounded-[8px] border-border bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground">Beskrivelse (valgfri)</Label>
            <Textarea
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
              placeholder="Beskriv begivenheden..."
              className="rounded-[8px] border-border bg-card min-h-[80px] resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground">Dato</Label>
            <Input
              type="date"
              value={newMilestone.date}
              onChange={(e) => setNewMilestone({...newMilestone, date: e.target.value})}
              className="rounded-[8px] border-border bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground">Kategori</Label>
            <SelectSheet
              value={newMilestone.category}
              onValueChange={(v) => setNewMilestone({...newMilestone, category: v as Milestone['category']})}
              title="Kategori"
              options={milestoneCategories.map(cat => ({ value: cat.value, label: cat.label, icon: <cat.icon className="w-4 h-4" /> }))}
              className="rounded-[8px] border-border bg-card"
            />
          </div>
          <Button onClick={handleAddMilestone} className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#f58a2d] text-white hover:bg-[#e07b1e]" disabled={!newMilestone.title || !newMilestone.date || isSaving}>
            Tilføj milepæl
          </Button>
        </div>
        <SavingOverlay open={isSaving} />
      </div>
    );
  }

  // ─── Milestones: full-page edit form ───
  if (activeTab === 'milestones' && milestoneFormMode === 'edit' && editingMilestone) {
    return (
      <div className="space-y-3 py-1">
        <OverblikSidePanel />
        <div className="flex items-center justify-between pt-2 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => { setMilestoneFormMode(null); setEditingMilestone(null); }} className="transition-colors">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <h2 className="text-lg font-semibold text-foreground">Rediger milepæl</h2>
          </div>
          <button onClick={handleDeleteMilestone} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
            Slet
          </button>
        </div>
        <div className="space-y-2 rounded-2xl bg-card p-4 border border-border">
          <div className="space-y-2">
            <Label>Titel</Label>
            <Input
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
              placeholder="F.eks. Første skoledag"
            />
          </div>
          <div className="space-y-2">
            <Label>Beskrivelse (valgfri)</Label>
            <Textarea
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
              placeholder="Beskriv begivenheden..."
            />
          </div>
          <div className="space-y-2">
            <Label>Dato</Label>
            <Input
              type="date"
              value={newMilestone.date}
              onChange={(e) => setNewMilestone({...newMilestone, date: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <SelectSheet
              value={newMilestone.category}
              onValueChange={(v) => setNewMilestone({...newMilestone, category: v as Milestone['category']})}
              title="Kategori"
              options={milestoneCategories.map(cat => ({ value: cat.value, label: cat.label, icon: <cat.icon className="w-4 h-4" /> }))}
            />
          </div>
          <Button onClick={handleUpdateMilestone} className="w-full flex items-center justify-center gap-2" disabled={!newMilestone.title || !newMilestone.date || isSaving}>
            Gem ændringer
          </Button>
        </div>
        <SavingOverlay open={isSaving} />
      </div>
    );
  }

  // ─── Milestones list view ───
  if (activeTab === 'milestones') {
    return (
      <div className="space-y-3 py-1">
        <OverblikSidePanel />
        <div className="text-center pt-2 pb-2">
          <h1 className="text-2xl font-bold text-foreground">Milepæle & Begivenheder</h1>
          <p className="text-sm text-muted-foreground mt-1">{currentChild.name}</p>
        </div>

        <div className="space-y-2">
          {milestones
            .filter(m => m.childId === currentChild.id)
            .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
            .map((milestone, index) => {
              const category = milestoneCategories.find(c => c.value === milestone.category);
              const addedBy = users.find(u => u.id === milestone.addedBy);
              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    type="button"
                    className="w-full text-left rounded-[8px] border border-border bg-card px-4 py-3.5 transition-colors hover:bg-card"
                    onClick={() => {
                      setEditingMilestone(milestone);
                      setNewMilestone({
                        title: milestone.title,
                        description: milestone.description || '',
                        date: milestone.date,
                        category: milestone.category,
                      });
                      setMilestoneFormMode('edit');
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0",
                        category?.color || 'bg-background text-muted-foreground'
                      )}>
                        {category ? <category.icon className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[14px] font-semibold text-foreground">{milestone.title}</p>
                            {milestone.description && (
                              <p className="text-[12px] text-muted-foreground mt-0.5">{milestone.description}</p>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground font-medium shrink-0 ml-2">
                            {formatDate(milestone.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={addedBy?.avatar} />
                            <AvatarFallback className="text-[8px]">{addedBy?.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] text-muted-foreground">
                            Tilføjet af {addedBy?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}

          {milestones.filter(m => m.childId === currentChild.id).length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Ingen milepæle endnu</p>
              <p className="text-[13px] text-muted-foreground">Tilføj vigtige begivenheder i dit barns liv</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 py-1">
      <OverblikSidePanel />
      {/* Header with child info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-xl">
          <AvatarImage src={currentChild.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentChild.name)}`} />
          <AvatarFallback className="text-3xl bg-secondary text-foreground">
            {currentChild.name[0]}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold text-foreground">{currentChild.name}</h1>
        <p className="text-muted-foreground">{getAge()} gammel</p>
        <p className="text-[13px] text-muted-foreground">Født {formatDate(currentChild.birthDate)}</p>
      </motion.div>

      {/* Parents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center gap-3"
      >
        {/* Current user (me) — dark/sort style (matcher Samværsplan) */}
        {parent1 && (
          <div className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2",
            parent1.id === currentUser?.id
              ? "border border-primary bg-primary"
              : "border border-orange-tint bg-orange-tint"
          )}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={parent1.avatar} />
              <AvatarFallback className={cn(
                "text-xs",
                parent1.id === currentUser?.id
                  ? "bg-primary text-white"
                  : "bg-[#f58a2d] text-white"
              )}>
                {parent1.name[0]}
              </AvatarFallback>
            </Avatar>
            <span className={cn(
              "text-sm font-medium",
              parent1.id === currentUser?.id ? "text-white" : "text-[#cc6f1f]"
            )}>{parent1.name}</span>
          </div>
        )}
        {/* Parent 2 — warm/orange style (placeholder if not in app) */}
        <div className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2",
          parent2 && parent2.id === currentUser?.id
            ? "border border-primary bg-primary"
            : "border border-orange-tint bg-orange-tint"
        )}>
          <Avatar className="w-8 h-8">
            {parent2 && <AvatarImage src={parent2.avatar} />}
            <AvatarFallback className={cn(
              "text-xs",
              parent2 && parent2.id === currentUser?.id
                ? "bg-primary text-white"
                : "bg-[#f58a2d] text-white"
            )}>
              {parent2Name[0]}
            </AvatarFallback>
          </Avatar>
          <span className={cn(
            "text-sm font-medium",
            parent2 && parent2.id === currentUser?.id ? "text-white" : "text-[#cc6f1f]"
          )}>{parent2Name}</span>
        </div>
      </motion.div>

      {/* Tigerspring / Development Stage Card */}
      {stageInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button
            onClick={() => { setViewingStageIndex(stageInfo.currentIndex); setStageDetailOpen(true); }}
            className="w-full rounded-[8px] border-2 border-border bg-card p-4 text-left transition-all hover:border-orange-tint hover:shadow-[0_2px_12px_rgba(245,138,45,0.08)] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {stageInfo.currentStage.type === 'tigerspring' ? 'Tigerspring' : 'Udviklingsfase'}
                  </span>
                  {stageInfo.currentStage.type === 'tigerspring' && (
                    <span className="rounded-full bg-orange-tint px-2 py-0.5 text-[10px] font-bold text-[#f58a2d]">
                      {stageInfo.currentStage.number}/10
                    </span>
                  )}
                </div>
                <p className="mt-1 text-lg font-bold text-foreground leading-snug">
                  {stageInfo.currentStage.title}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {stageInfo.currentStage.subtitle} · {stageInfo.ageWeeks} uger gammel
                </p>
              </div>
              <div className="relative ml-3 h-14 w-14 flex-shrink-0">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" stroke="#f0efe8" />
                  <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" stroke="#f58a2d"
                    strokeLinecap="round"
                    strokeDasharray={`${stageInfo.progress * 150.8} 150.8`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {stageInfo.currentStage.type === 'tigerspring'
                    ? <Sparkles className="h-5 w-5 text-[#f58a2d]" />
                    : <Brain className="h-5 w-5 text-[#f58a2d]" />
                  }
                </div>
              </div>
            </div>
            {/* Mini progress bar showing position in all stages */}
            <div className="mt-3 flex gap-[2px]">
              {developmentStages.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i < stageInfo.currentIndex ? "bg-[#f58a2d]" :
                    i === stageInfo.currentIndex ? "bg-primary" :
                    "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Tryk for at se detaljer →</p>
          </button>
        </motion.div>
      )}

      {/* ── Stage Detail Dialog ── */}
      <AnimatePresence>
        {stageDetailOpen && viewingStageIndex !== null && (
          <Dialog open={stageDetailOpen} onOpenChange={setStageDetailOpen}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
              {(() => {
                const stage = developmentStages[viewingStageIndex];
                if (!stage) return null;
                const isFirst = viewingStageIndex === 0;
                const isLast = viewingStageIndex === developmentStages.length - 1;
                const isCurrent = stageInfo && viewingStageIndex === stageInfo.currentIndex;
                return (
                  <>
                    <DialogHeader className="pr-8">
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="rounded-full bg-orange-tint px-2 py-0.5 text-[10px] font-bold text-[#f58a2d]">
                            Nuværende
                          </span>
                        )}
                        {stage.type === 'tigerspring' && (
                          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            Tigerspring {stage.number}
                          </span>
                        )}
                        {stage.type === 'phase' && (
                          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            Udviklingsfase
                          </span>
                        )}
                      </div>
                      <DialogTitle className="flex items-center gap-2 text-left">
                        {(() => {
                          const StageIcon = stageIconMap[stage.icon] || Sparkles;
                          return <StageIcon className="h-5 w-5 shrink-0 text-[#f58a2d]" />;
                        })()}
                        <span className="text-[18px] leading-snug">{stage.title}</span>
                      </DialogTitle>
                      <p className="text-[13px] text-muted-foreground">{stage.subtitle}</p>
                    </DialogHeader>

                    <div className="space-y-2 pt-2">
                      {/* Crisis Symptoms */}
                      <div className="rounded-[8px] bg-orange-tint p-3.5">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-orange-tint">
                            <Sparkles className="h-3.5 w-3.5 text-[#e8842a]" />
                          </div>
                          <span className="text-[13px] font-bold text-[#cc6f1f]">
                            {stage.type === 'tigerspring' ? 'Tegn på krise' : 'Udfordringer'}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {stage.crisisSymptoms.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-[#8b5a24]">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#f5a54a]" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* New Skills */}
                      <div className="rounded-[8px] bg-green-tint p-3.5">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-green-tint">
                            <Brain className="h-3.5 w-3.5 text-[#3d8b3d]" />
                          </div>
                          <span className="text-[13px] font-bold text-[#2d6e2d]">Nye færdigheder</span>
                        </div>
                        <ul className="space-y-1.5">
                          {stage.newSkills.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-[#3d6b3d]">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#6dba6d]" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tips */}
                      <div className="rounded-[8px] bg-card p-3.5">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-muted">
                            <Baby className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <span className="text-[13px] font-bold text-foreground">Tips til dig</span>
                        </div>
                        <ul className="space-y-1.5">
                          {stage.tips.map((t, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-foreground">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* External link */}
                      <button
                        onClick={() => window.open(stage.link, '_blank', 'noopener,noreferrer')}
                        className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-card p-3 transition-colors hover:bg-card"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-orange-tint">
                          <ExternalLink className="h-4 w-4 text-[#f58a2d]" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-[13px] font-semibold text-foreground">Læs mere</p>
                          <p className="text-[11px] text-muted-foreground">Sundhed.dk — offentlig vejledning</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>

                      {/* Navigation between stages */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => !isFirst && setViewingStageIndex(viewingStageIndex - 1)}
                          disabled={isFirst}
                          className={cn(
                            "flex items-center gap-1 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-colors",
                            isFirst
                              ? "text-muted-foreground cursor-not-allowed"
                              : "text-muted-foreground hover:bg-background"
                          )}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Forrige
                        </button>

                        <span className="text-[12px] font-medium text-muted-foreground">
                          {viewingStageIndex + 1} / {developmentStages.length}
                        </span>

                        <button
                          onClick={() => !isLast && setViewingStageIndex(viewingStageIndex + 1)}
                          disabled={isLast}
                          className={cn(
                            "flex items-center gap-1 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-colors",
                            isLast
                              ? "text-muted-foreground cursor-not-allowed"
                              : "text-muted-foreground hover:bg-background"
                          )}
                        >
                          Næste
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <SavingOverlay open={isSaving} />
    </div>
  );
}
