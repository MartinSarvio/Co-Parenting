import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  Users,
  Lock,
  X,
  ChevronDown,
  ChevronUp,
  Camera,
  Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function CreateGroupView() {
  const { currentUser, setActiveTab } = useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [type, setType] = useState<'open' | 'closed'>('open');
  const [image, setImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const imageRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!name.trim() || !currentUser?.id || isCreating) return;
    setIsCreating(true);
    try {
      // Create the group
      const { data: group, error } = await supabase.from('forum_groups').insert({
        name: name.trim(),
        description: description.trim(),
        rules: rules.trim() || null,
        type,
        image: image || '',
        owner_id: currentUser.id,
        member_count: 1,
      }).select('id').single();

      if (error) throw error;

      // Add creator as owner member
      await supabase.from('forum_group_members').insert({
        group_id: group.id,
        user_id: currentUser.id,
        role: 'owner',
      });

      toast.success('Gruppe oprettet!');
      setActiveTab('feed');
    } catch {
      toast.error('Kunne ikke oprette gruppe');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="-mx-3 sm:-mx-4">
      {/* Group image / cover */}
      <div className="bg-white">
        <button
          onClick={() => imageRef.current?.click()}
          className="w-full h-44 bg-[#eceae2] flex flex-col items-center justify-center gap-2 relative overflow-hidden"
        >
          {image ? (
            <>
              <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
              <Camera className="h-6 w-6 text-white relative z-10" />
              <span className="text-[12px] text-white/80 font-medium relative z-10">Skift billede</span>
            </>
          ) : (
            <>
              <Camera className="h-7 w-7 text-[#9a978f]" />
              <span className="text-[13px] text-[#9a978f] font-medium">Tilf&oslash;j gruppebillede</span>
            </>
          )}
        </button>
        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

        {image && (
          <button
            onClick={() => setImage(null)}
            className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Name + description */}
      <div className="bg-white px-4 py-4 space-y-3 mt-[6px]">
        <div>
          <label className="text-[12px] font-semibold text-[#9a978f] uppercase tracking-wider">Gruppenavn *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Navngiv din gruppe"
            className="w-full mt-1 rounded-xl border border-[#e5e3dc] bg-[#f9f9f7] px-3 py-2.5 text-[14px] text-[#2f2f2d] placeholder:text-[#c5c3ba] focus:outline-none focus:ring-1 focus:ring-[#f58a2d]"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#9a978f] uppercase tracking-wider">Beskrivelse</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Hvad handler gruppen om?"
            className="w-full mt-1 h-20 rounded-xl border border-[#e5e3dc] bg-[#f9f9f7] px-3 py-2.5 text-[14px] text-[#2f2f2d] placeholder:text-[#c5c3ba] resize-none focus:outline-none focus:ring-1 focus:ring-[#f58a2d]"
          />
        </div>
      </div>

      {/* Type selector */}
      <div className="bg-white px-4 py-4 mt-[6px]">
        <label className="text-[12px] font-semibold text-[#9a978f] uppercase tracking-wider">Gruppetype</label>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setType('open')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-colors",
              type === 'open'
                ? "border-[#f58a2d] bg-[#f58a2d]/10 text-[#f58a2d]"
                : "border-[#e5e3dc] bg-[#f9f9f7] text-[#78766d]"
            )}
          >
            <Users className="h-4 w-4" /> &Aring;ben
          </button>
          <button
            onClick={() => setType('closed')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-colors",
              type === 'closed'
                ? "border-[#f58a2d] bg-[#f58a2d]/10 text-[#f58a2d]"
                : "border-[#e5e3dc] bg-[#f9f9f7] text-[#78766d]"
            )}
          >
            <Lock className="h-4 w-4" /> Lukket
          </button>
        </div>
      </div>

      {/* Settings (collapsible) — more configuration */}
      <button
        id="create-group-settings"
        onClick={() => setShowSettings(!showSettings)}
        className="w-full bg-white border-t border-[#e5e3dc] px-4 py-3.5 flex items-center justify-between mt-[6px]"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#9a978f]" />
          <span className="text-[13px] font-semibold text-[#5f5d56]">Avancerede indstillinger</span>
        </div>
        {showSettings ? <ChevronUp className="h-4 w-4 text-[#9a978f]" /> : <ChevronDown className="h-4 w-4 text-[#9a978f]" />}
      </button>
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white px-4 pb-4 space-y-3">
              {/* Rules */}
              <div>
                <label className="text-[12px] font-semibold text-[#9a978f] uppercase tracking-wider">Grupperegler</label>
                <textarea
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="Definer regler for gruppen (valgfrit)"
                  className="w-full mt-1 h-20 rounded-xl border border-[#e5e3dc] bg-[#f9f9f7] px-3 py-2.5 text-[14px] text-[#2f2f2d] placeholder:text-[#c5c3ba] resize-none focus:outline-none focus:ring-1 focus:ring-[#f58a2d]"
                />
              </div>

              <p className="text-[12px] text-[#9a978f]">
                Andre brugere kan finde og tilmelde sig din gruppe efter oprettelse.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create button */}
      <div className="px-4 py-6 mt-[6px]">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
          className="w-full py-3.5 rounded-xl bg-[#f58a2d] text-white text-[15px] font-semibold disabled:opacity-40 hover:bg-[#e07b1f] transition-colors"
        >
          {isCreating ? 'Opretter...' : 'Opret gruppe'}
        </button>
      </div>

      <div className="h-8" />
    </div>
  );
}
