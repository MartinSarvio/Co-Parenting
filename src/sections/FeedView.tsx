import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  Heart,
  MessageCircle,
  Plus,
  Users,
  ChevronLeft,
  MoreHorizontal,
  X,
  ImagePlus,
  Send,
  Pencil,
  Trash2,
  Flag,
  EyeOff,
  Link,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createPortal } from 'react-dom';
import type { CatalogProduct } from '@/lib/etilbudsavis';
import { toast } from 'sonner';
import { fetchOffers, fetchGiftOffers, type Offer } from '@/lib/offers';
import { trackEvent } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/utils';
import { useApiActions } from '@/hooks/useApiActions';
import { lookupProductByName, trackProductClick } from '@/lib/productLookup';
import type { WishItem } from '@/types';
import { TilbudMainPage } from '@/components/custom/TilbudMainPage';
import { TilbudStoreView } from '@/components/custom/TilbudStoreView';
import { UploadedBatchView } from '@/components/custom/UploadedBatchView';
import { ConfirmCloseDialog } from '@/components/custom/ConfirmCloseDialog';

/* ─── Types ─── */

interface ForumComment {
  id: string;
  name: string;
  text: string;
  time: string;
}

interface ForumPost {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
  comments: number;
  commentsList: ForumComment[];
  image: string;
  groupId?: string;
}

interface ForumGroup {
  id: string;
  name: string;
  image: string;
  members: number;
  type: 'open' | 'closed';
  description: string;
  isJoined: boolean;
  isSuggested?: boolean;
  rules?: string;
  ownerId: string;
  pendingRequests?: string[];
  requestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
}

/* ─── Demo-data ─── */

// TODO: Replace with Supabase news table
export const DEMO_NEWS = [
  {
    id: '1',
    title: 'Dansk studie: Pubertet starter tidligere — skilsmisse er en risikofaktor',
    description: 'Nyt studie fra Aarhus Universitet viser at puberteten starter ca. tre måneder tidligere end for tidligere generationer. Skilsmisse nævnes som risikofaktor.',
    fullText: 'Et dansk studie af næsten 16.000 børn over 10 år viser, at puberteten starter cirka tre måneder tidligere end hos tidligere generationer. Risikofaktorer inkluderer genetik, moderens sundhed under graviditeten, rygning under graviditet, overvægt i barndommen og psykosociale stressfaktorer som familiestress og fraværende fædre — nogle faktorer kan fremrykke puberteten med 4-5 måneder. Tidlig pubertet øger risikoen for stofskiftesygdomme, type 2-diabetes, hormonrelateret kræft og psykiske problemer. Forskerne understreger, at modificerbare risikofaktorer som overvægt og rygning under graviditet giver mulighed for at bremse denne bekymrende udvikling.',
    source: 'Aarhus Universitet / Medical Xpress',
    date: '26. feb 2026',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80',
    url: 'https://medicalxpress.com/news/2026-02-children-puberty-earlier-years.html',
  },
  {
    id: '2',
    title: 'Danmarks største undersøgelse af børns mentale trivsel er skudt i gang',
    description: '35.000 nordjyske skolebørn deltager i den hidtil største trivselsundersøgelse, som skal hjælpe børn i psykisk mistrivsel hurtigere.',
    fullText: 'Forskningsenheden for Børne- og Ungdomspsykiatrien, Region Nordjylland og folkeskoler i 10 nordjyske kommuner gennemfører en omfattende spørgeskemaundersøgelse af omkring 35.000 elever i 5.-10. klasse. Projektet hedder TiNBU og er en del af det 5-årige "Bedst for Os"-projekt, som er finansieret af Novo Nordisk Fonden (150 mio. kr.) og Obel Family Foundation (30 mio. kr.). Formålet er at tilvejebringe viden og konkrete løsninger til, hvordan man hurtigere kan hjælpe børn og unge i psykisk mistrivsel. Eleverne skal svare inden 20. april 2026, og forældre kan fravælge deltagelse.',
    source: 'SkagensAvis / Region Nordjylland',
    date: '23. feb 2026',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
    url: 'https://www.skagensavis.dk/2026/02/23/hidtil-stoerste-undersoegelse-af-nordjyske-boerns-mentale-trivsel-er-skudt-i-gang.html',
  },
  {
    id: '3',
    title: 'Hjerneudvikling fortsætter til 30\'erne — myten om 25 år afkræftet',
    description: 'Ny forskning viser at hjernen gennemgår vigtige udviklingsændringer helt frem til 32-årsalderen.',
    fullText: 'En stor hjerneskanning-undersøgelse af over 4.200 personer viser, at hjernen gennemgår en kritisk udviklingsperiode fra 9 til 32 år — langt ud over den populære myte om at hjerneudviklingen stopper ved 25 år. I denne periode balancerer hjernen mellem "segregation og integration": den bygger specialiserede tankecentre og forbinder dem med effektive neurale netværk. Efter 32-årsalderen skifter udviklingen retning, idet hjernen stabiliserer de etablerede forbindelser i stedet for at skabe nye.',
    source: 'ScienceDaily',
    date: '19. feb 2026',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',
    url: 'https://www.sciencedaily.com/releases/2026/02/260218031606.htm',
  },
  {
    id: '4',
    title: 'Fantasileg: Sådan udvikler børn selvregulering gennem leg',
    description: 'Nyt studie af 3-6-årige viser at fantasileg topper 10-15 minutter efter start — uafbrudt legetid er afgørende.',
    fullText: 'Et studie af 93 børn i alderen 3-6 år viser, at børn når maksimal engagement i fantasileg mellem 10 og 15 minutter efter legens start, uanset alder eller køn. Piger viste stærkere organisatoriske evner og mere komplekse fortællinger, mens drenge foretrak actionbaseret leg — men begge køn havde sammenlignelig fantasi. Yngre børn (3-4 år) leger mere spontant men med mindre vedholdenhed, mens ældre førskolebørn (5-6 år) har mere strukturerede og længere legesessioner. Forskerne understreger, at uafbrudt legetid giver børn mulighed for at udvikle selvregulering, som er afgørende for senere skolesucces.',
    source: 'Phys.org / SWPS University',
    date: '20. feb 2026',
    image: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=800&q=80',
    url: 'https://phys.org/news/2026-02-children-play.html',
  },
  {
    id: '5',
    title: 'Irina Olsens liv midt i en skilsmisse — ny TV 2-serie',
    description: 'Dokumentarserien "Irina i stykker" følger influenceren gennem de første seks måneder efter skilsmissen.',
    fullText: 'TV 2 sender dokumentarserien "Irina i stykker" fra 5. marts 2026 på TV 2 Play og TV 2 Echo. Serien følger influencer og iværksætter Irina Olsen gennem de første seks måneder efter bruddet med sin mand Morten "Faustix" Olsen, som hun var gift med i over ti år. Serien giver et hudløst ærligt indblik i kampen med økonomi, karriere og ny kærlighed efter bruddet. Redaktøren understreger, at serien skal skabe refleksion omkring skilsmisser, der rammer over 40 procent af danske ægteskaber.',
    source: 'TV 2',
    date: 'feb 2026',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    url: 'https://omtv2.tv2.dk/nyheder/2026/02/ny-serie-foelger-irina-olsens-liv-midt-i-en-skilsmisse/',
  },
  {
    id: '6',
    title: 'Ny aftale: Elever får hurtigere hjælp ved mistrivsel og fravær',
    description: 'Ny politisk aftale kræver at skoler kontakter forældre ved 10+ fraværsdage og laver støtteplaner uden at vente på diagnose.',
    fullText: 'En ny politisk aftale skal give elever, der mistrives eller har højt fravær, hurtigere hjælp i folkeskolen. Skolelederen skal kontakte forældre ved 10+ dages samlet fravær pr. kvartal og iværksætte en støtteplan ved 15+ dages fravær. Elever og forældre kan selv anmode om en støtteplan uden at vente på psykologisk vurdering. Den nuværende 9-timersgrænse for specialundervisning ophæves, så elever får støtte efter behov. Aftalen forventes implementeret fra skoleåret 2027/2028.',
    source: 'Børne- og Undervisningsministeriet',
    date: '15. jan 2026',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
    url: 'https://uvm.dk/aktuelt/nyheder/2026/januar/260115-ny-aftale-sikrer-elever-hurtigere-hjaelp-ved-mistrivsel-og-fravaer/',
  },
  {
    id: '7',
    title: 'Småbørn bruger to timer dagligt foran skærme — dobbelt så meget som anbefalet',
    description: 'UCL-studie: 2-årige bruger gennemsnitligt 129 minutter dagligt. Højt forbrug er forbundet med lavere ordforråd og flere emotionelle problemer.',
    fullText: 'Et studie fra University College London af over 4.700 engelske familier viser, at 2-årige i gennemsnit bruger 129 minutter dagligt foran skærme — mere end dobbelt af WHO\'s anbefalede maksimum på 60 minutter. Kun 34% af børnene overholdt retningslinjen. Børn med det højeste skærmforbrug (5 timer dagligt) viste kun 53% ordmestring mod 65% for børn med minimalt forbrug. De havde desuden dobbelt så stor risiko for emotionelle og adfærdsmæssige vanskeligheder. Interaktive aktiviteter som højtlæsning og tegning øgede sproguddannelsen markant — til 74% ordmestring.',
    source: 'University College London',
    date: '12. jan 2026',
    image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&q=80',
    url: 'https://www.myscience.org/en/news/wire/toddlers_spending_two_hours_on_screens_a_day-2026-ucl',
  },
  {
    id: '8',
    title: 'Mette Frederiksen i nytårstalen: "Tech-giganterne stjæler barndommen"',
    description: 'Statsministeren kræver hårdere regulering af tech-giganter og erkender at regeringen ikke har gjort nok for børn i mistrivsel.',
    fullText: 'I sin nytårstale 1. januar 2026 sagde statsminister Mette Frederiksen: "Der er nogle, der lige nu stjæler barndommen fra vores børn. Tech-giganterne." Hun foreslog, at ejerne af sociale medier skal "begynde at betale tilbage" for de milliarder, de har tjent på børns bekostning, og at tech-giganterne skal reguleres hårdere. Frederiksen erkendte: "Vi har ikke gjort nok for de børn, der mistrives" og kaldte det sit personlige ansvar at ændre situationen. Hun vil sætte sig i spidsen for at få tech-giganterne til at investere i børn og unges trivsel — både i Danmark og hele Europa.',
    source: 'Statsministeriet',
    date: '1. jan 2026',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
    url: 'https://stm.dk/statsministeren/taler/statsminister-mette-frederiksens-nytaarstale-1-januar-2026/',
  },
  {
    id: '9',
    title: 'Børnebidrag og nye satser for skilsmissefamilier i 2026',
    description: 'Normalbidrag stiger til 1.675 kr/måned. Nye gebyrer for ændring af bidrag koster nu 3.100 kr.',
    fullText: 'I 2026 stiger normalbidrag til børn til 1.675 kr. om måneden (op fra 1.603 kr. i 2025), bestående af grundbeløb på 17.796 kr. årligt og tillæg på 2.304 kr. Ansøgning om ændring af børnebidrag koster nu 3.100 kr. i Familieretshuset. Ansøgning om separation eller skilsmisse koster 875 kr. Forhøjet bidrag gælder når den bidragsydende forælder har en årsindkomst over 600.000 kr., med tillæg på 100%, 200% eller 300%. Desuden kan unge fra 15 år nu oprette bankkonti uden forældres samtykke.',
    source: 'Skilsmissefamilien.dk / OPkurser.dk',
    date: 'jan 2026',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    url: 'https://www.skilsmissefamilien.dk/post/satser-for-2026',
  },
  {
    id: '10',
    title: 'Skilsmisse kan påvirke børn negativt — selv i voksenlivet',
    description: 'Stort amerikansk studie: skilsmisse i tidlig barndom reducerer indkomst med 9-13% i 20\'erne og øger teenagegraviditeter med 63%.',
    fullText: 'Et nyt studie fra U.S. Census Bureau viser, at næsten en tredjedel af amerikanere født 1988-1993 oplevede forældrenes skilsmisse før voksenalderen. Skilsmisse i tidlig barndom reducerede børnenes indkomst i midten til slutningen af 20\'erne med 9-13%. Teenagegraviditeterne steg med 63% efter forældrenes skilsmisse. Skilsmissehusholde faldt fra den 57. til den 36. indkomstpercentil, og genvandt kun halvdelen over det næste årti. Afstanden mellem børn og den fraværende forælder steg med gennemsnitligt 100 miles (200+ miles efter 10 år).',
    source: 'U.S. Census Bureau',
    date: '20. jan 2026',
    image: 'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800&q=80',
    url: 'https://www.census.gov/library/stories/2026/01/divorce-affects-children.html',
  },
  {
    id: '11',
    title: 'Samarbejde med en svær eks: Når parallel forældreskab er løsningen',
    description: 'Parallel parenting minimerer direkte kontakt mellem forældre i højkonflikt-situationer, mens begge forbliver involverede i barnets liv.',
    fullText: 'Parallel parenting er en tilgang for forældre i højkonflikt-situationer, som minimerer direkte interaktion, mens begge forældre forbliver involverede i børnenes liv. I modsætning til traditionelt samarbejdende forældreskab, der kræver fælles kommunikation og beslutningstagning, tillader parallel parenting hver forælder at fungere mere uafhængigt i deres samværsperioder. Strategien fokuserer på at sætte grænser og reducere stress, mens man forbliver engageret. Metoden beskytter børn mod igangværende konflikter ved at begrænse kommunikationen mellem eks-partnere. Det er et praktisk alternativ, når traditionelt forældreskab efter skilsmissen ikke er realistisk.',
    source: 'Daniels & Taylor',
    date: '29. jan 2026',
    image: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=800&q=80',
    url: 'https://www.danielstaylor.com/2026/01/co-parenting-with-a-difficult-ex-when-parallel-parenting-is-the-answer/',
  },
  {
    id: '12',
    title: 'Store ændringer for familieret, arv og børns trivsel i 2026',
    description: 'Nye gebyrer for skilsmisse, højere arvebeløb, og 15-årige kan nu oprette bankkonti uden forældres samtykke.',
    fullText: 'I 2026 sker der en række ændringer på det familieretlige område. Ansøgning om separation eller skilsmisse koster nu 875 kr., mens ændring af børnebidrag er steget til 3.100 kr. Maksimal tvangsarv til børn er nu 1.580.000 kr., og ægtefællens suppleringsarv er 950.000 kr. Dødsboer under 55.000 kr. kan nu udlægges som boudlæg uden ordinær skiftebehandling. Fra 15 år kan unge oprette en basal indlånskonto uden forældres samtykke. Desuden er der kommet nye regler for fertilitetsbehandling og kommunernes indberetningspligt om børn i psykisk mistrivsel.',
    source: 'OPkurser.dk',
    date: 'dec 2025',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    url: 'https://www.opkurser.dk/nyheder/person-familie-og-arveret/nye-regler-familie-arv-boern-2026',
  },
];

const INITIAL_FORUM: ForumPost[] = [];

const INITIAL_GROUPS: ForumGroup[] = [];

export function FeedView() {
  const { feedTab, setFeedTab, showGrupper, setShowGrupper, addWishItem, shoppingItems, children, currentUser, setViewGroupId, setViewGroupName, setViewProfileUserId, setActiveTab } = useAppStore();

  // Forum state
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(INITIAL_FORUM);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const postImageRef = useRef<HTMLInputElement>(null);

  // Nyheder state
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);

  // Grupper state
  const [groups, setGroups] = useState<ForumGroup[]>(INITIAL_GROUPS);
  const [leaveGroupId, setLeaveGroupId] = useState<string | null>(null);

  // Tilbud state
  const { tilbudStoreId, setTilbudStoreId, activeShoppingListId, setActiveShoppingListId, shoppingLists } = useAppStore();
  const { createShoppingItem, deleteShoppingItem, createShoppingList } = useApiActions();
  const [giftOffers, setGiftOffers] = useState<Offer[]>([]);
  const [showAddWish, setShowAddWish] = useState(false);
  const [newWishTitle, setNewWishTitle] = useState('');
  const [newWishPrice, setNewWishPrice] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [addedOfferId, setAddedOfferId] = useState<string | null>(null);
  const [addedCatalogId, setAddedCatalogId] = useState<string | null>(null);

  // Names of unpurchased shopping items with a valid listId (for in-cart badges)
  const inCartNames = useMemo(() => {
    const names = new Set<string>();
    for (const item of shoppingItems) {
      if (!item.purchased && item.listId) {
        names.add(item.name.toLowerCase());
      }
    }
    return names;
  }, [shoppingItems]);

  useEffect(() => {
    fetchOffers().then(setOffers);
    fetchGiftOffers().then(setGiftOffers);
  }, []);

  // Fetch forum posts + groups from Supabase when forum tab is active
  useEffect(() => {
    if (feedTab !== 'forum') return;
    const uid = currentUser?.id;

    (async () => {
      // Fetch general feed posts with author profile
      const { data: postsData } = await supabase
        .from('forum_posts')
        .select('*, profiles:user_id(name, avatar)')
        .is('group_id', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsData && postsData.length > 0) {
        // Check which posts the current user liked
        const postIds = postsData.map((p: { id: string }) => p.id);
        const { data: likedData } = uid
          ? await supabase.from('forum_post_likes').select('post_id').eq('user_id', uid).in('post_id', postIds)
          : { data: [] };
        const likedSet = new Set((likedData || []).map((l: { post_id: string }) => l.post_id));

        // Fetch comments for these posts
        const { data: commentsData } = await supabase
          .from('forum_comments')
          .select('*, profiles:user_id(name)')
          .in('post_id', postIds)
          .order('created_at', { ascending: true });

        const commentsByPost: Record<string, ForumComment[]> = {};
        for (const c of (commentsData || [])) {
          const pid = (c as { post_id: string }).post_id;
          if (!commentsByPost[pid]) commentsByPost[pid] = [];
          const profile = (c as { profiles: { name: string } | null }).profiles;
          commentsByPost[pid].push({
            id: c.id,
            name: profile?.name || 'Ukendt',
            text: c.text,
            time: formatRelativeTime(c.created_at),
          });
        }

        const mapped: ForumPost[] = postsData.map((p: Record<string, unknown>) => {
          const profile = p.profiles as { name: string; avatar?: string } | null;
          return {
            id: p.id as string,
            userId: p.user_id as string,
            name: profile?.name || 'Ukendt',
            avatar: profile?.avatar || '',
            text: p.text as string,
            time: formatRelativeTime(p.created_at as string),
            likes: (p.like_count as number) || 0,
            liked: likedSet.has(p.id as string),
            comments: (p.comment_count as number) || 0,
            commentsList: commentsByPost[p.id as string] || [],
            image: (p.image as string) || '',
          };
        });
        setForumPosts(mapped);
      }

      // Fetch groups
      const { data: groupsData } = await supabase
        .from('forum_groups')
        .select('*')
        .order('member_count', { ascending: false });

      if (groupsData) {
        const { data: memberships } = uid
          ? await supabase.from('forum_group_members').select('group_id').eq('user_id', uid)
          : { data: [] };
        const memberSet = new Set((memberships || []).map((m: { group_id: string }) => m.group_id));

        const { data: requests } = uid
          ? await supabase.from('forum_join_requests').select('group_id, status').eq('user_id', uid).eq('status', 'pending')
          : { data: [] };
        const requestMap = new Map((requests || []).map((r: { group_id: string; status: string }) => [r.group_id, r.status]));

        const mappedGroups: ForumGroup[] = groupsData.map((g: Record<string, unknown>) => ({
          id: g.id as string,
          name: g.name as string,
          image: (g.image as string) || '',
          members: (g.member_count as number) || 0,
          type: (g.type as 'open' | 'closed') || 'open',
          description: (g.description as string) || '',
          isJoined: memberSet.has(g.id as string),
          ownerId: g.owner_id as string,
          rules: (g.rules as string) || undefined,
          requestStatus: (requestMap.get(g.id as string) as ForumGroup['requestStatus']) || 'none',
        }));
        setGroups(mappedGroups);
      }
    })();
  }, [feedTab, currentUser?.id]);

  /* ─── Handlers ─── */

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    trackEvent({ eventType: 'forum_post', page: 'forum' });

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const optimistic: ForumPost = {
      id: tempId,
      userId: currentUser?.id || 'self',
      name: currentUser?.name || 'Dig',
      avatar: '',
      text: newPostText.trim(),
      time: 'Lige nu',
      likes: 0,
      liked: false,
      comments: 0,
      commentsList: [],
      image: newPostImage || '',
    };
    setForumPosts(prev => [optimistic, ...prev]);
    setNewPostText('');
    setNewPostImage(null);
    setShowNewPost(false);

    // Persist to Supabase
    const { data, error } = await supabase.from('forum_posts').insert({
      user_id: currentUser?.id,
      text: optimistic.text,
      image: optimistic.image,
      group_id: null,
    }).select('id').single();

    if (data) {
      setForumPosts(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
    } else if (error) {
      toast.error('Kunne ikke oprette opslag');
      setForumPosts(prev => prev.filter(p => p.id !== tempId));
    }
  };

  const toggleLike = async (postId: string) => {
    const post = forumPosts.find(p => p.id === postId);
    if (!post || !currentUser?.id) return;

    // Optimistic UI
    setForumPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
    ));

    if (post.liked) {
      await supabase.from('forum_post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
    } else {
      await supabase.from('forum_post_likes').insert({ post_id: postId, user_id: currentUser.id });
    }
  };

  const addComment = async () => {
    if (!commentText.trim() || !commentPostId || !currentUser?.id) return;
    const text = commentText.trim();
    const tempId = `temp-c-${Date.now()}`;

    // Optimistic UI
    setForumPosts(prev => prev.map(p =>
      p.id === commentPostId
        ? {
          ...p,
          comments: p.comments + 1,
          commentsList: [...p.commentsList, {
            id: tempId,
            name: currentUser?.name || 'Dig',
            text,
            time: 'Lige nu',
          }],
        }
        : p
    ));
    setCommentText('');

    // Persist to Supabase
    const { data } = await supabase.from('forum_comments').insert({
      post_id: commentPostId,
      user_id: currentUser.id,
      text,
    }).select('id').single();

    if (data) {
      setForumPosts(prev => prev.map(p => ({
        ...p,
        commentsList: p.commentsList.map(c => c.id === tempId ? { ...c, id: data.id } : c),
      })));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string | null) => void) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleGroupJoin = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !currentUser?.id) return;

    if (group.isJoined) {
      // Leave — optimistic
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, isJoined: false, members: g.members - 1, requestStatus: 'none' as const } : g
      ));
      await supabase.from('forum_group_members').delete().eq('group_id', groupId).eq('user_id', currentUser.id);
    } else if (group.type === 'closed' && group.requestStatus !== 'pending') {
      // Send join request — optimistic
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, requestStatus: 'pending' as const } : g
      ));
      await supabase.from('forum_join_requests').insert({ group_id: groupId, user_id: currentUser.id });
    } else if (group.type === 'open') {
      // Direct join — optimistic
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, isJoined: true, members: g.members + 1 } : g
      ));
      await supabase.from('forum_group_members').insert({ group_id: groupId, user_id: currentUser.id, role: 'member' });
    }
  };

  const visibleForumPosts = forumPosts.filter(p => !hiddenPostIds.includes(p.id));

  const filteredGroups = groups;
  const myGroups = filteredGroups.filter(g => g.isJoined);
  const suggestedGroups = filteredGroups.filter(g => !g.isJoined);

  const handleAddWish = () => {
    if (!newWishTitle.trim()) return;
    const item: WishItem = {
      id: `wish-${Date.now()}`,
      title: newWishTitle.trim(),
      priceEstimate: newWishPrice ? Number(newWishPrice) : undefined,
      childId: children[0]?.id || '',
      addedBy: currentUser?.id || '',
      status: 'wanted',
      createdAt: new Date().toISOString(),
    };
    addWishItem(item);
    setNewWishTitle('');
    setNewWishPrice('');
    setShowAddWish(false);
  };

  const handleAddCatalogProduct = async (product: CatalogProduct, quantity?: number) => {
    const qty = quantity || 1;
    // Ensure item always gets a valid listId
    let catListId = activeShoppingListId;
    if (!catListId) {
      if (shoppingLists.length > 0) {
        catListId = shoppingLists[0].id;
        setActiveShoppingListId(catListId);
      } else {
        const newList = await createShoppingList({ name: 'Dagligvarer' });
        catListId = newList.id;
        setActiveShoppingListId(newList.id);
      }
    }
    const createdItem = await createShoppingItem({
      name: `${product.name}${product.unit ? ` (${product.unit})` : ''}`,
      quantity: String(qty),
      purchased: false,
      addedBy: currentUser?.id || '',
      category: product.category,
      listId: catListId,
    });
    setAddedCatalogId(product.id);
    setTimeout(() => setAddedCatalogId(null), 1200);
    toast.success(`${product.name}${qty > 1 ? ` (${qty} stk)` : ''} tilføjet til indkøbslisten`);
    // Enrich with nutrition data from cached lookup (fire-and-forget)
    lookupProductByName(product.name).then(result => {
      if (result.product) {
        const p = result.product;
        const items = useAppStore.getState().shoppingItems;
        const idx = items.findIndex(i => i.id === createdItem.id);
        if (idx >= 0) {
          const updated = [...items];
          updated[idx] = {
            ...updated[idx],
            barcode: p.barcode,
            source: 'open_food_facts',
            nutritionPer100g: {
              energyKcal: p.energy_kcal_100g ?? undefined,
              protein: p.proteins_100g ?? undefined,
              carbs: p.carbohydrates_100g ?? undefined,
              fat: p.fat_100g ?? undefined,
              fiber: p.fiber_100g ?? undefined,
              sugar: p.sugars_100g ?? undefined,
              salt: p.salt_100g ?? undefined,
            },
            allergens: p.allergens.length > 0 ? p.allergens : undefined,
          };
          useAppStore.setState({ shoppingItems: updated });
        }
        trackProductClick(p.id, 'add_to_shopping', { source: 'catalog', productName: product.name });
      }
    });
  };

  const handleAddCatalogToWishlist = (product: CatalogProduct) => {
    const item: WishItem = {
      id: `wish-${Date.now()}`,
      title: `${product.name}${product.unit ? ` (${product.unit})` : ''}`,
      priceEstimate: product.price,
      childId: children[0]?.id || '',
      addedBy: currentUser?.id || '',
      status: 'wanted',
      createdAt: new Date().toISOString(),
    };
    addWishItem(item);
    setAddedCatalogId(product.id);
    setTimeout(() => setAddedCatalogId(null), 1200);
    toast.success(`${product.name} tilføjet til ønskelisten`);
  };

  const handleAddOfferToShopping = async (offer: Offer, quantity?: number) => {
    const qty = quantity || 1;
    // Ensure item always gets a valid listId
    let targetListId: string | undefined = activeShoppingListId ?? undefined;
    if (!targetListId) {
      if (shoppingLists.length > 0) {
        targetListId = shoppingLists[0].id;
        setActiveShoppingListId(targetListId);
      } else {
        const newList = await createShoppingList({ name: 'Dagligvarer' });
        targetListId = newList.id;
        setActiveShoppingListId(newList.id);
      }
    }
    const createdItem = await createShoppingItem({
      name: offer.title,
      quantity: String(qty),
      purchased: false,
      addedBy: currentUser?.id || '',
      category: offer.category,
      listId: targetListId,
    });
    // Enrich with nutrition data from cached lookup (fire-and-forget)
    lookupProductByName(offer.title).then(result => {
      if (result.product) {
        const p = result.product;
        const items = useAppStore.getState().shoppingItems;
        const idx = items.findIndex(i => i.id === createdItem.id);
        if (idx >= 0) {
          const updated = [...items];
          updated[idx] = {
            ...updated[idx],
            barcode: p.barcode,
            source: 'open_food_facts',
            nutritionPer100g: {
              energyKcal: p.energy_kcal_100g ?? undefined,
              protein: p.proteins_100g ?? undefined,
              carbs: p.carbohydrates_100g ?? undefined,
              fat: p.fat_100g ?? undefined,
              fiber: p.fiber_100g ?? undefined,
              sugar: p.sugars_100g ?? undefined,
              salt: p.salt_100g ?? undefined,
            },
            allergens: p.allergens.length > 0 ? p.allergens : undefined,
          };
          useAppStore.setState({ shoppingItems: updated });
        }
        trackProductClick(p.id, 'add_to_shopping', { source: 'offer', offerTitle: offer.title });
      }
    });
    setAddedOfferId(offer.id);
    setTimeout(() => setAddedOfferId(null), 1200);
    toast.success(`${offer.title}${qty > 1 ? ` (${qty} stk)` : ''} tilføjet til indkøbslisten`);
  };

  const handleRemoveOfferFromShopping = (offer: Offer) => {
    const item = shoppingItems.find(i =>
      !i.purchased && i.name.toLowerCase() === offer.title.toLowerCase() &&
      (!activeShoppingListId || i.listId === activeShoppingListId)
    );
    if (item) {
      deleteShoppingItem(item.id).catch(() => {});
      toast.success(`${offer.title} fjernet fra indkøbslisten`);
    }
  };

  const handleAddGiftToWishlist = (offer: Offer) => {
    const item: WishItem = {
      id: `wish-${Date.now()}`,
      title: offer.title,
      priceEstimate: offer.price,
      childId: children[0]?.id || '',
      addedBy: currentUser?.id || '',
      status: 'wanted',
      createdAt: new Date().toISOString(),
    };
    addWishItem(item);
    setAddedOfferId(offer.id);
    setTimeout(() => setAddedOfferId(null), 1200);
    toast.success(`${offer.title} tilføjet til ønskelisten`);
  };

  const commentPost = commentPostId ? forumPosts.find(p => p.id === commentPostId) : null;

  return (
    <div>
      {/* ══════ Nyheder ══════ */}
      {feedTab === 'nyheder' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mx-3 sm:-mx-4 space-y-[6px] pt-2">
          {DEMO_NEWS.map((news, i) => {
            const isExpanded = expandedNewsId === news.id;
            return (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card overflow-hidden cursor-pointer"
                onClick={() => { if (!isExpanded) trackEvent({ eventType: 'news_view', targetId: news.id, targetType: 'article', page: 'nyheder' }); setExpandedNewsId(isExpanded ? null : news.id); }}
              >
                <img
                  src={news.image}
                  alt=""
                  className={cn("w-full object-cover transition-all", isExpanded ? "h-48" : "h-40")}
                />
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] font-semibold text-foreground leading-snug flex-1">{news.title}</h3>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                  </div>
                  <AnimatePresence mode="wait">
                    {isExpanded ? (
                      <motion.div
                        key="expanded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="text-[13px] text-foreground leading-relaxed mt-2">{news.fullText}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(news.url, '_blank'); }}
                          className="flex items-center gap-1.5 mt-3 text-[13px] font-semibold text-[#f58a2d]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Læs mere hos {news.source}
                        </button>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[12px] text-muted-foreground leading-relaxed mt-1.5 line-clamp-2"
                      >
                        {news.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <p className="text-[11px] text-muted-foreground mt-2">{news.source} · {news.date}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ══════ Tilbud ══════ */}
      {feedTab === 'tilbud' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-2">
          {tilbudStoreId === null ? (
            <TilbudMainPage
              offers={offers}
              giftOffers={giftOffers}
              addedOfferId={addedOfferId}
              addedCatalogId={addedCatalogId}
              inCartNames={inCartNames}
              onSelectStore={setTilbudStoreId}
              onAddOffer={handleAddOfferToShopping}
              onRemoveOffer={handleRemoveOfferFromShopping}
              onAddGift={handleAddGiftToWishlist}
              onAddCatalogProduct={handleAddCatalogProduct}
              onBack={() => setFeedTab('nyheder')}
            />
          ) : tilbudStoreId.startsWith('uploaded-') ? (
            <UploadedBatchView
              batchId={tilbudStoreId.replace('uploaded-', '')}
              inCartNames={inCartNames}
              onAddProduct={handleAddCatalogProduct}
            />
          ) : (
            <TilbudStoreView
              storeId={tilbudStoreId}
              addedCatalogId={addedCatalogId}
              inCartNames={inCartNames}
              onAddProduct={handleAddCatalogProduct}
              onAddToWishlist={handleAddCatalogToWishlist}
            />
          )}
        </motion.div>
      )}

      {/* ══════ Forum ══════ */}
      {feedTab === 'forum' && (
        <>
          {showGrupper ? (
            /* ── Grupper ── */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mx-3 sm:-mx-4">
              {/* Mine grupper */}
              {myGroups.length > 0 && (
                <>
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-3 pb-1.5">Mine grupper</p>
                  <div className="space-y-[1px]">
                    {myGroups.map((group, i) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 bg-card p-4 cursor-pointer active:bg-card transition-colors"
                        onClick={() => { setViewGroupId(group.id); setViewGroupName(group.name); setActiveTab('group-detail'); }}
                      >
                        {group.image ? (
                          <img src={group.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-semibold text-foreground">{group.name}</p>
                            {group.type === 'closed' && <Lock className="h-3 w-3 text-muted-foreground" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{group.members} medlemmer</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setLeaveGroupId(group.id); }}
                          className="text-[12px] font-semibold text-muted-foreground px-3 py-1.5 rounded-full border border-border hover:bg-card transition-colors"
                        >
                          Forlad
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* Foreslåede grupper */}
              {suggestedGroups.length > 0 && (
                <>
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-1.5">
                    Foreslåede grupper
                  </p>
                  <div className="space-y-[1px]">
                    {suggestedGroups.map((group, i) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 bg-card p-4"
                      >
                        {group.image ? (
                          <img src={group.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-semibold text-foreground">{group.name}</p>
                            {group.type === 'closed' && <Lock className="h-3 w-3 text-muted-foreground" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{group.members} medlemmer · {group.description}</p>
                        </div>
                        {group.requestStatus === 'pending' ? (
                          <button
                            onClick={() => setGroups(prev => prev.map(g =>
                              g.id === group.id
                                ? { ...g, requestStatus: 'none' as const, pendingRequests: (g.pendingRequests || []).filter(id => id !== (currentUser?.id || 'self')) }
                                : g
                            ))}
                            className="flex items-center gap-1 text-[12px] font-semibold text-muted-foreground px-3 py-1.5 rounded-full border border-border active:bg-red-tint active:text-[#ef4444] active:border-[#fecaca] transition-colors"
                          >
                            Afventer...
                            <X className="h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleGroupJoin(group.id)}
                            className="text-[12px] font-semibold text-white px-3 py-1.5 rounded-full bg-[#f58a2d] hover:bg-[#e07b1f] transition-colors"
                          >
                            {group.type === 'closed' ? 'Anmod' : 'Tilmeld'}
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </>
              )}


              <div className="h-16" />

              <button
                onClick={() => setActiveTab('create-group')}
                className="fixed left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#f58a2d] text-white shadow-lg hover:bg-[#e07b1f] transition-colors"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
                aria-label="Opret gruppe"
              >
                <Plus className="h-5 w-5" />
              </button>

              <button
                onClick={() => setShowGrupper(false)}
                className="fixed right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary transition-colors"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
                aria-label="Tilbage"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <ConfirmCloseDialog
                open={leaveGroupId !== null}
                onCancel={() => setLeaveGroupId(null)}
                onConfirm={() => {
                  if (leaveGroupId) toggleGroupJoin(leaveGroupId);
                  setLeaveGroupId(null);
                }}
                title="Forlad gruppe"
                description="Er du sikker på, at du vil forlade gruppen?"
                cancelLabel="Annuller"
                confirmLabel="Forlad"
              />
            </motion.div>
          ) : (
            /* ── Forum-poster ── */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mx-3 sm:-mx-4 space-y-[6px]">
              {visibleForumPosts.map((post, i) => {
                const isOwnPost = post.userId === currentUser?.id || post.userId === 'self';
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card p-4 space-y-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => { setViewProfileUserId(post.userId); setActiveTab('profile'); }}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.avatar} />
                          <AvatarFallback className="bg-secondary text-muted-foreground text-xs">{post.name[0]}</AvatarFallback>
                        </Avatar>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <button onClick={() => { setViewProfileUserId(post.userId); setActiveTab('profile'); }} className="text-left">
                            <span className="text-[13px] font-semibold text-foreground">{post.name}</span>
                          </button>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[11px] text-muted-foreground">{post.time}</span>
                        </div>
                      </div>
                      {/* Tre-prikker-menu */}
                      <div className="relative">
                        <button
                          onClick={() => setMenuPostId(menuPostId === post.id ? null : post.id)}
                          className="p-1 text-muted-foreground hover:text-muted-foreground transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        <AnimatePresence>
                          {menuPostId === post.id && (
                            <>
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMenuPostId(null)}
                                className="fixed inset-0 z-[70]"
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.12 }}
                                className="absolute right-0 top-8 z-[71] w-44 rounded-xl bg-card border border-border shadow-lg overflow-hidden"
                              >
                                {isOwnPost ? (
                                  <>
                                    <button
                                      onClick={() => setMenuPostId(null)}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-foreground hover:bg-card transition-colors"
                                    >
                                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Rediger
                                    </button>
                                    <button
                                      onClick={() => { navigator.clipboard.writeText(`coparenting://post/${post.id}`); setMenuPostId(null); }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-foreground hover:bg-card transition-colors"
                                    >
                                      <Link className="h-3.5 w-3.5 text-muted-foreground" /> Kopiér link
                                    </button>
                                    <button
                                      onClick={() => { setForumPosts(prev => prev.filter(p => p.id !== post.id)); setMenuPostId(null); }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-[#ef4444] hover:bg-card transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" /> Slet
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => { setMenuPostId(null); }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-foreground hover:bg-card transition-colors"
                                    >
                                      <Flag className="h-3.5 w-3.5 text-muted-foreground" /> Rapportér
                                    </button>
                                    <button
                                      onClick={() => { setHiddenPostIds(prev => [...prev, post.id]); setMenuPostId(null); }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-foreground hover:bg-card transition-colors"
                                    >
                                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> Skjul opslag
                                    </button>
                                    <button
                                      onClick={() => { navigator.clipboard.writeText(`coparenting://post/${post.id}`); setMenuPostId(null); }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-foreground hover:bg-card transition-colors"
                                    >
                                      <Link className="h-3.5 w-3.5 text-muted-foreground" /> Kopiér link
                                    </button>
                                  </>
                                )}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <p className="text-[14px] text-foreground leading-relaxed">{post.text}</p>
                    {post.image && (
                      post.image.startsWith('data:') ? (
                        <img src={post.image} alt="" className="w-full h-40 rounded-lg object-cover" />
                      ) : (
                        <div className="w-full h-40 rounded-lg bg-background flex items-center justify-center text-5xl">
                          {post.image}
                        </div>
                      )
                    )}
                    <div className="flex items-center gap-3 pt-0.5">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className={cn("flex items-center gap-1.5 text-[12px] font-medium transition-colors", post.liked ? "text-[#ef4444]" : "text-muted-foreground")}
                      >
                        <Heart className={cn("h-4 w-4 transition-colors", post.liked && "fill-current")} strokeWidth={2} />
                        {post.likes}
                      </button>
                      <button
                        onClick={() => { setCommentPostId(post.id); setCommentText(''); }}
                        className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground"
                      >
                        <MessageCircle className="h-4 w-4" strokeWidth={2} /> {post.comments}
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              <div className="h-16" />

              <button
                onClick={() => setShowNewPost(true)}
                className="fixed left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#f58a2d] text-white shadow-lg hover:bg-[#e07b1f] transition-colors"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
                aria-label="Nyt opslag"
              >
                <Plus className="h-5 w-5" />
              </button>

              <div
                className="fixed right-4 z-10 flex items-center gap-2"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
              >
                <button
                  onClick={() => setShowGrupper(true)}
                  className="flex h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-white shadow-lg text-[13px] font-semibold hover:bg-primary transition-colors"
                >
                  <Users className="h-4 w-4" /> Grupper
                </button>
                <button
                  onClick={() => setFeedTab('nyheder')}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary transition-colors"
                  aria-label="Tilbage"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Nyt opslag — bottom sheet ── */}
          {createPortal(
            <AnimatePresence>
              {showNewPost && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewPost(false)} className="fixed inset-0 z-[80] bg-black/40" />
                  <motion.div
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
                    onDragEnd={(_, info) => { if (info.offset.y > 100) setShowNewPost(false); }}
                    className="fixed inset-x-0 bottom-0 z-[81] rounded-t-2xl bg-card"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                  >
                    <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-muted" /></div>
                    <div className="px-4 pb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <button onClick={() => setShowNewPost(false)} className="text-[13px] text-muted-foreground">Annuller</button>
                        <p className="text-[15px] font-semibold text-foreground">Nyt opslag</p>
                        <button onClick={handleCreatePost} disabled={!newPostText.trim()} className="flex items-center gap-1 text-[13px] font-semibold text-[#f58a2d] disabled:opacity-40">
                          <Send className="h-3.5 w-3.5" /> Opret
                        </button>
                      </div>
                      <textarea
                        value={newPostText} onChange={(e) => setNewPostText(e.target.value)}
                        placeholder="Hvad vil du dele?"
                        className="w-full h-28 rounded-xl border border-border bg-card p-3 text-[14px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {newPostImage && (
                        <div className="relative">
                          <img src={newPostImage} alt="" className="w-full h-40 rounded-lg object-cover" />
                          <button onClick={() => setNewPostImage(null)} className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 flex items-center justify-center text-white"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                      <button onClick={() => postImageRef.current?.click()} className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-muted-foreground transition-colors">
                        <ImagePlus className="h-5 w-5" /> Tilføj billede
                      </button>
                      <input ref={postImageRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, setNewPostImage)} />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* ── Kommentarer — bottom sheet ── */}
          {createPortal(
            <AnimatePresence>
              {commentPostId && commentPost && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCommentPostId(null)} className="fixed inset-0 z-[80] bg-black/40" />
                  <motion.div
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
                    onDragEnd={(_, info) => { if (info.offset.y > 100) setCommentPostId(null); }}
                    className="fixed inset-x-0 bottom-0 z-[81] rounded-t-2xl bg-card max-h-[70vh] flex flex-col"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                  >
                    <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="h-1 w-10 rounded-full bg-muted" /></div>
                    <div className="px-4 pb-2 shrink-0">
                      <div className="flex items-center justify-between">
                        <button onClick={() => setCommentPostId(null)} className="text-[13px] text-muted-foreground">Luk</button>
                        <p className="text-[15px] font-semibold text-foreground">Kommentarer</p>
                        <div className="w-8" />
                      </div>
                    </div>

                    {/* Kommentar-liste */}
                    <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-3">
                      {commentPost.commentsList.length === 0 ? (
                        <p className="text-center text-[13px] text-muted-foreground py-8">Ingen kommentarer endnu</p>
                      ) : (
                        commentPost.commentsList.map(c => (
                          <div key={c.id} className="flex gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-semibold text-muted-foreground">{c.name[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-[12px] font-semibold text-foreground">{c.name}</span>
                                <span className="text-[10px] text-muted-foreground">{c.time}</span>
                              </div>
                              <p className="text-[13px] text-foreground leading-snug">{c.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Skriv kommentar */}
                    <div className="shrink-0 border-t border-border px-4 py-3 flex items-center gap-2">
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Skriv en kommentar..."
                        className="flex-1 rounded-full border border-border bg-card px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
                      />
                      <button
                        onClick={addComment}
                        disabled={!commentText.trim()}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f58a2d] text-white disabled:opacity-40 transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}

        </>
      )}

      {/* ── Tilføj ønske — bottom sheet ── */}
      {createPortal(
        <AnimatePresence>
          {showAddWish && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddWish(false)} className="fixed inset-0 z-[80] bg-black/40" />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
                onDragEnd={(_, info) => { if (info.offset.y > 100) setShowAddWish(false); }}
                className="fixed inset-x-0 bottom-0 z-[81] rounded-t-2xl bg-card"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              >
                <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-muted" /></div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setShowAddWish(false)} className="text-[13px] text-muted-foreground">Annuller</button>
                    <p className="text-[15px] font-semibold text-foreground">Tilføj ønske</p>
                    <button onClick={handleAddWish} disabled={!newWishTitle.trim()} className="flex items-center gap-1 text-[13px] font-semibold text-[#f58a2d] disabled:opacity-40">
                      <Plus className="h-3.5 w-3.5" /> Tilføj
                    </button>
                  </div>
                  <input value={newWishTitle} onChange={(e) => setNewWishTitle(e.target.value)} placeholder="Produktnavn"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input value={newWishPrice} onChange={(e) => setNewWishPrice(e.target.value)} placeholder="Pris (valgfrit)" type="number"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* action sheet removed — products now have direct "Tilføj til kurv" buttons */}
    </div>
  );
}
