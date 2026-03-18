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
  { icon: MessageSquare, title: 'Beskedtråde', desc: 'Organisér samtaler i tråde pr. emne. Ingen rod — alt er struktureret og let at finde.', color: '#1a1a1a' },
  { icon: CheckCheck, title: 'Læsekvitteringer', desc: 'Se hvornår din besked er læst. Ingen tvivl om beskeden er modtaget.', color: '#1a1a1a' },
  { icon: History, title: 'Fuld historik', desc: 'Al kommunikation gemmes. Gå tilbage og se hvad der blev aftalt — dokumentation til enhver tid.', color: '#1a1a1a' },
  { icon: FileText, title: 'Delt dokumentation', desc: 'Vedhæft filer, billeder og dokumenter direkte i samtalen.', color: '#1a1a1a' },
  { icon: Bell, title: 'Push-notifikationer', desc: 'Få besked med det samme når der er en ny besked. Aldrig gå glip af vigtigt.', color: '#1a1a1a' },
  { icon: Shield, title: 'Tone-guide', desc: 'Hjælpeværktøj der foreslår en konstruktiv tone. Reducer konflikter og misforståelser.', color: '#1a1a1a' },
];

const details = [
  {
    title: 'Struktureret dialog uden misforståelser',
    highlightText: 'uden misforståelser',
    desc: 'Hold al kommunikation samlet ét sted. Tråde og beskeder giver overblik og historik — perfekt til co-parenting hvor klarhed er alt.',
    bullets: ['Alt gemt som dokumentation', 'Tråde pr. emne', 'Push-notifikationer i realtid'],
    color: '#1a1a1a',
    icon: MessageCircle,
    visual: (
      <div className="space-y-3 max-w-[280px]">
        <div className="p-3 rounded-xl bg-white/70 border border-white/40">
          <p className="text-[11px] font-bold text-[#1a1a1a] mb-1">Skole-emner</p>
          <div className="space-y-2">
            {[
              { from: 'Dig', msg: 'Forældremøde den 23. — kan du deltage?' },
              { from: 'Medforælder', msg: 'Ja, det passer fint. Skal vi tage noget op?' },
            ].map((m, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#1a1a1a]/[0.06] flex items-center justify-center text-[10px] font-bold text-[#1a1a1a] shrink-0">
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
    color: '#1a1a1a',
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
      color="#1a1a1a"
      features={features}
      details={details}
      ctaTitle="Kommunikér bedre"
      ctaSubtitle="Start med strukturerede samtaler i dag. Helt gratis."
      ctaButtonLabel="Prøv gratis"
      ctaButtonHref="#funktioner"
      heroVisual={
        <div className="space-y-3 max-w-[300px]">
          <div className="p-4 rounded-2xl bg-white/70 border border-white/40 shadow-xl">
            <p className="text-[11px] font-bold text-[#2f2f2f] mb-3">Skole-emner</p>
            <div className="space-y-2.5">
              {[
                { from: 'Dig', msg: 'Forældremøde den 23. — kan du deltage?', align: 'right' as const },
                { from: 'Medforælder', msg: 'Ja, det passer fint. Skal vi tage noget op?', align: 'left' as const },
                { from: 'Dig', msg: 'Vi bør snakke om SFO-skift', align: 'right' as const },
              ].map((m, i) => (
                <div key={i} className={`flex ${m.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-3.5 py-2 rounded-2xl text-[12px] max-w-[200px] ${m.align === 'right' ? 'bg-[#2f2f2f] text-white rounded-br-md' : 'bg-[#f2f1ed] text-[#2f2f2f] rounded-bl-md'}`}>
                    {m.msg}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#9a978f] mt-2 text-right">Læst kl. 14:32 ✓✓</p>
          </div>
        </div>
      }
    />
  );
}
