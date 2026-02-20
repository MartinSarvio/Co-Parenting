import { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { useFamilyContext } from '@/hooks/useFamilyContext';
import { generateId } from '@/lib/id';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Plus, Trash2, Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

export function Fotoalbum() {
  const { currentUser, photos, addPhoto, deletePhoto, children, currentChildId } = useAppStore();
  const { currentChild } = useFamilyContext();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedChildId = currentChildId ?? children[0]?.id ?? null;
  const childForPhotos = currentChild ?? children.find(c => c.id === selectedChildId) ?? null;

  const childPhotos = photos
    .filter(p => p.childId === (childForPhotos?.id ?? ''))
    .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setAddDialogOpen(true);
  }

  function handleAddPhoto() {
    if (!previewUrl || !currentUser || !childForPhotos) return;
    addPhoto({
      id: generateId('photo'),
      childId: childForPhotos.id,
      url: previewUrl,
      caption: caption.trim() || undefined,
      takenAt: new Date().toISOString(),
      addedBy: currentUser.id,
      addedAt: new Date().toISOString(),
    });
    setAddDialogOpen(false);
    setPreviewUrl(null);
    setCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Foto tilføjet');
  }

  function handleDelete(id: string) {
    deletePhoto(id);
    if (lightboxIndex !== null) setLightboxIndex(null);
    toast.success('Foto slettet');
  }

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () => setLightboxIndex(i => (i !== null ? Math.max(0, i - 1) : null));
  const nextPhoto = () => setLightboxIndex(i => (i !== null ? Math.min(childPhotos.length - 1, i + 1) : null));

  return (
    <div className="space-y-4 py-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#2f2f2d]">Fotoalbum</h1>
          {childForPhotos && (
            <p className="text-[13px] text-[#78766d]">{childForPhotos.name}</p>
          )}
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="h-9 gap-1.5 rounded-2xl bg-[#2f2f2f] px-4 text-sm text-white hover:bg-[#1a1a1a]"
        >
          <Camera className="h-4 w-4" />
          Tilføj foto
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {childPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#d0cec5] bg-[#faf9f6] py-16 text-center">
          <Camera className="h-10 w-10 text-[#c8c6bc]" />
          <div>
            <p className="text-sm font-semibold text-[#3f3e3a]">Ingen fotos endnu</p>
            <p className="mt-1 text-[12px] text-[#78766d]">Tilføj jeres første minde</p>
          </div>
          <Button
            variant="outline"
            className="mt-1 h-9 rounded-2xl border-[#d0cec5] px-4 text-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Vælg foto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {childPhotos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => openLightbox(i)}
              className="group relative aspect-square overflow-hidden rounded-xl bg-[#ecebe5]"
            >
              <img
                src={photo.url}
                alt={photo.caption ?? 'Foto'}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {/* Add photo dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(o) => { if (!o) { setAddDialogOpen(false); setPreviewUrl(null); setCaption(''); if (fileInputRef.current) fileInputRef.current.value = ''; } }}>
        <DialogContent className="max-w-sm rounded-3xl border-[#d8d7cf] bg-[#faf9f6]">
          <DialogHeader>
            <DialogTitle className="text-[1rem] tracking-[-0.01em] text-[#2f2f2d]">Tilføj foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {previewUrl && (
              <div className="relative overflow-hidden rounded-2xl">
                <img src={previewUrl} alt="Preview" className="max-h-64 w-full object-contain" />
              </div>
            )}
            <Textarea
              placeholder="Tilføj en billedtekst (valgfrit)"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="min-h-[60px] resize-none rounded-2xl border-[#d8d7cf] bg-white text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl border-[#d8d7cf]"
                onClick={() => { setAddDialogOpen(false); setPreviewUrl(null); setCaption(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              >
                Annuller
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]"
                onClick={handleAddPhoto}
                disabled={!previewUrl}
              >
                Gem foto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxIndex !== null && childPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <div
            className="relative flex max-h-[90svh] w-full max-w-[430px] flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-white/60">
                {format(new Date(childPhotos[lightboxIndex].takenAt), 'd. MMM yyyy', { locale: da })}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDelete(childPhotos[lightboxIndex].id)}
                  className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={closeLightbox}
                  className="rounded-full p-2 text-white/70 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="flex flex-1 items-center justify-center px-2">
              <img
                src={childPhotos[lightboxIndex].url}
                alt={childPhotos[lightboxIndex].caption ?? 'Foto'}
                className="max-h-[70svh] w-full rounded-2xl object-contain"
              />
            </div>

            {/* Caption + nav */}
            {childPhotos[lightboxIndex].caption && (
              <p className="px-4 pt-3 text-center text-sm text-white/80">{childPhotos[lightboxIndex].caption}</p>
            )}
            <div className="flex items-center justify-between px-4 py-4">
              <button
                onClick={prevPhoto}
                disabled={lightboxIndex === 0}
                className={cn('rounded-full p-2', lightboxIndex === 0 ? 'text-white/20' : 'text-white hover:bg-white/10')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-xs text-white/50">{lightboxIndex + 1} / {childPhotos.length}</span>
              <button
                onClick={nextPhoto}
                disabled={lightboxIndex === childPhotos.length - 1}
                className={cn('rounded-full p-2', lightboxIndex === childPhotos.length - 1 ? 'text-white/20' : 'text-white hover:bg-white/10')}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
