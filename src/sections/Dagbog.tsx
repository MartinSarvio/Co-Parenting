import { useState } from 'react';
import { useAppStore } from '@/store';
import { useFamilyContext } from '@/hooks/useFamilyContext';
import { generateId } from '@/lib/id';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Plus, BookOpen, Smile, Meh, Frown, Zap, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { DiaryEntry } from '@/types';

type Mood = DiaryEntry['mood'];
type Quality = 'good' | 'okay' | 'poor';

const moodOptions: { value: Mood; label: string; icon: React.ComponentType<{className?: string}>; color: string }[] = [
  { value: 'happy', label: 'Glad', icon: Smile, color: 'text-emerald-500' },
  { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-amber-500' },
  { value: 'tired', label: 'Træt', icon: Moon, color: 'text-blue-400' },
  { value: 'sad', label: 'Ked af det', icon: Frown, color: 'text-rose-500' },
  { value: 'anxious', label: 'Urolig', icon: Zap, color: 'text-purple-500' },
];

const qualityOptions: { value: Quality; label: string }[] = [
  { value: 'good', label: 'God' },
  { value: 'okay', label: 'Okay' },
  { value: 'poor', label: 'Dårlig' },
];

function QualityPicker({ label, value, onChange }: { label: string; value: Quality; onChange: (v: Quality) => void }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">{label}</p>
      <div className="flex gap-2">
        {qualityOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm font-medium transition-all',
              value === opt.value
                ? 'bg-[#2f2f2f] text-white'
                : 'bg-[#ecebe5] text-[#5f5d56] hover:bg-[#e0deda]'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Dagbog() {
  const { currentUser, diaryEntries, addDiaryEntry, children, currentChildId } = useAppStore();
  const { currentChild } = useFamilyContext();
  const [addOpen, setAddOpen] = useState(false);
  const [mood, setMood] = useState<Mood>('neutral');
  const [sleep, setSleep] = useState<Quality>('okay');
  const [appetite, setAppetite] = useState<Quality>('okay');
  const [note, setNote] = useState('');

  const childForDiary = currentChild ?? children.find(c => c.id === currentChildId) ?? children[0] ?? null;

  const entries = diaryEntries
    .filter(e => e.childId === (childForDiary?.id ?? ''))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function handleAdd() {
    if (!currentUser || !childForDiary) return;
    addDiaryEntry({
      id: generateId('diary'),
      childId: childForDiary.id,
      date: new Date().toISOString(),
      mood,
      sleep,
      appetite,
      note: note.trim() || undefined,
      writtenBy: currentUser.id,
      createdAt: new Date().toISOString(),
    });
    setAddOpen(false);
    setMood('neutral');
    setSleep('okay');
    setAppetite('okay');
    setNote('');
    toast.success('Dagbogsnotat gemt');
  }

  function getMoodInfo(m: Mood) {
    return moodOptions.find(o => o.value === m) ?? moodOptions[1];
  }

  function qualityLabel(q: Quality) {
    return qualityOptions.find(o => o.value === q)?.label ?? q;
  }

  function qualityColor(q: Quality) {
    if (q === 'good') return 'text-emerald-600 bg-emerald-50';
    if (q === 'poor') return 'text-rose-600 bg-rose-50';
    return 'text-amber-600 bg-amber-50';
  }

  return (
    <div className="space-y-4 py-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#2f2f2d]">Dagbog</h1>
          {childForDiary && (
            <p className="text-[13px] text-[#78766d]">{childForDiary.name}</p>
          )}
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="h-9 gap-1.5 rounded-2xl bg-[#2f2f2f] px-4 text-sm text-white hover:bg-[#1a1a1a]"
        >
          <Plus className="h-4 w-4" />
          Nyt notat
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#d0cec5] bg-[#faf9f6] py-16 text-center">
          <BookOpen className="h-10 w-10 text-[#c8c6bc]" />
          <div>
            <p className="text-sm font-semibold text-[#3f3e3a]">Ingen dagbogsnotater endnu</p>
            <p className="mt-1 text-[12px] text-[#78766d]">Skriv et notat efter næste aflevering</p>
          </div>
          <Button
            variant="outline"
            className="mt-1 h-9 rounded-2xl border-[#d0cec5] px-4 text-sm"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Opret notat
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const moodInfo = getMoodInfo(entry.mood);
            const MoodIcon = moodInfo.icon;
            return (
              <div key={entry.id} className="rounded-2xl border border-[#e8e7e0] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MoodIcon className={cn('h-5 w-5', moodInfo.color)} />
                    <div>
                      <p className="text-[13px] font-semibold text-[#2f2f2d]">{moodInfo.label}</p>
                      <p className="text-[11px] text-[#78766d]">
                        {format(new Date(entry.date), "EEEE d. MMM, HH:mm", { locale: da })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('rounded-lg px-2 py-0.5 text-[11px] font-medium', qualityColor(entry.sleep))}>
                      Søvn: {qualityLabel(entry.sleep)}
                    </span>
                    <span className={cn('rounded-lg px-2 py-0.5 text-[11px] font-medium', qualityColor(entry.appetite))}>
                      Mad: {qualityLabel(entry.appetite)}
                    </span>
                  </div>
                </div>
                {entry.note && (
                  <p className="mt-3 text-[13px] leading-relaxed text-[#4a4945]">{entry.note}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-[#d8d7cf] bg-[#faf9f6]">
          <DialogHeader>
            <DialogTitle className="text-[1rem] tracking-[-0.01em] text-[#2f2f2d]">Nyt dagbogsnotat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mood */}
            <div className="space-y-1.5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Humør</p>
              <div className="flex gap-2">
                {moodOptions.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setMood(opt.value)}
                      className={cn(
                        'flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-all',
                        mood === opt.value
                          ? 'bg-[#2f2f2f] text-white'
                          : 'bg-[#ecebe5] text-[#5f5d56] hover:bg-[#e0deda]'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', mood === opt.value ? 'text-white' : opt.color)} />
                      <span className="text-[10px] font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <QualityPicker label="Søvn" value={sleep} onChange={setSleep} />
            <QualityPicker label="Appetit" value={appetite} onChange={setAppetite} />

            <div className="space-y-1.5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Notat (valgfrit)</p>
              <Textarea
                placeholder="Skriv et notat om afleveringen..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="min-h-[80px] resize-none rounded-2xl border-[#d8d7cf] bg-white text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-2xl border-[#d8d7cf]" onClick={() => setAddOpen(false)}>
                Annuller
              </Button>
              <Button className="flex-1 rounded-2xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]" onClick={handleAdd}>
                Gem notat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
