import {
  MessageCircle,
  MessageSquare,
  CheckCheck,
  History,
  FileText,
  Bell,
  Shield,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: MessageSquare, title: 'Beskedtråde', desc: 'Organisér samtaler i tråde pr. emne. Ingen rod — alt er struktureret og let at finde.', color: '#8b5cf6' },
  { icon: CheckCheck, title: 'Læsekvitteringer', desc: 'Se hvornår din besked er læst. Ingen tvivl om beskeden er modtaget.', color: '#3b82f6' },
  { icon: History, title: 'Fuld historik', desc: 'Al kommunikation gemmes. Gå tilbage og se hvad der blev aftalt — dokumentation til enhver tid.', color: '#10b981' },
  { icon: FileText, title: 'Delt dokumentation', desc: 'Vedhæft filer, billeder og dokumenter direkte i samtalen.', color: '#f58a2d' },
  { icon: Bell, title: 'Push-notifikationer', desc: 'Få besked med det samme når der er en ny besked. Aldrig gå glip af vigtigt.', color: '#f43f5e' },
  { icon: Shield, title: 'Tone-guide', desc: 'Hjælpeværktøj der foreslår en konstruktiv tone. Reducer konflikter og misforståelser.', color: '#06b6d4' },
];

const details = [
  {
    title: 'Struktureret dialog uden misforståelser',
    highlightText: 'uden misforståelser',
    desc: 'Hold al kommunikation samlet ét sted. Tråde og beskeder giver overblik og historik — perfekt til co-parenting hvor klarhed er alt.',
    bullets: ['Alt gemt som dokumentation', 'Tråde pr. emne', 'Push-notifikationer i realtid'],
    color: '#8b5cf6',
    icon: MessageCircle,
    visual: (
      <div className="space-y-3 max-w-[280px]">
        <div className="p-3 rounded-xl bg-white/70 border border-white/40">
          <p className="text-[11px] font-bold text-[#8b5cf6] mb-1">Skole-emner</p>
          <div className="space-y-2">
            {[
              { from: 'Dig', msg: 'Forældremøde den 23. — kan du deltage?' },
              { from: 'Medforælder', msg: 'Ja, det passer fint. Skal vi tage noget op?' },
            ].map((m, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#8b5cf6]/15 flex items-center justify-center text-[10px] font-bold text-[#8b5cf6] shrink-0">
                  {m.from[0]}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#2f2f2f]">{m.from}</p>
                  <p className="text-[12px] text-[#5f5d56]">{m.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Dokumentation du kan stole på',
    highlightText: 'kan stole på',
    desc: 'Alle beskeder gemmes sikkert og kan ikke slettes. Perfekt som dokumentation ved uenigheder eller i juridiske sammenhænge.',
    bullets: ['Beskeder kan ikke slettes', 'Tidsstempel på alt', 'Eksporter samtalehistorik'],
    color: '#10b981',
    icon: History,
    reversed: true,
  },
];

export default function KommunikationPage() {
  return (
    <FeaturePageLayout
      badge="Kommunikation"
      badgeIcon={MessageCircle}
      title="Struktureret"
      titleHighlight="kommunikation"
      subtitle="Struktureret kommunikation mellem forældre. Tråde, beskeder og delt historik — alt samlet ét sted."
      color="#8b5cf6"
      features={features}
      details={details}
      ctaTitle="Kommunikér bedre"
      ctaSubtitle="Start med strukturerede samtaler i dag. Helt gratis."
      ctaButtonLabel="Prøv gratis"
      ctaButtonHref="#funktioner"
    />
  );
}
