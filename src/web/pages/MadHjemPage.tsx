import {
  UtensilsCrossed,
  ShoppingCart,
  Tag,
  Heart,
  CalendarDays,
  ListChecks,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: CalendarDays, title: 'Ugentlig madplan', desc: 'Planlæg ugens måltider for begge hjem. Alle ved hvad der er på menuen.', color: '#06b6d4' },
  { icon: ShoppingCart, title: 'Indkøbsliste', desc: 'Automatisk indkøbsliste baseret på madplanen. Tilføj ekstra varer med ét tryk.', color: '#f58a2d' },
  { icon: Tag, title: 'Tilbud fra butikker', desc: 'Se ugens bedste tilbud fra danske supermarkeder. Spar penge på familiens indkøb.', color: '#a855f7' },
  { icon: Heart, title: 'Favorit-opskrifter', desc: 'Gem familiens yndlingsopskrifter og genbrug dem i madplanen.', color: '#f43f5e' },
  { icon: ListChecks, title: 'Delt indkøbsliste', desc: 'Begge forældre kan tilføje og afkrydse varer i realtid. Ingen dobbelt-indkøb.', color: '#10b981' },
  { icon: UtensilsCrossed, title: 'Allergi-markering', desc: 'Markér allergier og diætkrav. Sikrer at alle måltider er trygge for børnene.', color: '#3b82f6' },
];

const details = [
  {
    title: 'Madplan for begge hjem',
    highlightText: 'begge hjem',
    desc: 'Planlæg ugens måltider så børnene får sund og varieret mad — uanset hvilket hjem de er i. Del opskrifter og koordinér nemt.',
    bullets: ['Separat plan for hvert hjem', 'Del opskrifter mellem forældre', 'Tilpasset allergier og præferencer'],
    color: '#06b6d4',
    icon: UtensilsCrossed,
    visual: (
      <div className="space-y-2 max-w-[260px]">
        {[
          { day: 'Mandag', meal: 'Kylling med ris', emoji: '🍗' },
          { day: 'Tirsdag', meal: 'Pasta bolognese', emoji: '🍝' },
          { day: 'Onsdag', meal: 'Fiskefrikadeller', emoji: '🐟' },
          { day: 'Torsdag', meal: 'Grøntsagssuppe', emoji: '🥣' },
          { day: 'Fredag', meal: 'Pizza-fredag!', emoji: '🍕' },
        ].map((d, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/70 border border-white/40">
            <span className="text-lg">{d.emoji}</span>
            <div>
              <p className="text-[12px] font-bold text-[#06b6d4]">{d.day}</p>
              <p className="text-[13px] text-[#2f2f2f]">{d.meal}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Indkøb og tilbud samlet ét sted',
    highlightText: 'samlet ét sted',
    desc: 'Indkøbslisten genereres automatisk fra madplanen. Se tilbud fra lokale butikker og spar penge på familiens indkøb.',
    bullets: ['Automatisk genereret fra madplan', 'Realtids-synkronisering', 'Tilbudsintegration med danske butikker'],
    color: '#a855f7',
    icon: Tag,
    reversed: true,
  },
];

export default function MadHjemPage() {
  return (
    <FeaturePageLayout
      badge="Mad & hjem"
      badgeIcon={UtensilsCrossed}
      title="Madplan og indkøb"
      titleHighlight="— nemt og billigt"
      subtitle="Planlæg ugens måltider, lav indkøbslister og se tilbud. Spar tid og penge for hele familien."
      color="#06b6d4"
      features={features}
      details={details}
      ctaTitle="Planlæg ugens mad"
      ctaSubtitle="Opret din første madplan på under et minut. Helt gratis."
      ctaButtonLabel="Prøv gratis"
      ctaButtonHref="#funktioner"
    />
  );
}
