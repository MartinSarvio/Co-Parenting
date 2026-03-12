import { useState } from 'react';
import { useAppStore } from '@/store';
import { routineItemId } from '@/lib/id';
import { BottomSheet } from '@/components/custom/BottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { RoutineCategory, RoutineItemType } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
}

const CATEGORY_META: Record<RoutineCategory, { label: string; emoji: string }> = {
  morgen: { label: 'Morgenrutine', emoji: '☀️' },
  dag: { label: 'Dagsrutine', emoji: '🌤️' },
  aften: { label: 'Aftenrutine', emoji: '🌙' },
};

const SUGGESTIONS: Record<RoutineCategory, { label: string; emoji: string; type: RoutineItemType; mealKey?: string }[]> = {
  morgen: [
    { label: 'Morgenmad', emoji: '🥣', type: 'meal', mealKey: 'morgenmad' },
    { label: 'Bleskift', emoji: '👶', type: 'diaper' },
    { label: 'Påklædning', emoji: '👕', type: 'activity' },
    { label: 'Tandbørstning', emoji: '🪥', type: 'activity' },
  ],
  dag: [
    { label: 'Frokost', emoji: '🥗', type: 'meal', mealKey: 'frokost' },
    { label: 'Bleskift', emoji: '👶', type: 'diaper' },
    { label: 'Middagslur', emoji: '😴', type: 'nap' },
    { label: 'Leg / aktivitet', emoji: '🎨', type: 'activity' },
    { label: 'Mellemmåltid', emoji: '🍎', type: 'meal', mealKey: 'mellemmåltid' },
  ],
  aften: [
    { label: 'Aftensmad', emoji: '🍽️', type: 'meal', mealKey: 'aftensmad' },
    { label: 'Bad', emoji: '🛁', type: 'activity' },
    { label: 'Bleskift', emoji: '👶', type: 'diaper' },
    { label: 'Tandbørstning', emoji: '🪥', type: 'activity' },
    { label: 'Godnathistorie', emoji: '📖', type: 'activity' },
    { label: 'Sengetid', emoji: '🌙', type: 'nap' },
  ],
};

const CATEGORY_ORDER: RoutineCategory[] = ['morgen', 'dag', 'aften'];

export function RoutineSetupSheet({ open, onOpenChange, childId }: Props) {
  const { currentUser, routineItems, addRoutineItem, deleteRoutineItem } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<RoutineCategory>('morgen');
  const [customLabel, setCustomLabel] = useState('');
  const [customEmoji, setCustomEmoji] = useState('✅');

  const existingItems = routineItems.filter(i => i.childId === childId);
  const categoryItems = existingItems.filter(i => i.category === activeCategory).sort((a, b) => a.order - b.order);

  function hasSuggestion(cat: RoutineCategory, label: string) {
    return existingItems.some(i => i.category === cat && i.label === label);
  }

  function addSuggestion(cat: RoutineCategory, sug: typeof SUGGESTIONS['morgen'][0]) {
    if (!currentUser || hasSuggestion(cat, sug.label)) return;
    const maxOrder = Math.max(0, ...existingItems.filter(i => i.category === cat).map(i => i.order));
    addRoutineItem({
      id: routineItemId(),
      childId,
      category: cat,
      type: sug.type,
      label: sug.label,
      emoji: sug.emoji,
      order: maxOrder + 1,
      mealKey: sug.mealKey,
      isActive: true,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    });
  }

  function addCustom() {
    if (!currentUser || !customLabel.trim()) return;
    const maxOrder = Math.max(0, ...existingItems.filter(i => i.category === activeCategory).map(i => i.order));
    addRoutineItem({
      id: routineItemId(),
      childId,
      category: activeCategory,
      type: 'custom',
      label: customLabel.trim(),
      emoji: customEmoji || '✅',
      order: maxOrder + 1,
      isActive: true,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    });
    setCustomLabel('');
    setCustomEmoji('✅');
  }

  function handleDone() {
    if (existingItems.length === 0) {
      toast.error('Tilføj mindst én rutine');
      return;
    }
    onOpenChange(false);
    toast.success('Rutiner gemt');
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Opsæt rutiner">
      <div className="space-y-3">
        {/* Category tabs */}
        <div className="flex gap-1">
          {CATEGORY_ORDER.map(cat => {
            const count = existingItems.filter(i => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'flex-1 rounded-[4px] py-2 text-[12px] font-semibold transition-all',
                  activeCategory === cat
                    ? 'bg-[#2f2f2f] text-white'
                    : 'bg-[#ecebe5] text-[#5f5d56] hover:bg-[#e0deda]'
                )}
              >
                {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                {count > 0 && <span className="ml-1 text-[10px] opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Suggestions */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Forslag</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS[activeCategory].map(sug => {
              const exists = hasSuggestion(activeCategory, sug.label);
              return (
                <button
                  key={sug.label}
                  onClick={() => !exists && addSuggestion(activeCategory, sug)}
                  disabled={exists}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all',
                    exists
                      ? 'border-[#c8e6c9] bg-[#f1f8f1] text-[#4caf50]'
                      : 'border-[#d8d7cf] bg-white text-[#5f5d56] hover:bg-[#faf9f6]'
                  )}
                >
                  <span>{sug.emoji}</span>
                  <span>{sug.label}</span>
                  {exists && <span className="text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current items */}
        {categoryItems.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Aktive rutiner</p>
            <div className="space-y-1">
              {categoryItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-[4px] border border-[#e8e7e0] bg-white px-3 py-2.5"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-[#c8c6bc]" />
                  <span className="text-[14px]">{item.emoji}</span>
                  <span className="flex-1 text-[13px] font-medium text-[#2f2f2d]">{item.label}</span>
                  <button
                    onClick={() => deleteRoutineItem(item.id)}
                    className="rounded-full p-1 text-[#c8c6bc] hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add custom */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Tilføj egen</p>
          <div className="flex gap-2">
            <Input
              value={customEmoji}
              onChange={e => setCustomEmoji(e.target.value)}
              className="w-12 rounded-[4px] border-[#d8d7cf] bg-white text-center text-[16px]"
              maxLength={2}
            />
            <Input
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              placeholder="f.eks. Vitaminer"
              className="flex-1 rounded-[4px] border-[#d8d7cf] bg-white text-sm"
              onKeyDown={e => { if (e.key === 'Enter') addCustom(); }}
            />
            <Button
              size="sm"
              className="h-9 rounded-[4px] bg-[#2f2f2f] px-3 text-white hover:bg-[#1a1a1a]"
              onClick={addCustom}
              disabled={!customLabel.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Done button */}
        <Button
          className="w-full rounded-[4px] bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]"
          onClick={handleDone}
        >
          Gem rutiner ({existingItems.length} i alt)
        </Button>
      </div>
    </BottomSheet>
  );
}
