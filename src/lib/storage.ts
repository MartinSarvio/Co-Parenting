/**
 * Supabase Storage — upload filer til buckets i stedet for data-URLs i databasen.
 *
 * Buckets:
 *   - family-photos: Familiebilleder (per barn)
 *   - family-documents: Dokumenter (PDF, DOCX, etc.)
 *
 * Kør docs/migration-storage-buckets.sql i Supabase SQL Editor for at oprette buckets.
 */

import { supabase } from './supabase';

/** Komprimer billede til max-dimension og JPEG-kvalitet */
function compressImage(file: File, maxDim = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Komprimering fejlede'))),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => reject(new Error('Kunne ikke læse billede'));
    img.src = URL.createObjectURL(file);
  });
}

/** Upload foto til Supabase Storage og returner public URL */
export async function uploadPhoto(file: File, childId: string): Promise<string> {
  // Komprimer billedet (maks 1920px, 80% JPEG-kvalitet)
  const compressed = await compressImage(file);

  const ext = 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const path = `${childId}/${timestamp}-${random}.${ext}`;

  const { error } = await supabase.storage
    .from('family-photos')
    .upload(path, compressed, {
      contentType: 'image/jpeg',
      cacheControl: '31536000', // 1 år cache
      upsert: false,
    });

  if (error) throw new Error(`Upload fejlede: ${error.message}`);

  const { data } = supabase.storage.from('family-photos').getPublicUrl(path);
  return data.publicUrl;
}

/** Upload dokument til Supabase Storage og returner public URL */
export async function uploadDocument(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'pdf';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g, '_')
    .slice(0, 50);
  const path = `${timestamp}-${random}-${safeName}.${ext}`;

  const { error } = await supabase.storage
    .from('family-documents')
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) throw new Error(`Upload fejlede: ${error.message}`);

  const { data } = supabase.storage.from('family-documents').getPublicUrl(path);
  return data.publicUrl;
}

/** Slet fil fra Supabase Storage */
export async function deleteStorageFile(bucket: string, url: string): Promise<void> {
  // Ekstraher sti fra public URL
  const match = url.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`));
  if (!match) return; // Ikke en Storage-URL (sandsynligvis legacy data-URL)

  const path = decodeURIComponent(match[1]);
  await supabase.storage.from(bucket).remove([path]);
}
