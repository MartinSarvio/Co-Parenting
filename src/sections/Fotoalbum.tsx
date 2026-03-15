import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { useFamilyContext } from '@/hooks/useFamilyContext';

import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Plus, Trash2, Camera, X, ChevronLeft, ChevronRight, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { uploadPhoto, deleteStorageFile } from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { useApiActions } from '@/hooks/useApiActions';

export function Fotoalbum() {
  const { currentUser, photos, children, currentChildId, setFullScreenOverlayOpen } = useAppStore();
  const { createPhoto, deletePhoto } = useApiActions();
  const { currentChild } = useFamilyContext();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedChildId = currentChildId ?? children[0]?.id ?? null;
  const childForPhotos = currentChild ?? children.find(c => c.id === selectedChildId) ?? null;

  const childPhotos = photos
    .filter(p => p.childId === (childForPhotos?.id ?? ''))
    .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Filen er for stor. Maksimum er 10 MB.');
      return;
    }
    setSelectedFile(file);
    // Vis lokal preview mens vi uploader
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAddDialogOpen(true);
  }

  async function handleAddPhoto() {
    if (!selectedFile || !currentUser || !childForPhotos) return;
    setIsUploading(true);
    try {
      // Upload til Supabase Storage (komprimeret)
      const publicUrl = await uploadPhoto(selectedFile, childForPhotos.id);
      await createPhoto({
        childId: childForPhotos.id,
        url: publicUrl,
        caption: caption.trim() || undefined,
        takenAt: new Date().toISOString(),
        addedBy: currentUser.id,
      });
      setAddDialogOpen(false);
      setPreviewUrl(null);
      setSelectedFile(null);
      setCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Foto tilføjet');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload fejlede';
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string) {
    const photo = childPhotos.find(p => p.id === id);
    deletePhoto(id);
    if (lightboxIndex !== null) setLightboxIndex(null);
    // Slet fra Storage (ignorerer fejl — filen kan være legacy data-URL)
    if (photo) deleteStorageFile('family-photos', photo.url).catch(() => {});
    toast.success('Foto slettet');
  }

  const openLightbox = (i: number) => { setLightboxIndex(i); setFullScreenOverlayOpen(true); };
  const closeLightbox = () => { setLightboxIndex(null); setFullScreenOverlayOpen(false); };
  const prevPhoto = () => setLightboxIndex(i => (i !== null ? Math.max(0, i - 1) : null));
  const nextPhoto = () => setLightboxIndex(i => (i !== null ? Math.min(childPhotos.length - 1, i + 1) : null));

  // Cleanup on unmount
  useEffect(() => () => setFullScreenOverlayOpen(false), [setFullScreenOverlayOpen]);

  const handleShare = async () => {
    if (lightboxIndex === null) return;
    const photo = childPhotos[lightboxIndex];
    try {
      if (navigator.share) {
        await navigator.share({ title: photo.caption || 'Foto', url: photo.url });
      } else {
        await navigator.clipboard.writeText(photo.url);
        toast.success('Link kopieret til udklipsholder');
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-foreground">Fotoalbum</h1>
          {childForPhotos && (
            <p className="text-[13px] text-muted-foreground">{childForPhotos.name}</p>
          )}
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="h-9 gap-1.5 rounded-[8px] bg-primary px-4 text-sm text-white hover:bg-primary"
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
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card py-16 text-center">
          <Camera className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Ingen fotos endnu</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Tilføj jeres første minde</p>
          </div>
          <Button
            variant="outline"
            className="mt-1 h-9 rounded-[8px] border-border px-4 text-sm"
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
              className="group relative aspect-square overflow-hidden rounded-[8px] bg-secondary"
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
        <DialogContent className="max-w-sm rounded-3xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-[1rem] tracking-[-0.01em] text-foreground">Tilføj foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {previewUrl && (
              <div className="relative overflow-hidden rounded-[8px]">
                <img src={previewUrl} alt="Preview" className="max-h-64 w-full object-contain" />
              </div>
            )}
            <Textarea
              placeholder="Tilføj en billedtekst (valgfrit)"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="min-h-[60px] resize-none rounded-[8px] border-border bg-card text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-[8px] border-border"
                onClick={() => { setAddDialogOpen(false); setPreviewUrl(null); setCaption(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              >
                Annuller
              </Button>
              <Button
                className="flex-1 rounded-[8px] bg-primary text-white hover:bg-primary"
                onClick={handleAddPhoto}
                disabled={!previewUrl || isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploader...
                  </span>
                ) : (
                  'Gem foto'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox — fullscreen, hides header/footer via fullScreenOverlayOpen */}
      {lightboxIndex !== null && childPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          onClick={closeLightbox}
        >
          <div
            className="relative flex h-full w-full max-w-[430px] flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-white/60">
                {format(new Date(childPhotos[lightboxIndex].takenAt), 'd. MMM yyyy', { locale: da })}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleShare}
                  className="rounded-full p-2 text-white/70 hover:bg-card/10"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(childPhotos[lightboxIndex].id)}
                  className="rounded-full p-2 text-white/70 hover:bg-card/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={closeLightbox}
                  className="rounded-full p-2 text-white/70 hover:bg-card/10"
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
                className="max-h-[70svh] w-full rounded-[8px] object-contain"
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
                className={cn('rounded-full p-2', lightboxIndex === 0 ? 'text-white/20' : 'text-white hover:bg-card/10')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-xs text-white/50">{lightboxIndex + 1} / {childPhotos.length}</span>
              <button
                onClick={nextPhoto}
                disabled={lightboxIndex === childPhotos.length - 1}
                className={cn('rounded-full p-2', lightboxIndex === childPhotos.length - 1 ? 'text-white/20' : 'text-white hover:bg-card/10')}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <SavingOverlay open={isUploading} label="Uploader..." />
    </div>
  );
}
