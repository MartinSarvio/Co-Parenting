import { useState } from 'react';
import { useAppStore } from '@/store';
import { formatDate } from '@/lib/utils';
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
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';

type CaseStatus = 'active' | 'closed' | 'paused';
type CasePriority = 'normal' | 'high' | 'urgent';
type RiskLevel = 'low' | 'medium' | 'high';

interface AssignedCase {
  id: string;
  caseNumber: string;
  departmentId: string;
  familyName: string;
  parents: string[];
  childName: string;
  childAge: number;
  status: CaseStatus;
  priority: CasePriority;
  lastContact: string;
  nextMeeting: string;
  unreadMessages: number;
  pendingApprovals: number;
  notes: string;
  riskLevel: RiskLevel;
}

const assignedCases: AssignedCase[] = [
  {
    id: 'h1',
    caseNumber: 'FAM-2025-001234',
    departmentId: 'AFD-KBH-03',
    familyName: 'Petersens Familie',
    parents: ['Soren Petersen', 'Mette Petersen'],
    childName: 'Emma',
    childAge: 6,
    status: 'active' as const,
    priority: 'normal' as const,
    lastContact: '2025-02-10',
    nextMeeting: '2025-03-01',
    unreadMessages: 2,
    pendingApprovals: 1,
    notes: 'Forældrene samarbejder godt. Samværsplan fungerer.',
    riskLevel: 'low' as const,
  },
  {
    id: 'h2',
    caseNumber: 'FAM-2025-002341',
    departmentId: 'AFD-KBH-03',
    familyName: 'Jensens Familie',
    parents: ['Lars Jensen', 'Anna Jensen'],
    childName: 'Oliver',
    childAge: 4,
    status: 'active' as const,
    priority: 'high' as const,
    lastContact: '2025-02-18',
    nextMeeting: '2025-02-25',
    unreadMessages: 5,
    pendingApprovals: 2,
    notes: 'Uenighed om ferieordning. Mægling planlagt.',
    riskLevel: 'medium' as const,
  },
  {
    id: 'h3',
    caseNumber: 'FAM-2024-004521',
    departmentId: 'AFD-KBH-07',
    familyName: 'Nielsens Familie',
    parents: ['Christian Nielsen', 'Line Nielsen'],
    childName: 'Sofia',
    childAge: 9,
    status: 'closed' as const,
    priority: 'normal' as const,
    lastContact: '2025-01-15',
    nextMeeting: '',
    unreadMessages: 0,
    pendingApprovals: 0,
    notes: 'Sag afsluttet. Forældrene har indgået aftale.',
    riskLevel: 'low' as const,
  },
];

function getStatusLabel(status: CaseStatus): string {
  switch (status) {
    case 'active': return 'Aktiv';
    case 'closed': return 'Afsluttet';
    case 'paused': return 'Pauseret';
  }
}

function getStatusStyle(status: CaseStatus): string {
  switch (status) {
    case 'active': return 'bg-[#e6f9ed] text-[#1a7a3a] border-transparent';
    case 'closed': return 'bg-[#ecebe5] text-[#78766d] border-transparent';
    case 'paused': return 'bg-[#fff2e6] text-[#bf6722] border-transparent';
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

function getDaysSinceContact(dateStr: string): number {
  const contact = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - contact.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Demo activity timeline items
const demoActivities = [
  { id: 'a1', type: 'meeting' as const, text: 'Statusmøde afholdt', date: '2025-02-18', icon: Calendar },
  { id: 'a2', type: 'note' as const, text: 'Referat godkendt af begge parter', date: '2025-02-15', icon: FileText },
  { id: 'a3', type: 'message' as const, text: 'Besked sendt til forældre', date: '2025-02-12', icon: MessageCircle },
  { id: 'a4', type: 'document' as const, text: 'Samværsplan opdateret', date: '2025-02-10', icon: FileText },
  { id: 'a5', type: 'assessment' as const, text: 'Risikovurdering gennemført', date: '2025-02-05', icon: Shield },
];

export function ProfessionalDashboard() {
  const {
    currentUser,
    meetingMinutes,
    custodyPlans,
    setActiveTab
  } = useAppStore();
  const custodyPlan = custodyPlans[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [caseNotes, setCaseNotes] = useState<Record<string, { text: string; date: string }[]>>({});

  const filteredCases = assignedCases.filter(c =>
    c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.familyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.parents.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.childName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.departmentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCases = assignedCases.filter(c => c.status === 'active');
  const pendingCount = assignedCases.reduce((sum, c) => sum + c.pendingApprovals, 0);
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
    const caseData = assignedCases.find(c => c.id === selectedCase);
    if (!caseData) return null;

    const caseMinutes = meetingMinutes.filter(m => m.householdId === selectedCase);
    const pendingMinutes = caseMinutes.filter(m => m.status === 'pending_approval');
    const notes = caseNotes[selectedCase] || [];

    return (
      <div className="space-y-4 p-4 max-w-lg mx-auto bg-[#faf9f6] min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setSelectedCase(null)}
            className="text-[#2f2f2d] hover:bg-[#ecebe5] -ml-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Tilbage til sagoversigt
          </Button>

          {/* Case Header */}
          <Card className="bg-white border border-[#e8e7e0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-[#eef0ff] text-indigo-700 border border-[#c7ccf0] font-mono text-xs px-2.5 py-1">
                      <Hash className="w-3 h-3 mr-1" />
                      {caseData.caseNumber}
                    </Badge>
                    <Badge variant="outline" className="text-[#78766d] border-[#e8e7e0] text-xs">
                      {caseData.departmentId}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-[#2f2f2d]">{caseData.familyName}</h2>
                  <p className="text-sm text-[#78766d]">
                    Barn: {caseData.childName}, {caseData.childAge} ar
                  </p>
                </div>
                <Badge className={`${getStatusStyle(caseData.status)} text-xs font-medium`}>
                  {getStatusLabel(caseData.status)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {caseData.parents.map((parent, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#faf9f6] border border-[#e8e7e0]">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-[#ecebe5] text-[#5f5d56]">
                        {parent[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-[#2f2f2d]">{parent}</span>
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
                className="w-full h-auto py-5 flex flex-col items-center gap-2.5 bg-white border border-[#e8e7e0] rounded-2xl hover:border-[#f3c59d] hover:bg-[#fff2e6] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                onClick={() => setActiveTab('meeting-minutes')}
              >
                <div className="w-10 h-10 rounded-xl bg-[#ecebe5] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#5f5d56]" />
                </div>
                <span className="text-sm font-medium text-[#2f2f2d]">Nyt referat</span>
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                className="w-full h-auto py-5 flex flex-col items-center gap-2.5 bg-white border border-[#e8e7e0] rounded-2xl hover:border-[#f3c59d] hover:bg-[#fff2e6] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative"
                onClick={() => setActiveTab('kommunikation')}
              >
                <div className="w-10 h-10 rounded-xl bg-[#ecebe5] flex items-center justify-center relative">
                  <MessageCircle className="w-5 h-5 text-[#5f5d56]" />
                  {caseData.unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#f58a2d] text-white text-[10px] font-bold flex items-center justify-center">
                      {caseData.unreadMessages}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-[#2f2f2d]">Send besked</span>
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                className="w-full h-auto py-5 flex flex-col items-center gap-2.5 bg-white border border-[#e8e7e0] rounded-2xl hover:border-[#f3c59d] hover:bg-[#fff2e6] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                onClick={() => setActiveTab('samvaer')}
              >
                <div className="w-10 h-10 rounded-xl bg-[#ecebe5] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#5f5d56]" />
                </div>
                <span className="text-sm font-medium text-[#2f2f2d]">Samværsplan</span>
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                className="w-full h-auto py-5 flex flex-col items-center gap-2.5 bg-white border border-[#e8e7e0] rounded-2xl hover:border-[#f3c59d] hover:bg-[#fff2e6] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                onClick={() => setActiveTab('dokumenter')}
              >
                <div className="w-10 h-10 rounded-xl bg-[#ecebe5] flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-[#5f5d56]" />
                </div>
                <span className="text-sm font-medium text-[#2f2f2d]">Dokumenter</span>
              </Button>
            </motion.div>
          </div>

          {/* Status Overview */}
          <Card className="bg-white border border-[#e8e7e0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-[#2f2f2d]">Statusoversigt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf9f6]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ecebe5] flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#5f5d56]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2f2f2d] text-sm">Samværsplan</p>
                    <p className="text-xs text-[#78766d]">{custodyPlan?.pattern || 'Ikke oprettet'} ordning</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#1a7a3a]" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf9f6]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#fff2e6] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#bf6722]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2f2f2d] text-sm">Afventer godkendelse</p>
                    <p className="text-xs text-[#78766d]">{pendingMinutes.length + caseData.pendingApprovals} element(er)</p>
                  </div>
                </div>
                {(pendingMinutes.length + caseData.pendingApprovals) > 0 && (
                  <Badge className="bg-[#fff2e6] text-[#bf6722] border-transparent text-xs">
                    {pendingMinutes.length + caseData.pendingApprovals}
                  </Badge>
                )}
              </div>

              {caseData.nextMeeting && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf9f6]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#eef0ff] flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[#2f2f2d] text-sm">Næste mode</p>
                      <p className="text-xs text-[#78766d]">{formatDate(caseData.nextMeeting)}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#78766d]" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card className="bg-white border border-[#e8e7e0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-[#2f2f2d] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#5f5d56]" />
                Risikovurdering
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`${getRiskStyle(caseData.riskLevel)} border-transparent text-xs font-medium px-3 py-1`}>
                  {caseData.riskLevel === 'low' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {caseData.riskLevel === 'medium' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {caseData.riskLevel === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  Risiko: {getRiskLabel(caseData.riskLevel)}
                </Badge>
              </div>
              <p className="text-sm text-[#78766d] leading-relaxed">{caseData.notes}</p>
            </CardContent>
          </Card>

          {/* Timeline / Activity Log */}
          <Card className="bg-white border border-[#e8e7e0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-[#2f2f2d]">Seneste aktivitet</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-1">
                {/* Show real meeting minutes if any */}
                {caseMinutes.slice(0, 2).map((minutes) => (
                  <div
                    key={minutes.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#faf9f6] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#eef0ff] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2f2f2d] text-sm truncate">{minutes.title}</p>
                      <p className="text-xs text-[#78766d]">{formatDate(minutes.date)}</p>
                    </div>
                    <Badge className={`text-[10px] flex-shrink-0 ${
                      minutes.status === 'approved'
                        ? 'bg-[#e6f9ed] text-[#1a7a3a] border-transparent'
                        : 'bg-[#fff2e6] text-[#bf6722] border-transparent'
                    }`}>
                      {minutes.status === 'approved' ? 'Godkendt' : 'Afventer'}
                    </Badge>
                  </div>
                ))}

                {/* Demo activity items */}
                {demoActivities.slice(0, caseMinutes.length > 0 ? 3 : 5).map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#faf9f6] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#ecebe5] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-[#5f5d56]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#2f2f2d] text-sm">{activity.text}</p>
                        <p className="text-xs text-[#78766d]">{formatDate(activity.date)}</p>
                      </div>
                    </div>
                  );
                })}

                {caseMinutes.length === 0 && demoActivities.length === 0 && (
                  <p className="text-center text-[#78766d] py-4 text-sm">Ingen aktivitet endnu</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes Section */}
          <Card className="bg-white border border-[#e8e7e0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-base font-semibold text-[#2f2f2d] flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-[#5f5d56]" />
                Interne noter
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {/* Existing notes */}
              {notes.length > 0 && (
                <div className="space-y-2">
                  {notes.map((note, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#faf9f6] border border-[#e8e7e0]">
                      <p className="text-sm text-[#2f2f2d] leading-relaxed">{note.text}</p>
                      <p className="text-xs text-[#78766d] mt-1.5">{formatDate(note.date, 'dd. MMM yyyy, HH:mm')}</p>
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
                  className="w-full min-h-[80px] p-3 rounded-xl border border-[#e8e7e0] bg-[#faf9f6] text-sm text-[#2f2f2d] placeholder:text-[#b0aea5] resize-none focus:outline-none focus:border-[#c7ccf0] focus:ring-1 focus:ring-[#c7ccf0] transition-colors"
                />
                <Button
                  onClick={() => handleAddNote(selectedCase)}
                  disabled={!noteText.trim()}
                  className="bg-[#2f2f2f] text-white hover:bg-[#1a1a1a] rounded-xl text-sm h-9 px-4 disabled:opacity-40"
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

  // Cases list view (main view)
  return (
    <div className="space-y-4 p-4 max-w-lg mx-auto bg-[#faf9f6] min-h-screen">
      {/* Professional Info Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white border border-[#c7ccf0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-400 to-indigo-600" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#eef0ff] border border-[#c7ccf0] flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#2f2f2d] truncate">{currentUser?.name}</p>
                <p className="text-sm text-[#78766d] truncate">{currentUser?.organization}</p>
                <p className="text-xs text-indigo-600 font-medium">
                  {currentUser?.professionalType === 'caseworker' && 'Sagsbehandler'}
                  {currentUser?.professionalType === 'family_counselor' && 'Familieradgiver'}
                  {currentUser?.professionalType === 'lawyer' && 'Jurist'}
                  {currentUser?.professionalType === 'mediator' && 'Mægler'}
                </p>
              </div>
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback className="bg-[#eef0ff] text-indigo-700 text-sm font-medium">
                  {currentUser?.name?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="bg-white border border-[#e8e7e0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[#2f2f2d]">{activeCases.length}</p>
            <p className="text-[11px] text-[#78766d] font-medium">Aktive sager</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-[#e8e7e0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[#bf6722]">{pendingCount}</p>
            <p className="text-[11px] text-[#78766d] font-medium">Afventende</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-[#e8e7e0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{totalMinutes}</p>
            <p className="text-[11px] text-[#78766d] font-medium">Total referater</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78766d]" />
          <Input
            placeholder="Søg sagsnummer, navn eller afdeling..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-[#e8e7e0] rounded-xl text-sm text-[#2f2f2d] placeholder:text-[#b0aea5] focus:border-[#c7ccf0] focus:ring-[#c7ccf0] h-11"
          />
        </div>
      </motion.div>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between"
      >
        <h2 className="font-semibold text-[#2f2f2d] text-sm">Mine sager</h2>
        <span className="text-xs text-[#78766d]">{filteredCases.length} sag(er)</span>
      </motion.div>

      {/* Cases List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
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
              <Card className={`bg-white border border-[#e8e7e0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#f3c59d] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all ${getCaseLeftBorder(caseItem.priority)}`}>
                <CardContent className="p-4">
                  {/* Top row: case number + status */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-[#eef0ff] text-indigo-700 border border-[#c7ccf0] font-mono text-[11px] px-2 py-0.5">
                        {caseItem.caseNumber}
                      </Badge>
                      <Badge variant="outline" className="text-[#78766d] border-[#e8e7e0] text-[10px] px-1.5 py-0.5">
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
                            ? 'bg-[#fff2e6] text-[#bf6722]'
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
                      <h3 className="font-semibold text-[#2f2f2d] text-[15px]">{caseItem.familyName}</h3>
                      <p className="text-sm text-[#78766d]">
                        {caseItem.childName}, {caseItem.childAge} ar
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#b0aea5]" />
                  </div>

                  {/* Parents */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {caseItem.parents.map((parent, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#faf9f6] border border-[#e8e7e0] text-[#5f5d56]">
                        {parent}
                      </span>
                    ))}
                  </div>

                  {/* Bottom row: meta info */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-[11px] flex items-center gap-1 ${
                      daysSince > 14 ? 'text-[#bf6722]' : 'text-[#78766d]'
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
            <div className="w-14 h-14 rounded-2xl bg-[#ecebe5] flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-7 h-7 text-[#78766d]" />
            </div>
            <p className="text-[#2f2f2d] font-medium">Ingen sager fundet</p>
            <p className="text-sm text-[#78766d] mt-1">Prøv at søge efter noget andet</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
