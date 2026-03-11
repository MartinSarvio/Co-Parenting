import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { OverblikSidePanel } from '@/components/custom/OverblikSidePanel';
import { meetingMinutesId, documentId } from '@/lib/id';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Calendar,
  Users,
  CheckCircle2,
  Building2,
  Gavel,
  Upload,
  X,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SavingOverlay } from '@/components/custom/SavingOverlay';

export function MeetingMinutesView() {
  const {
    currentUser,
    users,
    meetingMinutes,
    documents,
    household,
    isProfessionalView,
    addMeetingMinutes,
    approveMeetingMinutes,
    addDocument,
    meetingAction,
    setMeetingAction,
    meetingFormMode,
    setMeetingFormMode,
  } = useAppStore();

  const [selectedMinutes, setSelectedMinutes] = useState<string | null>(null);
  const [newMinutes, setNewMinutes] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    location: '',
    agenda: '',
  });
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [minutesSearchQuery, setMinutesSearchQuery] = useState('');

  // Listen to meetingAction from TopBar
  useEffect(() => {
    if (meetingAction === 'add') {
      setNewMinutes({ title: '', date: format(new Date(), 'yyyy-MM-dd'), location: '', agenda: '' });
      setMeetingFormMode('add');
      setMeetingAction(null);
    }
  }, [meetingAction, setMeetingAction, setMeetingFormMode]);

  const filteredMinutes = isProfessionalView
    ? meetingMinutes.filter(() => household?.assignedProfessionals?.includes(currentUser?.id || ''))
    : meetingMinutes;

  const searchedMinutes = filteredMinutes.filter(m => {
    if (!minutesSearchQuery.trim()) return true;
    const q = minutesSearchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      (m.location && m.location.toLowerCase().includes(q)) ||
      (m.agenda && m.agenda.toLowerCase().includes(q)) ||
      (m.writtenBy && users.find(u => u.id === m.writtenBy)?.name.toLowerCase().includes(q))
    );
  });

  type UnifiedMinutesItem =
    | { kind: 'app'; data: typeof meetingMinutes[0] }
    | { kind: 'file'; data: { id: string; title: string; date: string; url: string; uploadedBy: string } };

  const uploadedMeetingDocs: UnifiedMinutesItem[] = documents
    .filter(d => d.type === 'meeting_minutes')
    .map(d => ({ kind: 'file' as const, data: { id: d.id, title: d.title, date: d.uploadedAt, url: d.url, uploadedBy: d.uploadedBy } }));

  const appMinutes: UnifiedMinutesItem[] = searchedMinutes.map(m => ({ kind: 'app' as const, data: m }));

  const unifiedList = [...appMinutes, ...uploadedMeetingDocs]
    .sort((a, b) => {
      const dateA = a.kind === 'app' ? a.data.date : a.data.date;
      const dateB = b.kind === 'app' ? b.data.date : b.data.date;
      return dateB.localeCompare(dateA);
    });

  const handleCreateMinutes = async () => {
    if (!newMinutes.title || !household) return;
    setIsSaving(true);
    try {
      addMeetingMinutes({
        id: meetingMinutesId(),
        householdId: household.id,
        title: newMinutes.title,
        date: newMinutes.date,
        location: newMinutes.location,
        agenda: newMinutes.agenda,
        attendees: [],
        decisions: [],
        agreements: [],
        nextSteps: [],
        writtenBy: currentUser?.id || '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sharedWith: [],
      });

      // Save attachments as documents under "Vores dokumenter"
      for (const att of attachments) {
        addDocument({
          id: documentId(),
          title: att.name,
          type: 'meeting_minutes',
          url: att.url,
          uploadedBy: currentUser?.id || '',
          uploadedAt: new Date().toISOString(),
          sharedWith: [],
        });
      }
      toast.success('Referat oprettet');
      setMeetingFormMode(null);
      setNewMinutes({ title: '', date: format(new Date(), 'yyyy-MM-dd'), location: '', agenda: '' });
      setAttachments([]);
    } catch {
      toast.error('Kunne ikke oprette referat');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = (minutesId: string) => {
    approveMeetingMinutes(minutesId, currentUser?.id || '');
    toast.success('Referat godkendt');
  };

  // ─── Full-page add form ───
  if (meetingFormMode === 'add') {
    return (
      <div className="space-y-3 py-1">
        <OverblikSidePanel />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#78766d]">Titel</Label>
            <Input
              value={newMinutes.title}
              onChange={(e) => setNewMinutes({...newMinutes, title: e.target.value})}
              placeholder="F.eks. Samværssamtale - August 2024"
              className="rounded-[8px] border-[#e5e3dc] bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#78766d]">Dato</Label>
            <Input
              type="date"
              value={newMinutes.date}
              onChange={(e) => setNewMinutes({...newMinutes, date: e.target.value})}
              className="rounded-[8px] border-[#e5e3dc] bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#78766d]">Sted</Label>
            <Input
              value={newMinutes.location}
              onChange={(e) => setNewMinutes({...newMinutes, location: e.target.value})}
              placeholder="F.eks. Familierådgivningen"
              className="rounded-[8px] border-[#e5e3dc] bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#78766d]">Dagsorden</Label>
            <Textarea
              value={newMinutes.agenda}
              onChange={(e) => setNewMinutes({...newMinutes, agenda: e.target.value})}
              placeholder="Hvad skal drøftes på mødet?"
              className="rounded-[8px] border-[#e5e3dc] bg-white min-h-[80px] resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-[#78766d]">Dokumenter (valgfri)</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-dashed border-[#d8d7cf] bg-white px-4 py-3 text-[13px] text-[#78766d] transition-colors active:bg-[#f0efe8]">
              <Upload className="h-4 w-4" />
              Upload dokument
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;
                  const newAttachments = Array.from(files).map(f => ({
                    name: f.name,
                    url: URL.createObjectURL(f),
                  }));
                  setAttachments(prev => [...prev, ...newAttachments]);
                  e.target.value = '';
                }}
              />
            </label>
            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center justify-between rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-[#78766d]" />
                      <span className="truncate text-[13px] text-[#2f2f2d]">{att.name}</span>
                    </div>
                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="shrink-0 p-1 text-[#9a978f] transition-colors active:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleCreateMinutes} className="w-full rounded-[8px] bg-[#f58a2d] text-white hover:bg-[#e07b1e]" disabled={!newMinutes.title || isSaving}>
            Opret referat
          </Button>
        </div>
        <SavingOverlay open={isSaving} />
      </div>
    );
  }

  // Detail view for selected minutes
  if (selectedMinutes) {
    const minutes = meetingMinutes.find(m => m.id === selectedMinutes);
    if (!minutes) return null;

    const isApproved = minutes.approvedBy?.includes(currentUser?.id || '');

    return (
      <div className="space-y-2 p-4 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" onClick={() => setSelectedMinutes(null)} className="mb-4">
            ← Tilbage til oversigt
          </Button>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge 
                    variant={minutes.status === 'approved' ? 'default' : 'secondary'}
                    className="mb-2"
                  >
                    {minutes.status === 'approved' ? 'Godkendt' : 'Udkast'}
                  </Badge>
                  <CardTitle className="text-xl">{minutes.title}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(minutes.date)}
                    {minutes.location && ` • ${minutes.location}`}
                  </p>
                </div>
                {minutes.isOfficial && (
                  <Badge variant="outline" className="border-blue-300 text-blue-600">
                    <Gavel className="w-3 h-3 mr-1" />
                    Officielt
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Attendees */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Deltagere
                </h3>
                <div className="flex flex-wrap gap-2">
                  {minutes.attendees.map((attendee) => {
                    const user = users.find(u => u.id === attendee.userId);
                    return (
                      <div 
                        key={attendee.userId}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback className="text-xs">{user?.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user?.name}</span>
                        {attendee.attended ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-slate-400">(afbud)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agenda */}
              {minutes.agenda && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Dagsorden</h3>
                  <p className="text-slate-700 text-sm">{minutes.agenda}</p>
                </div>
              )}

              {/* Decisions */}
              {minutes.decisions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Beslutninger</h3>
                  <div className="space-y-2">
                    {minutes.decisions.map((decision) => (
                      <div 
                        key={decision.id}
                        className="p-3 rounded-[8px] bg-blue-50 border border-blue-100"
                      >
                        <p className="font-medium text-blue-900">{decision.topic}</p>
                        <p className="text-sm text-blue-700 mt-1">{decision.decision}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {decision.agreedBy.map(userId => {
                            const user = users.find(u => u.id === userId);
                            return (
                              <Avatar key={userId} className="w-5 h-5">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="text-[8px]">{user?.name[0]}</AvatarFallback>
                              </Avatar>
                            );
                          })}
                          <span className="text-xs text-blue-600">
                            Godkendt af {decision.agreedBy.length}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agreements */}
              {minutes.agreements.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Aftaler</h3>
                  <div className="space-y-2">
                    {minutes.agreements.map((agreement) => (
                      <div 
                        key={agreement.id}
                        className="p-3 rounded-[8px] bg-green-50 border border-green-100"
                      >
                        <p className="font-medium text-green-900">{agreement.title}</p>
                        <p className="text-sm text-green-700 mt-1">{agreement.description}</p>
                        <p className="text-xs text-green-600 mt-2">
                          Gyldig fra {formatDate(agreement.validFrom)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {minutes.nextSteps.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Næste skridt</h3>
                  <div className="space-y-2">
                    {minutes.nextSteps.map((step) => (
                      <div 
                        key={step.id}
                        className="flex items-center gap-3 p-3 rounded-[8px] bg-slate-50"
                      >
                        <Checkbox checked={step.completed} />
                        <div className="flex-1">
                          <p className={step.completed ? 'line-through text-slate-500' : 'text-slate-900'}>
                            {step.description}
                          </p>
                          {step.assignedTo && (
                            <p className="text-xs text-slate-500">
                              Ansvarlig: {users.find(u => u.id === step.assignedTo)?.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!isApproved && minutes.status === 'pending_approval' && (
                <Button 
                  onClick={() => handleApprove(minutes.id)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Godkend referat
                </Button>
              )}

              {isApproved && (
                <div className="flex items-center justify-center gap-2 text-green-600 p-4 bg-green-50 rounded-[8px]">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Du har godkendt dette referat</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-2 p-4 max-w-lg mx-auto">
      <OverblikSidePanel />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#2f2f2d]">Mødereferater</h1>
          <p className="text-[13px] text-[#78766d]">
            {isProfessionalView
              ? 'Dokumentation fra samtaler'
              : 'Referater fra jeres møder'}
          </p>
        </div>
      </motion.div>

      {/* Professional Info */}
      {isProfessionalView && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Sag: {household?.caseNumber}</p>
                  <p className="text-sm text-blue-700">{household?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78766d]" />
        <Input
          placeholder="Søg i referater..."
          value={minutesSearchQuery}
          onChange={(e) => setMinutesSearchQuery(e.target.value)}
          className="pl-10 bg-white border-[#e5e3dc] rounded-[8px] text-sm text-[#2f2f2d] placeholder:text-[#b0aea5] focus:border-[#c7ccf0] focus:ring-[#c7ccf0] h-11"
        />
      </div>

      {/* Minutes List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        {unifiedList.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Ingen referater endnu</p>
            <p className="text-sm text-slate-400">
              {isProfessionalView
                ? 'Opret et referat efter jeres første møde'
                : 'Der vil blive tilføjet referater efter møder'}
            </p>
          </div>
        ) : (
          unifiedList.map((item, index) => (
            <motion.div
              key={item.kind === 'app' ? item.data.id : `doc-${item.data.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                if (item.kind === 'app') setSelectedMinutes(item.data.id);
              }}
            >
              <Card className="border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-[8px] flex items-center justify-center flex-shrink-0 ${
                      item.kind === 'file'
                        ? 'bg-gradient-to-br from-amber-100 to-orange-100'
                        : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                    }`}>
                      {item.kind === 'file'
                        ? <Upload className="w-6 h-6 text-amber-600" />
                        : <FileText className="w-6 h-6 text-blue-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 truncate">
                            {item.kind === 'app' ? item.data.title : item.data.title}
                          </p>
                          <p className="text-sm text-slate-500">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(item.kind === 'app' ? item.data.date : item.data.date)}
                            {item.kind === 'app' && item.data.location && ` • ${item.data.location}`}
                          </p>
                        </div>
                        {item.kind === 'app' ? (
                          <Badge
                            variant={item.data.status === 'approved' ? 'default' : 'secondary'}
                            className="shrink-0"
                          >
                            {item.data.status === 'approved' ? 'Godkendt' : 'Udkast'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 border-amber-300 text-amber-700">
                            Fil
                          </Badge>
                        )}
                      </div>
                      {item.kind === 'app' && (
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-slate-500">
                            {item.data.decisions.length} beslutninger
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.data.agreements.length} aftaler
                          </span>
                        </div>
                      )}
                      {item.kind === 'file' && (
                        <div className="mt-2">
                          <a
                            href={item.data.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Åbn dokument →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

    </div>
  );
}
