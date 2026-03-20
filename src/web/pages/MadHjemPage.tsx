import {
  UtensilsCrossed,
  ShoppingCart,
  Tag,
  Heart,
  CalendarDays,
  ListChecks,
  Check,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: CalendarDays, title: 'Ugentlig madplan', desc: 'Planlæg ugens måltider for begge hjem. Alle ved hvad der er på menuen.', color: '#1a1a1a' },
  { icon: ShoppingCart, title: 'Indkøbsliste', desc: 'Automatisk indkøbsliste baseret på madplanen. Tilføj ekstra varer med ét tryk.', color: '#1a1a1a' },
  { icon: Tag, title: 'Tilbud fra butikker', desc: 'Se ugens bedste tilbud fra danske supermarkeder. Spar penge på familiens indkøb.', color: '#1a1a1a' },
  { icon: Heart, title: 'Favorit-opskrifter', desc: 'Gem familiens yndlingsopskrifter og genbrug dem i madplanen.', color: '#1a1a1a' },
  { icon: ListChecks, title: 'Delt indkøbsliste', desc: 'Begge forældre kan tilføje og afkrydse varer i realtid. Ingen dobbelt-indkøb.', color: '#1a1a1a' },
  { icon: UtensilsCrossed, title: 'Allergi-markering', desc: 'Markér allergier og diætkrav. Sikrer at alle måltider er trygge for børnene.', color: '#1a1a1a' },
];

// Hero: Meal plan grid with emoji, who's cooking, and mini shopping list
const HeroMealPlan = () => (
  <div className="animate-scaleIn pointer-events-none max-w-[300px] w-full space-y-3">
    {/* Meal plan card */}
    <div className="p-4 rounded-2xl bg-white/80 border border-white/50 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-bold text-[#2f2f2f]">Denne uge — Hjem 1</p>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2f2f2f]/5 text-[#78766d]">Uge 12</span>
      </div>
      {[
        { day: 'Mandag', meal: 'Kylling med ris', emoji: '🍗', who: 'D' },
        { day: 'Tirsdag', meal: 'Pasta bolognese', emoji: '🍝', who: 'M' },
        { day: 'Onsdag', meal: 'Fiskefrikadeller', emoji: '🐟', who: 'D' },
        { day: 'Torsdag', meal: 'Grøntsagssuppe', emoji: '🥣', who: 'M' },
        { day: 'Fredag', meal: 'Pizza-fredag!', emoji: '🍕', who: 'D' },
      ].map((d, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 py-2 border-b border-[#e8e6df]/40 last:border-0 animate-slideUp"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <span className="text-[18px] animate-scaleIn" style={{ animationDelay: `${i * 100 + 200}ms` }}>{d.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-[#78766d]">{d.day}</p>
            <p className="text-[12px] font-medium text-[#2f2f2f]">{d.meal}</p>
          </div>
          <span className="w-6 h-6 rounded-full bg-[#2f2f2f]/[0.06] flex items-center justify-center text-[10px] font-bold text-[#2f2f2f] shrink-0">
            {d.who}
          </span>
        </div>
      ))}
    </div>

    {/* Mini shopping list */}
    <div className="rounded-xl bg-white/60 border border-white/40 shadow-sm px-3.5 py-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <ShoppingCart size={11} className="text-[#78766d]" />
        <p className="text-[10px] font-bold text-[#2f2f2f]">Indkøbsliste</p>
        <span className="text-[9px] text-[#9a978f] ml-auto">4 varer</span>
      </div>
      {[
        { item: 'Kyllingebryst 500g', done: true },
        { item: 'Fiskefrikadeller', done: true },
        { item: 'Frisk pasta', done: false },
        { item: 'Mozzarella', done: false },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-2 py-1">
          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
            item.done ? 'bg-[#2f2f2f] border-[#2f2f2f]' : 'border-[#d4d3cd]'
          }`}>
            {item.done && <Check size={8} className="text-white" />}
          </div>
          <p className={`text-[11px] ${item.done ? 'line-through text-[#9a978f]' : 'text-[#2f2f2f]'}`}>{item.item}</p>
        </div>
      ))}
    </div>
  </div>
);

// Detail 1: Meal plan with "Hjem 2" tab look
const DetailMealPlanTabs = () => (
  <div className="max-w-[280px] w-full">
    <div className="rounded-2xl bg-white/80 border border-white/50 shadow-lg overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[#e8e6df]">
        <div className="flex-1 text-center py-2 text-[11px] font-bold text-[#9a978f] bg-[#f9f8f5]">Hjem 1</div>
        <div className="flex-1 text-center py-2 text-[11px] font-bold text-[#2f2f2f] border-b-2 border-[#2f2f2f]">Hjem 2</div>
      </div>
      <div className="p-3.5">
        {[
          { day: 'Mandag', meal: 'Lasagne', emoji: '🧀' },
          { day: 'Tirsdag', meal: 'Stegt ris m. grønt', emoji: '🍚' },
          { day: 'Onsdag', meal: 'Grillpølser', emoji: '🌭' },
          { day: 'Torsdag', meal: 'Karrysuppe', emoji: '🍛' },
          { day: 'Fredag', meal: 'Burger-aften!', emoji: '🍔' },
        ].map((d, i) => (
          <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-[#e8e6df]/40 last:border-0">
            <span className="text-[15px]">{d.emoji}</span>
            <div>
              <p className="text-[10px] font-semibold text-[#78766d]">{d.day}</p>
              <p className="text-[12px] text-[#2f2f2f]">{d.meal}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Detail 2: Shopping list with tilbud tags
const DetailShoppingList = () => (
  <div className="max-w-[260px] w-full">
    <div className="p-4 rounded-2xl bg-white/80 border border-white/50 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <ShoppingCart size={13} className="text-[#2f2f2f]" />
          <p className="text-[12px] font-bold text-[#2f2f2f]">Indkøbsliste</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2f2f2f]/5 text-[#78766d]">7 varer</span>
      </div>
      {[
        { item: 'Kyllingebryst 500g', done: false, tilbud: true, price: 'Kr. 35' },
        { item: 'Hakket oksekød', done: false, tilbud: false, price: '' },
        { item: 'Fiskefrikadeller', done: true, tilbud: false, price: '' },
        { item: 'Frisk pasta', done: false, tilbud: true, price: 'Kr. 15' },
        { item: 'Mozzarella', done: false, tilbud: false, price: '' },
        { item: 'Løg 1kg', done: true, tilbud: false, price: '' },
        { item: 'Gulerødder', done: false, tilbud: true, price: 'Kr. 8' },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#e8e6df]/30 last:border-0">
          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
            item.done ? 'bg-[#2f2f2f] border-[#2f2f2f]' : 'border-[#d4d3cd]'
          }`}>
            {item.done && <Check size={9} className="text-white" />}
          </div>
          <p className={`text-[11px] flex-1 ${item.done ? 'line-through text-[#9a978f]' : 'text-[#2f2f2f]'}`}>
            {item.item}
          </p>
          {item.tilbud && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#2f2f2f] text-white shrink-0">
              {item.price}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
);

const details = [
  {
    title: 'Madplan for begge hjem',
    highlightText: 'begge hjem',
    desc: 'Planlæg ugens måltider så børnene får sund og varieret mad — uanset hvilket hjem de er i. Del opskrifter og koordinér nemt.',
    bullets: ['Separat plan for hvert hjem', 'Del opskrifter mellem forældre', 'Tilpasset allergier og præferencer'],
    color: '#1a1a1a',
    icon: UtensilsCrossed,
    visual: <DetailMealPlanTabs />,
  },
  {
    title: 'Indkøb og tilbud samlet ét sted',
    highlightText: 'samlet ét sted',
    desc: 'Indkøbslisten genereres automatisk fra madplanen. Se tilbud fra lokale butikker og spar penge på familiens indkøb.',
    bullets: ['Automatisk genereret fra madplan', 'Realtids-synkronisering', 'Tilbudsintegration med danske butikker'],
    color: '#1a1a1a',
    icon: Tag,
    reversed: true,
    visual: <DetailShoppingList />,
  },
];

export default function MadHjemPage() {
  return (
    <FeaturePageLayout
      bgTone="#f8f7f3"
      badge="Mad & hjem"
      badgeIcon={UtensilsCrossed}
      title="Madplan og indkøb"
      titleHighlight="— nemt og billigt"
      subtitle="Planlæg ugens måltider, lav indkøbslister og se tilbud. Spar tid og penge for hele familien."
      color="#1a1a1a"
      features={features}
      details={details}
      ctaTitle="Planlæg ugens mad"
      ctaSubtitle="Opret din første madplan på under et minut. Helt gratis."
      ctaButtonLabel="Prøv gratis"
      ctaButtonHref="#funktioner"
      variant="split-photo"
      heroPhotoSrc="/images/udgifter-photo.jpg"
    />
  );
}
