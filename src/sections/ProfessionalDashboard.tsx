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
  Users, 
  FileText, 
  Calendar, 
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';

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

  // Demo case data - in real app would come from store
  const assignedCases = [
    {
      id: 'h1',
      caseNumber: 'BS-2024-001234',
      familyName: 'Emma\'s Familie',
      parents: ['Sarah', 'Michael'],
      childName: 'Emma',
      childAge: 6,
      status: 'active',
      lastContact: '2024-08-15',
      nextMeeting: '2024-09-01',
      unreadMessages: 2,
      pendingApprovals: 1,
    }
  ];

  const filteredCases = assignedCases.filter(c => 
    c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.familyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.parents.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Case detail view
  if (selectedCase) {
    const caseData = assignedCases.find(c => c.id === selectedCase);
    if (!caseData) return null;

    const caseMinutes = meetingMinutes.filter(m => m.householdId === selectedCase);
    const pendingMinutes = caseMinutes.filter(m => m.status === 'pending_approval');

    return (
      <div className="space-y-4 p-4 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" onClick={() => setSelectedCase(null)} className="mb-4">
            ← Tilbage til sagoversigt
          </Button>

          {/* Case Header */}
          <Card className="border-slate-200 mb-4">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="mb-2">{caseData.caseNumber}</Badge>
                  <h2 className="text-xl font-bold text-slate-900">{caseData.familyName}</h2>
                  <p className="text-sm text-slate-500">Barn: {caseData.childName}, {caseData.childAge} år</p>
                </div>
                <Badge className="bg-green-100 text-green-700">Aktiv</Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {caseData.parents.map((parent, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">{parent[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{parent}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => setActiveTab('meeting-minutes')}
            >
              <FileText className="w-6 h-6" />
              <span className="text-sm">Nyt referat</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => setActiveTab('kommunikation')}
            >
              <Users className="w-6 h-6" />
              <span className="text-sm">Besked</span>
              {caseData.unreadMessages > 0 && (
                <Badge className="absolute -top-1 -right-1">{caseData.unreadMessages}</Badge>
              )}
            </Button>
          </div>

          {/* Status Overview */}
          <Card className="border-slate-200 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Statusoversigt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Samværsplan</p>
                    <p className="text-sm text-slate-500">{custodyPlan?.pattern} ordning</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Afventer godkendelse</p>
                    <p className="text-sm text-slate-500">{pendingMinutes.length} referat(er)</p>
                  </div>
                </div>
                {pendingMinutes.length > 0 && (
                  <Badge variant="secondary">{pendingMinutes.length}</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Næste møde</p>
                    <p className="text-sm text-slate-500">{formatDate(caseData.nextMeeting)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Seneste aktivitet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {caseMinutes.slice(0, 3).map((minutes) => (
                  <div 
                    key={minutes.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{minutes.title}</p>
                      <p className="text-sm text-slate-500">{formatDate(minutes.date)}</p>
                    </div>
                    <Badge variant={minutes.status === 'approved' ? 'default' : 'secondary'}>
                      {minutes.status === 'approved' ? 'Godkendt' : 'Afventer'}
                    </Badge>
                  </div>
                ))}
                {caseMinutes.length === 0 && (
                  <p className="text-center text-slate-400 py-4">Ingen aktivitet endnu</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Cases list view
  return (
    <div className="space-y-4 p-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Mine sager</h1>
        <p className="text-slate-500">Oversigt over dine familier</p>
      </motion.div>

      {/* Professional Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback className="bg-indigo-200 text-indigo-700">
                  {currentUser?.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-indigo-900">{currentUser?.name}</p>
                <p className="text-sm text-indigo-700">{currentUser?.organization}</p>
                <p className="text-xs text-indigo-600">
                  {currentUser?.professionalType === 'caseworker' && 'Sagsbehandler'}
                  {currentUser?.professionalType === 'family_counselor' && 'Familierådgiver'}
                  {currentUser?.professionalType === 'lawyer' && 'Jurist'}
                  {currentUser?.professionalType === 'mediator' && 'Mægler'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Søg efter sagsnummer eller navn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{assignedCases.length}</p>
            <p className="text-xs text-slate-500">Aktive sager</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {meetingMinutes.filter(m => m.status === 'pending_approval').length}
            </p>
            <p className="text-xs text-slate-500">Afventer</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{meetingMinutes.length}</p>
            <p className="text-xs text-slate-500">Referater</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cases List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        <h2 className="font-semibold text-slate-700">Tilknyttede familier</h2>
        
        {filteredCases.map((caseItem, index) => (
          <motion.div
            key={caseItem.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            onClick={() => setSelectedCase(caseItem.id)}
          >
            <Card className="border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">{caseItem.caseNumber}</Badge>
                    <h3 className="font-semibold text-slate-900">{caseItem.familyName}</h3>
                    <p className="text-sm text-slate-500">
                      {caseItem.childName}, {caseItem.childAge} år
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {caseItem.parents.map((parent, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      {parent}
                    </span>
                  ))}
                </div>
                {(caseItem.unreadMessages > 0 || caseItem.pendingApprovals > 0) && (
                  <div className="flex gap-2 mt-3">
                    {caseItem.unreadMessages > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {caseItem.unreadMessages} besked(er)
                      </Badge>
                    )}
                    {caseItem.pendingApprovals > 0 && (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">
                        Afventer godkendelse
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredCases.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Ingen sager fundet</p>
            <p className="text-sm text-slate-400">Prøv at søge efter noget andet</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
