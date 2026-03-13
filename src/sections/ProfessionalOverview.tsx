import { useAppStore } from '@/store';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function ProfessionalOverview() {
  const {
    professionalCases,
    riskAssessments,
    departments,
    setActiveTab,
    setProfessionalCaseFilter,
  } = useAppStore();

  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const activeCases = professionalCases.filter(c => c.status === 'active');
  const pendingCases = professionalCases.filter(c => c.pendingApprovals > 0);
  const highRiskCases = professionalCases.filter(c => c.riskLevel === 'high');
  const totalCases = professionalCases.length;

  // Risk distribution
  const lowRisk = professionalCases.filter(c => c.riskLevel === 'low').length;
  const mediumRisk = professionalCases.filter(c => c.riskLevel === 'medium').length;
  const highRisk = highRiskCases.length;

  // Group cases by department
  const casesByDept = professionalCases.reduce((acc, c) => {
    const key = c.departmentId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {} as Record<string, typeof professionalCases>);

  // Upcoming meetings across cases
  const upcomingMeetings = professionalCases
    .filter(c => c.nextMeeting && c.status === 'active')
    .sort((a, b) => (a.nextMeeting || '').localeCompare(b.nextMeeting || ''))
    .slice(0, 5);

  return (
    <div className="space-y-3 py-1">
      {/* Portfolio Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-lg font-bold text-foreground mb-2">Sagsoverblik</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card
            className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer hover:border-orange-tint transition-colors"
            onClick={() => { setProfessionalCaseFilter('all'); setActiveTab('cases'); }}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{totalCases}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Total sager</p>
            </CardContent>
          </Card>
          <Card
            className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer hover:border-orange-tint transition-colors"
            onClick={() => { setProfessionalCaseFilter('active'); setActiveTab('cases'); }}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-[#1a7a3a]">{activeCases.length}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Aktive</p>
            </CardContent>
          </Card>
          <Card
            className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer hover:border-orange-tint transition-colors"
            onClick={() => { setProfessionalCaseFilter('pending'); setActiveTab('cases'); }}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-[#bf6722]">{pendingCases.length}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Afventende</p>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{highRiskCases.length}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Hoj risiko</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Risk Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              Risikooversigt
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {totalCases > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Lav</span>
                      <span className="text-xs font-medium text-foreground">{lowRisk}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${totalCases > 0 ? (lowRisk / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Mellem</span>
                      <span className="text-xs font-medium text-foreground">{mediumRisk}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${totalCases > 0 ? (mediumRisk / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Hoj</span>
                      <span className="text-xs font-medium text-foreground">{highRisk}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${totalCases > 0 ? (highRisk / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
                {riskAssessments.length > 0 && (
                  <p className="text-xs text-muted-foreground pt-1">{riskAssessments.length} risikovurdering(er) i alt</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Ingen sager endnu</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Departments & Municipalities */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Kommuner & afdelinger
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {Object.keys(casesByDept).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(casesByDept).map(([deptId, cases]) => {
                  const dept = departments.find(d => d.id === deptId);
                  const isExpanded = expandedDept === deptId;
                  return (
                    <div key={deptId}>
                      <button
                        onClick={() => setExpandedDept(isExpanded ? null : deptId)}
                        className="w-full flex items-center justify-between p-2.5 rounded-[8px] hover:bg-card transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          <div className="text-left">
                            <p className="text-sm font-medium text-foreground">
                              {dept?.departmentName || deptId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {dept?.municipality || cases[0]?.municipality || ''}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-secondary text-muted-foreground border-transparent text-xs">
                          {cases.length} sag{cases.length !== 1 ? 'er' : ''}
                        </Badge>
                      </button>
                      {isExpanded && (
                        <div className="ml-6 space-y-1 pb-1">
                          {cases.map(c => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between p-2 rounded-[6px] bg-card cursor-pointer hover:bg-background transition-colors"
                              onClick={() => { setProfessionalCaseFilter('all'); setActiveTab('cases'); }}
                            >
                              <div>
                                <p className="text-sm text-foreground">{c.familyName}</p>
                                <p className="text-xs text-muted-foreground">{c.caseNumber}</p>
                              </div>
                              <Badge className={`text-[10px] border-transparent ${
                                c.status === 'active' ? 'bg-green-tint text-[#1a7a3a]' :
                                c.status === 'paused' ? 'bg-orange-tint text-[#bf6722]' :
                                'bg-secondary text-muted-foreground'
                              }`}>
                                {c.status === 'active' ? 'Aktiv' : c.status === 'paused' ? 'Pauseret' : 'Afsluttet'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Ingen afdelinger endnu</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Meetings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Kommende moder
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-1">
                {upcomingMeetings.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-card cursor-pointer transition-colors"
                    onClick={() => setActiveTab('cases')}
                  >
                    <div className="w-8 h-8 rounded-[8px] bg-blue-tint flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.familyName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(c.nextMeeting || '')}</p>
                    </div>
                    {c.riskLevel === 'high' && (
                      <Badge className="bg-red-50 text-red-700 border-transparent text-[10px]">Hoj</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-[8px] bg-secondary flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Ingen kommende moder</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-2 gap-3"
      >
        <Card
          className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer hover:border-orange-tint transition-colors"
          onClick={() => setActiveTab('cases')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-secondary flex items-center justify-center">
              <Briefcase className="w-4.5 h-4.5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Mine sager</span>
          </CardContent>
        </Card>
        <Card
          className="bg-card border border-border rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer hover:border-orange-tint transition-colors"
          onClick={() => setActiveTab('meeting-minutes')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-blue-tint flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-foreground">Referater</span>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
