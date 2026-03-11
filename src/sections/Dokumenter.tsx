import { useState, useMemo, useRef, useEffect } from 'react';
import { OverblikSidePanel } from '@/components/custom/OverblikSidePanel';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  FileText,
  Download,
  Upload,
  Search,
  ChevronRight,
  Shield,
  Users,
  Building2,
  ExternalLink,
  Plus,
  Eye,
  FolderOpen,
  Info,
} from 'lucide-react';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { cn } from '@/lib/utils';
import { uploadDocument } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SelectSheet } from '@/components/custom/SelectSheet';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  familieretshusetDokumenter,
  familieretshusetKategorier,
  type FamilieretshusetDokument,
} from '@/data/familieretshuset-dokumenter';
import type { Document } from '@/types';

const documentTypeLabels: Record<string, string> = {
  contract: 'Kontrakt',
  medical: 'Medicinsk',
  school: 'Skole',
  insurance: 'Forsikring',
  other: 'Andet',
  meeting_minutes: 'Referat',
  court_order: 'Retsafgørelse',
  custody_agreement: 'Samværsaftale',
  authority_document: 'Myndighed',
};

export function Dokumenter() {
  const { documents, currentUser, users, children, docSection, docAction, setDocAction, docFormMode, setDocFormMode } = useAppStore();
  const { createDocument } = useApiActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FamilieretshusetDokument | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    type: 'custody_agreement' as Document['type'],
    childId: '',
    notes: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Listen to docAction from TopBar
  useEffect(() => {
    if (docAction === 'upload') {
      setDocFormMode('upload');
      setDocAction(null);
    }
  }, [docAction, setDocAction, setDocFormMode]);

  // Filter official templates
  const filteredTemplates = useMemo(() => {
    return familieretshusetDokumenter.filter((doc) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  // Filter family documents
  const filteredFamilyDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [documents, searchQuery]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Filen er for stor (maks 10 MB)');
      return;
    }
    setSelectedFile(file);
    setUploadedFileUrl('pending'); // Marker som valgt (uploaderes ved gem)
    setUploadedFileName(file.name);
    if (!newDoc.title) {
      setNewDoc((prev) => ({ ...prev, title: file.name.replace(/\.[^.]+$/, '') }));
    }
  };

  const handleSaveDocument = async () => {
    if (!newDoc.title.trim() || !selectedFile || !currentUser) return;
    setIsSaving(true);
    try {
      // Upload til Supabase Storage
      const publicUrl = await uploadDocument(selectedFile);
      await createDocument({
        title: newDoc.title.trim(),
        type: newDoc.type,
        url: publicUrl,
        sharedWith: users.map((u) => u.id),
        isOfficial: false,
      });
      toast.success('Dokument gemt');
      setDocFormMode(null);
      setNewDoc({ title: '', type: 'custody_agreement', childId: '', notes: '' });
      setUploadedFileUrl('');
      setUploadedFileName('');
      setSelectedFile(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kunne ikke gemme dokument';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'samvaer': return Users;
      case 'bopael': return Building2;
      case 'forældremyndighed': return Shield;
      case 'faderskab': return Users;
      case 'raadgivning': return FileText;
      case 'information': return FileText;
      default: return FileText;
    }
  };

  // ─── Full-page upload form ───
  if (docFormMode === 'upload') {
    return (
      <div className="space-y-3 py-1">
        <OverblikSidePanel />
        <div className="space-y-3">
          {/* File picker */}
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#78766d]">Fil</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-[8px] border border-dashed border-[#d8d7cf] bg-white px-4 py-3 text-left active:bg-[#f0efe8]"
            >
              <Upload className="h-5 w-5 text-[#9b9a93]" />
              <div className="flex-1">
                {uploadedFileName ? (
                  <p className="text-[13px] font-medium text-[#2f2f2d]">{uploadedFileName}</p>
                ) : (
                  <>
                    <p className="text-[13px] text-[#78766d]">Vælg fil</p>
                    <p className="text-[11px] text-[#9b9a93]">PDF, JPG, PNG, DOC (maks 10 MB)</p>
                  </>
                )}
              </div>
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#78766d]">Titel</Label>
            <Input
              value={newDoc.title}
              onChange={(e) => setNewDoc((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="f.eks. Samværsaftale 2025"
              className="rounded-[8px] border-[#e5e3dc] bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#78766d]">Type</Label>
            <SelectSheet
              value={newDoc.type}
              onValueChange={(v) => setNewDoc((prev) => ({ ...prev, type: v as Document['type'] }))}
              title="Type"
              options={[
                { value: 'custody_agreement', label: 'Samværsaftale' },
                { value: 'court_order', label: 'Retsafgørelse' },
                { value: 'authority_document', label: 'Myndighed' },
                { value: 'medical', label: 'Medicinsk' },
                { value: 'school', label: 'Skole' },
                { value: 'contract', label: 'Kontrakt' },
                { value: 'other', label: 'Andet' },
              ]}
              className="rounded-[8px] border-[#e5e3dc] bg-white"
            />
          </div>

          {children.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[#78766d]">Barn (valgfri)</Label>
              <SelectSheet
                value={newDoc.childId}
                onValueChange={(v) => setNewDoc((prev) => ({ ...prev, childId: v }))}
                title="Barn"
                placeholder="Valgfrit"
                options={[{ value: 'none', label: 'Ingen' }, ...children.map((c) => ({ value: c.id, label: c.name }))]}
                className="rounded-[8px] border-[#e5e3dc] bg-white"
              />
            </div>
          )}

          <Button
            className="w-full rounded-[8px] bg-[#f58a2d] text-white hover:bg-[#e07b1e]"
            onClick={handleSaveDocument}
            disabled={!newDoc.title.trim() || !uploadedFileUrl || isSaving}
          >
            Gem dokument
          </Button>
        </div>
        <SavingOverlay open={isSaving} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5 py-1">
      <OverblikSidePanel />

      {/* Search + Info icon */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9b9a93]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={docSection === 'official' ? 'Søg i blanketter...' : 'Søg i dokumenter...'}
            className="rounded-[8px] border-[#d8d7cf] bg-white pl-10"
          />
        </div>
        {docSection === 'official' && (
          <button
            onClick={() => setInfoOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[#d8d7cf] bg-white text-[#78766d] transition-colors active:bg-[#f0efe8]"
            aria-label="Info"
          >
            <Info className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {/* Info dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-[360px] rounded-2xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <Shield className="h-4 w-4 text-[#2563eb]" />
              Officielle Familieretshuset blanketter
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13px] leading-relaxed text-[#5f5d56]">
            Disse blanketter bruges i forbindelse med sager om samvær, bopæl, forældremyndighed og mægling.
            Tryk på en blanket for at se detaljer.
          </p>
        </DialogContent>
      </Dialog>

      {/* === OFFICIAL TEMPLATES SECTION === */}
      {docSection === 'official' && (
        <>
          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium whitespace-nowrap',
                categoryFilter === 'all'
                  ? 'border-[#2f2f2d] bg-[#2f2f2d] text-white'
                  : 'border-[#d8d7cf] bg-white text-[#5f5d56]'
              )}
            >
              Alle
            </button>
            {Object.entries(familieretshusetKategorier).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium whitespace-nowrap',
                  categoryFilter === key
                    ? 'border-[#2f2f2d] bg-[#2f2f2d] text-white'
                    : 'border-[#d8d7cf] bg-white text-[#5f5d56]'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Template list */}
          {filteredTemplates.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-[#d8d7cf] bg-[#faf9f6] py-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-[#c8c6bc]" />
              <p className="mt-2 text-[13px] text-[#78766d]">Ingen blanketter matcher din søgning</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map((template) => {
                const CategoryIcon = getCategoryIcon(template.category);
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className="flex w-full items-center gap-3 rounded-[8px] border border-[#e8e7e0] bg-white px-4 py-3.5 text-left transition-colors hover:bg-[#faf9f6]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#f0f7ff] text-[#2563eb]">
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#2f2f2d] leading-tight">{template.title}</p>
                      <p className="mt-0.5 text-[11px] text-[#78766d]">
                        {familieretshusetKategorier[template.category]} · {template.pages} sider
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#c8c6bc]" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Template detail sheet */}
          <Sheet open={!!selectedTemplate} onOpenChange={(open) => { if (!open) setSelectedTemplate(null); }}>
            <SheetContent side="bottom" hideClose className="max-h-[80vh] overflow-y-auto rounded-t-3xl border-[#d8d7cf] bg-[#faf9f6] px-4 pb-8 pt-4">
              <div data-drag-handle className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d8d7cf]" />
              <SheetHeader className="pb-2">
                <SheetTitle className="text-center text-lg font-bold text-[#2f2f2d]">
                  {selectedTemplate?.title}
                </SheetTitle>
              </SheetHeader>
              {selectedTemplate && (() => {
                const CategoryIcon = getCategoryIcon(selectedTemplate.category);
                return (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#f0f7ff] text-[#2563eb]">
                        <CategoryIcon className="mr-1 h-3 w-3" />
                        {familieretshusetKategorier[selectedTemplate.category]}
                      </Badge>
                      <Badge variant="outline" className="border-[#d8d7cf] text-[#5f5d56]">
                        {selectedTemplate.pages} sider
                      </Badge>
                      <Badge variant="outline" className="border-[#d8d7cf] text-[#5f5d56]">
                        PDF
                      </Badge>
                    </div>

                    <div className="rounded-[8px] border border-[#e8e7e0] bg-white p-4">
                      <p className="text-[13px] leading-relaxed text-[#4a4945]">
                        {selectedTemplate.description}
                      </p>
                    </div>

                    <div className="rounded-[8px] border border-[#e8e7e0] bg-white p-4">
                      <p className="text-[12px] font-semibold text-[#78766d] uppercase tracking-[0.05em]">Filnavn</p>
                      <p className="mt-1 text-[13px] text-[#2f2f2d]">{selectedTemplate.filename}</p>
                    </div>

                    <div className="rounded-[8px] border border-[#d1e5f7] bg-[#f0f7ff] p-4">
                      <p className="text-[12px] font-semibold text-[#1e40af]">Sådan bruger du blanketten</p>
                      <ol className="mt-2 space-y-1.5 text-[12px] text-[#3b7dd8]">
                        <li className="flex items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white">1</span>
                          Download eller print blanketten
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white">2</span>
                          Udfyld den sammen med den anden forælder
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white">3</span>
                          Underskriv og opbevar begge et eksemplar
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white">4</span>
                          Upload den underskrevne aftale under &quot;Vores dokumenter&quot;
                        </li>
                      </ol>
                    </div>

                    <Button
                      className="w-full rounded-[8px] bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                      onClick={() => {
                        toast.success(`${selectedTemplate.shortTitle} klar til download`);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>

                    <a
                      href="https://www.familieretshuset.dk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-[12px] text-[#2563eb] hover:underline"
                    >
                      Besøg familieretshuset.dk
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                );
              })()}
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* === FAMILY DOCUMENTS SECTION === */}
      {docSection === 'family' && (
        <>
          {filteredFamilyDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-[#d8d7cf] bg-[#faf9f6] py-12 text-center">
              <FolderOpen className="h-10 w-10 text-[#c8c6bc]" />
              <div>
                <p className="text-[13px] font-semibold text-[#3f3e3a]">Ingen dokumenter endnu</p>
                <p className="mt-1 text-[11px] text-[#78766d]">
                  Upload underskrevne aftaler og vigtige dokumenter her
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-1 rounded-[8px] border-[#d8d7cf] text-sm"
                onClick={() => setDocFormMode('upload')}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Upload dit første dokument
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFamilyDocs.map((doc) => {
                const child = children.find((c) => c.id === doc.childId);
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc)}
                    className="flex w-full items-center gap-3 rounded-[8px] border border-[#e8e7e0] bg-white px-4 py-3.5 text-left transition-colors hover:bg-[#faf9f6]"
                  >
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      doc.isOfficial ? 'bg-[#f0f7ff] text-[#2563eb]' : 'bg-[#fff2e6] text-[#f58a2d]'
                    )}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#2f2f2d]">{doc.title}</p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#78766d]">
                        <span>{documentTypeLabels[doc.type] || doc.type}</span>
                        {child && <><span className="text-[#d0cec5]">·</span><span>{child.name}</span></>}
                        <span className="text-[#d0cec5]">·</span>
                        <span>{format(parseISO(doc.uploadedAt), 'd. MMM yyyy', { locale: da })}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#c8c6bc]" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Family document detail sheet */}
          <Sheet open={!!selectedDocument} onOpenChange={(open) => { if (!open) setSelectedDocument(null); }}>
            <SheetContent side="bottom" hideClose className="max-h-[70vh] overflow-y-auto rounded-t-3xl border-[#d8d7cf] bg-[#faf9f6] px-4 pb-8 pt-4">
              <div data-drag-handle className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d8d7cf]" />
              <SheetHeader className="pb-2">
                <SheetTitle className="text-center text-lg font-bold text-[#2f2f2d]">
                  {selectedDocument?.title}
                </SheetTitle>
              </SheetHeader>
              {selectedDocument && (
                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-[#d8d7cf] text-[#5f5d56]">
                      {documentTypeLabels[selectedDocument.type] || selectedDocument.type}
                    </Badge>
                    {selectedDocument.isOfficial && (
                      <Badge className="bg-[#f0f7ff] text-[#2563eb]">
                        <Shield className="mr-1 h-3 w-3" />
                        Officielt
                      </Badge>
                    )}
                  </div>

                  <div className="rounded-[8px] border border-[#e8e7e0] bg-white p-4 space-y-2">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#78766d]">Uploadet af</span>
                      <span className="font-medium text-[#2f2f2d]">
                        {users.find((u) => u.id === selectedDocument.uploadedBy)?.name || 'Ukendt'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#78766d]">Dato</span>
                      <span className="font-medium text-[#2f2f2d]">
                        {format(parseISO(selectedDocument.uploadedAt), 'd. MMMM yyyy', { locale: da })}
                      </span>
                    </div>
                    {selectedDocument.childId && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#78766d]">Barn</span>
                        <span className="font-medium text-[#2f2f2d]">
                          {children.find((c) => c.id === selectedDocument.childId)?.name || '-'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#78766d]">Delt med</span>
                      <span className="font-medium text-[#2f2f2d]">
                        {selectedDocument.sharedWith.length} personer
                      </span>
                    </div>
                    {selectedDocument.validFrom && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#78766d]">Gyldig fra</span>
                        <span className="font-medium text-[#2f2f2d]">
                          {format(parseISO(selectedDocument.validFrom), 'd. MMM yyyy', { locale: da })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 rounded-[8px] bg-[#f58a2d] text-white hover:bg-[#e47921]">
                      <Eye className="mr-2 h-4 w-4" />
                      Åbn dokument
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

        </>
      )}
      <SavingOverlay open={isSaving} />
    </div>
  );
}
