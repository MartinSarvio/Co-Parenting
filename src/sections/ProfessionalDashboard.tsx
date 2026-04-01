import { useState } from 'react';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2,
  FileText,
  Calendar,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase,
  Plus,
  ChevronLeft,
  AlertTriangle,
  Shield,
  MessageCircle,
  StickyNote,
  Hash,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { CaseStatus, CasePriority, RiskLevel } from '@/types';

function getStatusLabel(status: CaseStatus): string {
  switch (status) {
    case 'active': return 'Aktiv';
    case 'closed': return 'Afsluttet';
    case 'paused': return 'Pauseret';
  }
}

function getStatusStyle(status: CaseStatus): string {
  switch (status) {
    case 'active': return 'bg-green-tint text-[#1a7a3a] border-transparent';
    case 'closed': return 'bg-secondary text-muted-foreground border-transparent';
    case 'paused': return 'bg-orange-tint text-[#bf6722] border-transparent';
  }
}

function getPriorityLabel(priority: CasePriority): string {
  switch (priority) {
    case 'normal': return 'Normal';
    case 'high': return 'Høj';
    case 'urgent': return 'Akut';
  }
}

function getRiskStyle(risk: RiskLevel): string {
  switch (risk) {
    case 'low': return 'bg-green-50 text-green-700';
    case 'medium': return 'bg-amber-50 text-amber-700';
    case 'high': return 'bg-red-50 text-red-700';
  }
}

function getRiskLabel(risk: RiskLevel): string {
  switch (risk) {
    case 'low': return 'Lav';
    case 'medium': return 'Mellem';
    case 'high': return 'Høj';
  }
}

function getCaseLeftBorder(priority: CasePriority): string {
  switch (priority) {
    case 'high': return 'border-l-4 border-l-[#f58a2d]';
    case 'urgent': return 'border-l-4 border-l-red-400';
    default: return '';
  }
}

function getDaysSinceContact(dateStr: string | null): number {
  if (!dateStr) return 0;
  const contact = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - contact.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function ProfessionalDashboard() {
  const {
    currentUser,
    meetingMinutes,
    custodyPlans,
    professionalCases,
    riskAssessments,
    caseActivities,
    professionalCaseFilter,
    setProfessionalCaseFilter,
    setActiveTab,
  } = useAppStore();
  const custodyPlan = custodyPlans[0];

  const { sendProfessionalMessage } = useApiActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [caseNotes, setCaseNotes] = useState<Record<string, { text: string; date: string }[]>>({});
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const preFilteredCases = professionalCaseFilter === 'all'
    ? professionalCases
    : professionalCaseFilter === 'active'
      ? professionalCases.filter(c => c.status === 'active')
      : professionalCases.filter(c => c.pendingApprovals > 0);

  const filteredCases = preFilteredCases.filter(c =>
    c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.familyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.parents.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.childName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.departmentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCases = professionalCases.filter(c => c.status === 'active');
  const pendingCount = professionalCases.reduce((sum, c) => sum + c.pendingApprovals, 0);
  const totalMinutes = meetingMinutes.length;

  const handleAddNote = (caseId: string) => {
    if (!noteText.trim()) return;
    const newNote = { text: noteText.trim(), date: new Date().toISOString() };
    setCaseNotes(prev => ({
      ...prev,
      [caseId]: [...(prev[caseId] || []), newNote],
    }));
    setNoteText('');
  };

  // Case detail view
  if (selectedCase) {
    const caseData = professionalCases.find(c => c.id === selectedCase);
    if (!caseData) return null;

    const caseMinutes = meetingMinutes.filter(m => m.householdId === selectedCase);
    const pendingMinutes = caseMinutes.filter(m => m.status === 'pending_approval');
    const notes = caseNotes[selectedCase] || [];

    return (
      <div className="space-y-1.5 py-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setSelectedCase(null)}
            className="text-foreground hover:bg-secondary -ml-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Tilbage til sagoversigt
          </Button>

          {/* Case Header */}
          <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-blue-tint text-indigo-700 border border-[#c7ccf0] font-mono text-xs px-2.5 py-1">
                      <Hash className="w-3 h-3 mr-1" />
                      {caseData.caseNumber}
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground border-border text-xs">
                      {caseData.departmentId}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{caseData.familyName}</h2>
                  <p className="text-sm text-muted-foreground">
                    Barn: {caseData.childName}, {caseData.childAge} ar
                  </p>
                </div>
                <Badge className={`${getStatusStyle(caseData.status)} text-xs font-medium`}>
                  {getStatusLabel(caseData.status)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {caseData.parents.map((parent, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-secondary text-muted-foreground">
                        {parent[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground">{parent}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Grid 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                className="w-full h-auto py-5 flex flex-col items-center gap-2.5 bg-card border border-border rounded-[8px] hover:border-orange-tint hover:bg-orange-tint transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                onClick={() => setActiveTab('meeting-minutes')}
              >
                <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">Nyt referat</span>
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                className="w-full h-auto py-5 flex flex-col items-center gap-2.5 bg-card border border-border rounded-[8px] hover:border-orange-tint hover:bg-orange-tint transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative"
                onClick={() => setShowMessageForm(v => !v)}
              >
                <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center relative">
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  {caseData.unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#f58a2d] text-white text-[10px] font-bold flex items-center justify-center">
                      {caseData.unreadMessages}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">Send besked</span>
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                className="w-full h-auto py-5 flex flex-col items-center gap-2.5 bg-card border border-border rounded-[8px] hover:border-orange-tint hover:bg-orange-tint transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                onClick={() => setActiveTab('samvaer')}
              >
                <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">Samværsplan</span>
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                className="w-full h-auto py-5 flex flex-col items-center gap-2.5 bg-card border border-border rounded-[8px] hover:border-orange-tint hover:bg-orange-tint transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                onClick={() => setActiveTab('dokumenter')}
              >
                <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">Dokumenter</span>
              </Button>
            </motion.div>
          </div>

          {/* Professional Message Form */}
          {showMessageForm && (
            <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Send besked til familien</p>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Skriv din besked til forældrene..."
                  rows={4}
                  className="w-full rounded-[8px] border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-border text-muted-foreground"
                    onClick={() => { setShowMessageForm(false); setMessageText(''); }}
                  >
                    Annuller
                  </Button>
                  <Button
                    className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                    disabled={!messageText.trim() || isSendingMessage}
                    onClick={async () => {
                      if (!messageText.trim()) return;
                      setIsSendingMessage(true);
                      try {
                        await sendProfessionalMessage(caseData.id, messageText.trim());
                        toast.success('Besked sendt til familien');
                        setMessageText('');
                        setShowMessageForm(false);
                      } catch {
                        toast.error('Kunne ikke sende besked');
                      } finally {
                        setIsSendingMessage(false);
                      }
                    }}
                  >
                    {isSendingMessage ? 'Sender…' : 'Send'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Overview */}
          <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-foreground">Statusoversigt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-5 pb-5">
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Samværsplan</p>
                    <p className="text-xs text-muted-foreground">{custodyPlan?.pattern || 'Ikke oprettet'} ordning</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#1a7a3a]" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-[8px] bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-orange-tint flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#bf6722]" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Afventer godkendelse</p>
                    <p className="text-xs text-muted-foreground">{pendingMinutes.length + caseData.pendingApprovals} element(er)</p>
                  </div>
                </div>
                {(pendingMinutes.length + caseData.pendingApprovals) > 0 && (
                  <Badge className="bg-orange-tint text-[#bf6722] border-transparent text-xs">
                    {pendingMinutes.length + caseData.pendingApprovals}
                  </Badge>
                )}
              </div>

              {caseData.nextMeeting && (
                <div className="flex items-center justify-between p-3 rounded-[8px] bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-blue-tint flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Næste mode</p>
                      <p className="text-xs text-muted-foreground">{formatDate(caseData.nextMeeting)}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                Risikovurdering
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {(() => {
                const caseAssessments = riskAssessments.filter(a => a.caseId === selectedCase);
                const latestAssessment = caseAssessments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                return (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={`${getRiskStyle(caseData.riskLevel)} border-transparent text-xs font-medium px-3 py-1`}>
                        {caseData.riskLevel === 'low' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {caseData.riskLevel === 'medium' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {caseData.riskLevel === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        Risiko: {getRiskLabel(caseData.riskLevel)}
                      </Badge>
                      {latestAssessment && (
                        <span className="text-xs text-muted-foreground">
                          Seneste: {formatDate(latestAssessment.assessmentDate)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {latestAssessment?.summary || caseData.notes}
                    </p>
                    {caseAssessments.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {caseAssessments.length} vurdering(er) i alt
                      </p>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Timeline / Activity Log */}
          <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-foreground">Seneste aktivitet</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-1">
                {/* Show real meeting minutes if any */}
                {caseMinutes.slice(0, 2).map((minutes) => (
                  <div
                    key={minutes.id}
                    className="flex items-start gap-3 p-3 rounded-[8px] hover:bg-card transition-colors"
                  >
                    <div className="w-8 h-8 rounded-[8px] bg-blue-tint flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{minutes.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(minutes.date)}</p>
                    </div>
                    <Badge className={`text-[10px] flex-shrink-0 ${
                      minutes.status === 'approved'
                        ? 'bg-green-tint text-[#1a7a3a] border-transparent'
                        : 'bg-orange-tint text-[#bf6722] border-transparent'
                    }`}>
                      {minutes.status === 'approved' ? 'Godkendt' : 'Afventer'}
                    </Badge>
                  </div>
                ))}

                {/* Real activity items from store */}
                {caseActivities
                  .filter(a => a.caseId === selectedCase)
                  .slice(0, 5)
                  .map((activity) => {
                    const Icon = activity.type === 'meeting' ? Calendar
                      : activity.type === 'message' ? MessageCircle
                      : activity.type === 'assessment' ? Shield
                      : FileText;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-[8px] hover:bg-card transition-colors cursor-pointer"
                        onClick={() => {
                          if (activity.relatedType === 'meeting_minutes') setActiveTab('meeting-minutes');
                          else if (activity.relatedType === 'message_thread') setActiveTab('kommunikation');
                        }}
                      >
                        <div className="w-8 h-8 rounded-[8px] bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}

                {caseActivities.filter(a => a.caseId === selectedCase).length === 0 && caseMinutes.length === 0 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">Ingen aktivitet endnu</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes Section */}
          <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-muted-foreground" />
                Interne noter
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {/* Existing notes */}
              {notes.length > 0 && (
                <div className="space-y-2">
                  {notes.map((note, i) => (
                    <div key={i} className="p-3 rounded-[8px] bg-card border border-border">
                      <p className="text-sm text-foreground leading-relaxed">{note.text}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">{formatDate(note.date, 'dd. MMM yyyy, HH:mm')}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new note */}
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Skriv en intern note..."
                  className="w-full min-h-[80px] p-3 rounded-[8px] border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-[#c7ccf0] focus:ring-1 focus:ring-[#c7ccf0] transition-colors"
                />
                <Button
                  onClick={() => handleAddNote(selectedCase)}
                  disabled={!noteText.trim()}
                  className="bg-primary text-white hover:bg-primary rounded-[8px] text-sm h-9 px-4 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Tilføj note
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Beregn arbejdsflow-data
  const upcomingMeetings = professionalCases
    .filter(c => c.nextMeeting && c.status === 'active')
    .sort((a, b) => a.nextMeeting.localeCompare(b.nextMeeting));
  const casesWithPendingApprovals = professionalCases.filter(c => c.pendingApprovals > 0 && c.status === 'active');
  const casesWithUnread = professionalCases.filter(c => c.unreadMessages > 0 && c.status === 'active');
  const workflowItems = [
    ...upcomingMeetings.map(c => ({ type: 'meeting' as const, case: c, label: `Møde: ${c.familyName}`, detail: formatDate(c.nextMeeting) })),
    ...casesWithPendingApprovals.map(c => ({ type: 'approval' as const, case: c, label: `${c.pendingApprovals} afventer godkendelse`, detail: c.familyName })),
    ...casesWithUnread.map(c => ({ type: 'message' as const, case: c, label: `${c.unreadMessages} ulæste beskeder`, detail: c.familyName })),
  ];

  // Cases list view (main view)
  return (
    <div className="space-y-1.5 py-1">
      {/* Kompakt hilsen-header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-1"
      >
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {new Date().getHours() < 12 ? 'Godmorgen' : new Date().getHours() < 18 ? 'God eftermiddag' : 'God aften'}, {currentUser?.name?.split(' ')[0]}
          </h1>
          <p className="text-xs text-muted-foreground">{currentUser?.organization}</p>
        </div>
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarImage src={currentUser?.avatar} />
          <AvatarFallback className="bg-blue-tint text-indigo-700 text-sm font-medium">
            {currentUser?.name?.[0]}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer" onClick={() => { setProfessionalCaseFilter('active'); }}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{activeCases.length}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Aktive sager</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer" onClick={() => { setProfessionalCaseFilter('pending'); }}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[#bf6722]">{pendingCount}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Afventende</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer" onClick={() => { setActiveTab('meeting-minutes'); }}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{totalMinutes}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Total referater</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dagens opgaver */}
      {workflowItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold text-foreground">Dagens opgaver</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1">
              {workflowItems.map((item, i) => (
                <div
                  key={`${item.type}-${item.case.id}-${i}`}
                  onClick={() => setSelectedCase(item.case.id)}
                  className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-card cursor-pointer transition-colors"
                >
                  <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 ${
                    item.type === 'meeting' ? 'bg-blue-tint' :
                    item.type === 'approval' ? 'bg-orange-tint' :
                    'bg-orange-tint'
                  }`}>
                    {item.type === 'meeting' && <Calendar className="w-4 h-4 text-indigo-600" />}
                    {item.type === 'approval' && <Clock className="w-4 h-4 text-[#bf6722]" />}
                    {item.type === 'message' && <MessageCircle className="w-4 h-4 text-[#f58a2d]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søg sagsnummer, navn eller afdeling..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border rounded-[8px] text-sm text-foreground placeholder:text-muted-foreground focus:border-[#c7ccf0] focus:ring-[#c7ccf0] h-11"
          />
        </div>
      </motion.div>

      {/* Filter badge */}
      {professionalCaseFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-tint text-indigo-700 border border-[#c7ccf0] text-xs flex items-center gap-1">
            {professionalCaseFilter === 'active' ? 'Aktive sager' : 'Afventende godkendelse'}
            <button onClick={() => setProfessionalCaseFilter('all')} className="ml-1 hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between"
      >
        <h2 className="font-semibold text-foreground text-sm">Mine sager</h2>
        <span className="text-xs text-muted-foreground">{filteredCases.length} sag(er)</span>
      </motion.div>

      {/* Cases List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-2"
      >
        {filteredCases.map((caseItem, index) => {
          const daysSince = getDaysSinceContact(caseItem.lastContact);

          return (
            <motion.div
              key={caseItem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              onClick={() => setSelectedCase(caseItem.id)}
              className="cursor-pointer"
            >
              <Card className={`bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-orange-tint hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all ${getCaseLeftBorder(caseItem.priority)}`}>
                <CardContent className="p-4">
                  {/* Top row: case number + status */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-blue-tint text-indigo-700 border border-[#c7ccf0] font-mono text-[11px] px-2 py-0.5">
                        {caseItem.caseNumber}
                      </Badge>
                      <Badge variant="outline" className="text-muted-foreground border-border text-[10px] px-1.5 py-0.5">
                        {caseItem.departmentId}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className={`${getStatusStyle(caseItem.status)} text-[10px] font-medium`}>
                        {getStatusLabel(caseItem.status)}
                      </Badge>
                      {caseItem.priority !== 'normal' && (
                        <Badge className={`text-[10px] font-medium border-transparent ${
                          caseItem.priority === 'high'
                            ? 'bg-orange-tint text-[#bf6722]'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {getPriorityLabel(caseItem.priority)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Family info */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground text-[15px]">{caseItem.familyName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.childName}, {caseItem.childAge} ar
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>

                  {/* Parents */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {caseItem.parents.map((parent, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
                        {parent}
                      </span>
                    ))}
                  </div>

                  {/* Bottom row: meta info */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-[11px] flex items-center gap-1 ${
                      daysSince > 14 ? 'text-[#bf6722]' : 'text-muted-foreground'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {daysSince}d siden kontakt
                    </span>

                    {caseItem.unreadMessages > 0 && (
                      <span className="text-[11px] flex items-center gap-1 text-[#f58a2d] font-medium">
                        <MessageCircle className="w-3 h-3" />
                        {caseItem.unreadMessages} ulæst
                      </span>
                    )}

                    {caseItem.pendingApprovals > 0 && (
                      <span className="text-[11px] flex items-center gap-1 text-[#bf6722]">
                        <FileText className="w-3 h-3" />
                        {caseItem.pendingApprovals} afventer
                      </span>
                    )}

                    <Badge className={`${getRiskStyle(caseItem.riskLevel)} text-[10px] border-transparent ml-auto`}>
                      {getRiskLabel(caseItem.riskLevel)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-[8px] bg-secondary flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">Ingen sager fundet</p>
            <p className="text-sm text-muted-foreground mt-1">Prøv at søge efter noget andet</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
