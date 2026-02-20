import { useState } from 'react';
import { useAppStore } from '@/store';
import { meetingMinutesId } from '@/lib/id';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Plus,
  Building2,
  Gavel
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function MeetingMinutesView() {
  const { 
    currentUser, 
    users, 
    meetingMinutes, 
    household,
    isProfessionalView,
    addMeetingMinutes,
    approveMeetingMinutes
  } = useAppStore();
  
  const [selectedMinutes, setSelectedMinutes] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newMinutes, setNewMinutes] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    location: '',
    agenda: '',
  });

  const canCreateMinutes = isProfessionalView || currentUser?.role === 'parent';
  
  const filteredMinutes = isProfessionalView 
    ? meetingMinutes.filter(() => household?.assignedProfessionals?.includes(currentUser?.id || ''))
    : meetingMinutes;

  const handleCreateMinutes = () => {
    if (!newMinutes.title || !household) return;
    
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
    
    setIsCreating(false);
    setNewMinutes({ title: '', date: format(new Date(), 'yyyy-MM-dd'), location: '', agenda: '' });
    toast.success('Referat oprettet');
  };

  const handleApprove = (minutesId: string) => {
    approveMeetingMinutes(minutesId, currentUser?.id || '');
    toast.success('Referat godkendt');
  };

  // Detail view for selected minutes
  if (selectedMinutes) {
    const minutes = meetingMinutes.find(m => m.id === selectedMinutes);
    if (!minutes) return null;

    const isApproved = minutes.approvedBy?.includes(currentUser?.id || '');

    return (
      <div className="space-y-4 p-4 max-w-lg mx-auto">
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
                        className="p-3 rounded-xl bg-blue-50 border border-blue-100"
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
                        className="p-3 rounded-xl bg-green-50 border border-green-100"
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
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
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
                <div className="flex items-center justify-center gap-2 text-green-600 p-4 bg-green-50 rounded-xl">
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
    <div className="space-y-4 p-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mødereferater</h1>
          <p className="text-slate-500">
            {isProfessionalView 
              ? 'Dokumentation fra samtaler' 
              : 'Referater fra jeres møder'}
          </p>
        </div>
        {canCreateMinutes && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600">
                <Plus className="w-4 h-4 mr-1" />
                Nyt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Opret nyt referat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Titel</Label>
                  <Input 
                    value={newMinutes.title}
                    onChange={(e) => setNewMinutes({...newMinutes, title: e.target.value})}
                    placeholder="F.eks. Samværssamtale - August 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dato</Label>
                  <Input 
                    type="date"
                    value={newMinutes.date}
                    onChange={(e) => setNewMinutes({...newMinutes, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sted</Label>
                  <Input 
                    value={newMinutes.location}
                    onChange={(e) => setNewMinutes({...newMinutes, location: e.target.value})}
                    placeholder="F.eks. Familierådgivningen"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dagsorden</Label>
                  <Textarea 
                    value={newMinutes.agenda}
                    onChange={(e) => setNewMinutes({...newMinutes, agenda: e.target.value})}
                    placeholder="Hvad skal drøftes på mødet?"
                  />
                </div>
                <Button onClick={handleCreateMinutes} className="w-full">
                  Opret referat
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
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

      {/* Minutes List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {filteredMinutes.length === 0 ? (
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
          filteredMinutes.map((minutes, index) => (
            <motion.div
              key={minutes.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedMinutes(minutes.id)}
            >
              <Card className="border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 truncate">{minutes.title}</p>
                          <p className="text-sm text-slate-500">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(minutes.date)}
                            {minutes.location && ` • ${minutes.location}`}
                          </p>
                        </div>
                        <Badge 
                          variant={minutes.status === 'approved' ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {minutes.status === 'approved' ? 'Godkendt' : 'Udkast'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-slate-500">
                          {minutes.decisions.length} beslutninger
                        </span>
                        <span className="text-xs text-slate-500">
                          {minutes.agreements.length} aftaler
                        </span>
                      </div>
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
