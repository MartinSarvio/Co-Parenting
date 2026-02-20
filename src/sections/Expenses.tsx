import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppStore } from '@/store';
import { expenseId as generateExpenseId, transferId as generateTransferId } from '@/lib/id';
import { exportExpensesCSV, printExpenses } from '@/lib/export';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { getPlanFeatures } from '@/lib/subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Building2,
  Shirt,
  Pill,
  GraduationCap,
  Bus,
  UtensilsCrossed,
  MoreHorizontal,
  ArrowRightLeft,
  Check,
  X,
  CreditCard,
  Repeat2,
  TriangleAlert,
  Lock,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Expense, MoneyTransfer } from '@/types';

const expenseCategories = [
  { value: 'institution', label: 'Institution', icon: Building2, color: 'bg-[#eceae2] text-[#2f2f2f]' },
  { value: 'medical', label: 'Medicin/Sundhed', icon: Pill, color: 'bg-[#fff1e5] text-[#b96424]' },
  { value: 'clothing', label: 'Tøj', icon: Shirt, color: 'bg-[#f3f2ec] text-[#5f5c53]' },
  { value: 'activities', label: 'Aktiviteter', icon: GraduationCap, color: 'bg-[#fff2e6] text-[#c66f23]' },
  { value: 'school', label: 'Skole', icon: GraduationCap, color: 'bg-[#eceae2] text-[#47443d]' },
  { value: 'food', label: 'Mad', icon: UtensilsCrossed, color: 'bg-[#fff2e6] text-[#c66f23]' },
  { value: 'transport', label: 'Transport', icon: Bus, color: 'bg-[#f3f2ec] text-[#5f5c53]' },
  { value: 'other', label: 'Andet', icon: MoreHorizontal, color: 'bg-[#eceae2] text-[#4f4b43]' },
] as const;

const recurringIntervals = [
  { value: 'weekly', label: 'Hver uge' },
  { value: 'monthly', label: 'Hver måned' },
  { value: 'yearly', label: 'Hvert år' },
] as const;

type TransferMode = 'request' | 'send';

type NewExpenseState = {
  title: string;
  description: string;
  amount: string;
  category: string;
  childId: string;
  institutionId: string;
  splitType: 'equal' | 'percentage' | 'fixed';
  date: string;
  receiptUrl: string;
  isRecurring: boolean;
  recurringInterval: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  isUnexpected: boolean;
};

function getDefaultExpenseState(): NewExpenseState {
  return {
    title: '',
    description: '',
    amount: '',
    category: 'other',
    childId: '',
    institutionId: '',
    splitType: 'equal',
    date: new Date().toISOString().slice(0, 10),
    receiptUrl: '',
    isRecurring: false,
    recurringInterval: 'monthly',
    nextDueDate: '',
    isUnexpected: false,
  };
}

function calculateNextDueDate(date: string, interval: 'weekly' | 'monthly' | 'yearly'): string | undefined {
  const base = new Date(date);
  if (Number.isNaN(base.getTime())) return undefined;

  const next = new Date(base);
  if (interval === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (interval === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else {
    next.setFullYear(next.getFullYear() + 1);
  }

  return next.toISOString().slice(0, 10);
}

export function Expenses() {
  const {
    currentUser,
    users,
    children,
    institutions,
    household,
    paymentAccounts,
    transfers,
    expenses,
    addExpense,
    updateExpense,
    approveExpense,
    disputeExpense,
    resolveExpenseDispute,
    addTransfer,
    updateTransfer,
    addDocument,
    setActiveTab: setAppTab
  } = useAppStore();

  const features = getPlanFeatures(household);
  const canUseExpenses = features.expenses;
  const canUsePayments = features.inAppPayments;
  const canUseRecurring = features.recurringExpenses;
  const shouldAutoArchiveReceipts = Boolean(
    household?.singleParentSupport?.autoArchiveReceipts && features.singleParentEvidence
  );

  const [activeFilter, setActiveFilter] = useState('all');
  const [showStats, setShowStats] = useState(false);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState<number | null>(null); // null = all months
  const [detailExpenseId, setDetailExpenseId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<TransferMode>('request');
  const [newExpense, setNewExpense] = useState<NewExpenseState>(getDefaultExpenseState());
  const [splitMode, setSplitMode] = useState<'equal' | 'amount' | 'percentage' | 'full_request'>('equal');
  const [splitTargetUserId, setSplitTargetUserId] = useState('');
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [transferDraft, setTransferDraft] = useState({
    peerUserId: '',
    amount: '',
    note: '',
  });
  const [disputeDialogExpenseId, setDisputeDialogExpenseId] = useState<string | null>(null);
  const [disputeReasonInput, setDisputeReasonInput] = useState('');
  const [resolveDialogExpenseId, setResolveDialogExpenseId] = useState<string | null>(null);
  const [resolveNoteInput, setResolveNoteInput] = useState('');

  const currentChild = children[0];
  const parentUsers = users.filter((user) => user.role === 'parent');

  const myAccounts = useMemo(() => {
    if (!currentUser) return [];
    return paymentAccounts.filter((account) => account.userId === currentUser.id);
  }, [paymentAccounts, currentUser]);

  const getPrimaryAccount = (userId: string) => {
    const userAccounts = paymentAccounts.filter((account) => account.userId === userId);
    return userAccounts.find((account) => account.isPrimary) || userAccounts[0];
  };

  const partnerUsers = useMemo(() => {
    if (!currentUser) return [];
    return parentUsers.filter((user) => user.id !== currentUser.id);
  }, [parentUsers, currentUser]);

  useEffect(() => {
    if (parentUsers.length === 0) return;
    setCustomShares((prev) => {
      const next: Record<string, string> = {};
      parentUsers.forEach((user) => {
        next[user.id] = prev[user.id] || '';
      });
      return next;
    });
    if (!splitTargetUserId) {
      const fallback = parentUsers.find((user) => user.id !== currentUser?.id)?.id || parentUsers[0].id;
      setSplitTargetUserId(fallback);
    }
  }, [parentUsers, splitTargetUserId, currentUser]);

  const filteredExpenses = expenses.filter((expense) => {
    // Period filter
    const expDate = new Date(expense.date);
    if (expDate.getFullYear() !== periodYear) return false;
    if (periodMonth !== null && expDate.getMonth() !== periodMonth) return false;

    // Status/type filter
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return expense.status === 'pending';
    if (activeFilter === 'paid') return expense.status === 'paid';
    if (activeFilter === 'disputed') return expense.status === 'disputed';
    if (activeFilter === 'recurring') return Boolean(expense.isRecurring);
    if (activeFilter === 'unexpected') return Boolean(expense.isUnexpected);
    return expense.category === activeFilter;
  });

  const detailExpense = detailExpenseId ? expenses.find(e => e.id === detailExpenseId) : null;

  const danishMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  const danishMonthsFull = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'];

  // Monthly totals for chart (last 6 months)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const months: { month: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('da-DK', { month: 'short' });
      const total = expenses
        .filter(e => e.date.startsWith(key))
        .reduce((sum, e) => sum + e.amount, 0);
      months.push({ month: label, total });
    }
    return months;
  }, [expenses]);

  // Category totals for chart
  const categoryStats = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] ?? 0) + e.amount;
    });
    return expenseCategories.map(cat => ({
      name: cat.label,
      total: totals[cat.value] ?? 0,
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const balance = useMemo(() => {
    const userBalance: Record<string, number> = {};
    users.forEach((user) => {
      userBalance[user.id] = 0;
    });

    expenses
      .filter((expense) => expense.status !== 'disputed')
      .forEach((expense) => {
        const totalAmount = Object.values(expense.splitAmounts).reduce((sum, amount) => sum + amount, 0);
        userBalance[expense.paidBy] += totalAmount;
        Object.entries(expense.splitAmounts).forEach(([userId, amount]) => {
          userBalance[userId] -= amount;
        });
      });

    return userBalance;
  }, [expenses, users]);

  const transferHistory = useMemo(() => {
    if (!currentUser) return [];
    return [...transfers]
      .filter((transfer) => transfer.fromUserId === currentUser.id || transfer.toUserId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transfers, currentUser]);

  const incomingRequests = useMemo(() => {
    if (!currentUser) return [];
    return transferHistory.filter((transfer) => transfer.toUserId === currentUser.id && transfer.status === 'requested');
  }, [transferHistory, currentUser]);

  const archiveReceiptAsEvidence = (expense: Expense) => {
    if (!currentUser) return;
    if (!shouldAutoArchiveReceipts) return;
    const url = expense.receiptUrl || expense.receiptUrls?.[0];
    if (!url) return;

    const sharedWith = Array.from(new Set([
      ...(household?.members || []),
      ...(household?.singleParentSupport?.lawyerIds || []),
      currentUser.id,
    ]));

    addDocument({
      id: `doc-receipt-${expense.id}`,
      childId: expense.childId,
      title: `Kvittering: ${expense.title}`,
      type: 'other',
      url,
      uploadedBy: currentUser.id,
      uploadedAt: new Date().toISOString(),
      sharedWith,
      isOfficial: true,
      authorityReference: 'Automatisk gemt fra udgiftsmodul',
    });
  };

  const handleAddExpense = () => {
    if (!newExpense.title.trim() || !newExpense.amount || !currentUser) {
      toast.error('Tilføj titel og beløb');
      return;
    }

    const amount = Number.parseFloat(newExpense.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Beløb skal være større end 0');
      return;
    }

    const splitWith = parentUsers.map((user) => user.id);
    if (splitWith.length === 0) {
      toast.error('Ingen forældre fundet til fordeling');
      return;
    }

    const splitAmounts: Record<string, number> = {};
    let resolvedSplitType: Expense['splitType'] = 'equal';

    if (splitMode === 'equal') {
      const splitAmount = Number((amount / splitWith.length).toFixed(2));
      splitWith.forEach((userId) => {
        splitAmounts[userId] = splitAmount;
      });
      resolvedSplitType = 'equal';
    } else if (splitMode === 'amount') {
      splitWith.forEach((userId) => {
        splitAmounts[userId] = Number.parseFloat(customShares[userId] || '0') || 0;
      });
      const sum = Object.values(splitAmounts).reduce((acc, value) => acc + value, 0);
      if (Math.abs(sum - amount) > 0.5) {
        toast.error('Fordeling i beløb skal svare til totalbeløbet');
        return;
      }
      resolvedSplitType = 'fixed';
    } else if (splitMode === 'percentage') {
      const percentages: Record<string, number> = {};
      splitWith.forEach((userId) => {
        percentages[userId] = Number.parseFloat(customShares[userId] || '0') || 0;
      });
      const totalPercent = Object.values(percentages).reduce((acc, value) => acc + value, 0);
      if (Math.abs(totalPercent - 100) > 0.5) {
        toast.error('Procenterne skal tilsammen give 100%');
        return;
      }
      splitWith.forEach((userId) => {
        splitAmounts[userId] = Number(((percentages[userId] / 100) * amount).toFixed(2));
      });
      resolvedSplitType = 'percentage';
    } else {
      if (!splitTargetUserId) {
        toast.error('Vælg hvem der skal anmodes om hele beløbet');
        return;
      }
      splitWith.forEach((userId) => {
        splitAmounts[userId] = userId === splitTargetUserId ? amount : 0;
      });
      resolvedSplitType = 'fixed';
    }

    const nextDueDate = newExpense.isRecurring
      ? newExpense.nextDueDate || calculateNextDueDate(newExpense.date, newExpense.recurringInterval)
      : undefined;

    const expenseId = generateExpenseId();
    const expense: Expense = {
      id: expenseId,
      title: newExpense.title.trim(),
      description: newExpense.description.trim() || undefined,
      amount,
      currency: 'DKK',
      category: newExpense.category as Expense['category'],
      paidBy: currentUser.id,
      splitWith,
      splitAmounts,
      splitType: resolvedSplitType,
      date: newExpense.date || new Date().toISOString(),
      receiptUrl: newExpense.receiptUrl.trim() || undefined,
      receiptUrls: newExpense.receiptUrl.trim() ? [newExpense.receiptUrl.trim()] : undefined,
      status: 'pending',
      childId: newExpense.childId || currentChild?.id,
      institutionId: newExpense.institutionId || undefined,
      createdAt: new Date().toISOString(),
      isRecurring: canUseRecurring ? newExpense.isRecurring : false,
      recurringInterval: canUseRecurring && newExpense.isRecurring ? newExpense.recurringInterval : undefined,
      nextDueDate,
      isUnexpected: newExpense.isUnexpected,
    };

    addExpense(expense);
    archiveReceiptAsEvidence(expense);

    if (splitMode === 'full_request' && canUsePayments && splitTargetUserId && splitTargetUserId !== currentUser.id) {
      const transferId = generateTransferId();
      addTransfer({
        id: transferId,
        fromUserId: splitTargetUserId,
        toUserId: currentUser.id,
        amount,
        currency: 'DKK',
        status: 'requested',
        note: `Hele beløbet for ${expense.title}`,
        expenseId,
        createdAt: new Date().toISOString(),
      });
      updateExpense(expenseId, { linkedTransferId: transferId });
    }

    setIsAddOpen(false);
    setNewExpense(getDefaultExpenseState());
    setSplitMode('equal');
    setCustomShares({});
    toast.success('Udgift tilføjet');
  };

  const requestPaymentForExpense = (expense: Expense) => {
    if (!currentUser) return;
    if (!canUsePayments) {
      toast.error('Send/anmod penge kræver abonnement');
      return;
    }
    if (expense.linkedTransferId) {
      toast.message('Der er allerede oprettet en betaling for denne udgift');
      return;
    }

    const debtor = users.find((user) => user.id !== expense.paidBy && (expense.splitAmounts[user.id] || 0) > 0);
    if (!debtor) {
      toast.error('Kunne ikke finde modpart at anmode');
      return;
    }

    const amount = expense.splitAmounts[debtor.id] || 0;
    if (amount <= 0) {
      toast.error('Ingen andel at anmode om');
      return;
    }

    const transferId = generateTransferId();
    addTransfer({
      id: transferId,
      fromUserId: debtor.id,
      toUserId: expense.paidBy,
      amount,
      currency: 'DKK',
      status: 'requested',
      note: `Andel af ${expense.title}`,
      expenseId: expense.id,
      createdAt: new Date().toISOString(),
    });

    updateExpense(expense.id, { linkedTransferId: transferId });
    toast.success(`Betalingsanmodning sendt til ${debtor.name}`);
  };

  const handleCreateTransfer = () => {
    if (!canUsePayments) {
      toast.error('Send/anmod penge kræver abonnement');
      return;
    }
    if (!currentUser) return;

    if (!transferDraft.peerUserId || !transferDraft.amount) {
      toast.error('Vælg modtager og beløb');
      return;
    }

    const amount = Number.parseFloat(transferDraft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Ugyldigt beløb');
      return;
    }

    const myPrimaryAccount = getPrimaryAccount(currentUser.id);
    const peerPrimaryAccount = getPrimaryAccount(transferDraft.peerUserId);

    if (!myPrimaryAccount || !peerPrimaryAccount) {
      toast.error('Begge brugere skal have en primær betalingskonto');
      return;
    }

    const transfer: MoneyTransfer = {
      id: generateTransferId(),
      fromUserId: transferMode === 'request' ? transferDraft.peerUserId : currentUser.id,
      toUserId: transferMode === 'request' ? currentUser.id : transferDraft.peerUserId,
      amount,
      currency: 'DKK',
      status: transferMode === 'request' ? 'requested' : 'sent',
      note: transferDraft.note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    addTransfer(transfer);
    setTransferDraft({ peerUserId: '', amount: '', note: '' });
    setIsTransferOpen(false);
    toast.success(transferMode === 'request' ? 'Betalingsanmodning sendt' : 'Betaling markeret som sendt');
  };

  const respondToTransfer = (transferId: string, status: 'completed' | 'declined') => {
    updateTransfer(transferId, {
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    });
    toast.success(status === 'completed' ? 'Betaling bekræftet' : 'Anmodning afvist');
  };

  const handleApprove = (expenseId: string) => {
    if (!currentUser) return;
    approveExpense(expenseId, currentUser.id);
    toast.success('Udgift godkendt');
  };

  const handleDispute = (expenseId: string) => {
    setDisputeReasonInput('');
    setDisputeDialogExpenseId(expenseId);
  };

  const submitDispute = () => {
    if (!disputeDialogExpenseId || !currentUser) return;
    disputeExpense(disputeDialogExpenseId, disputeReasonInput || 'Kræver manuel gennemgang', currentUser.id);
    toast.message('Udgiften er markeret som anfægtet');
    setDisputeDialogExpenseId(null);
    setDisputeReasonInput('');
  };

  const handleResolve = (expenseId: string) => {
    setResolveNoteInput('');
    setResolveDialogExpenseId(expenseId);
  };

  const submitResolve = () => {
    if (!resolveDialogExpenseId || !currentUser) return;
    resolveExpenseDispute(resolveDialogExpenseId, resolveNoteInput || 'Løst', currentUser.id);
    toast.success('Tvist løst');
    setResolveDialogExpenseId(null);
    setResolveNoteInput('');
  };

  if (!canUseExpenses) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <Card className="border-[#f3c59d] bg-[#fff2e6]">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[#f58a2d] p-2 text-white">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[#2f2f2d]">Udgifter er en abonnementsfunktion</p>
                <p className="text-sm text-[#7a634b]">
                  Opgrader for at dele udgifter, oprette faste betalinger og sende/anmode penge direkte i appen.
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={() => setAppTab('settings')}>
              Gå til abonnement
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff2e6] text-[#f58a2d]">
          <Receipt className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold text-[#2f2f2d]">Udgifter</h1>
        <p className="text-sm text-[#75736b]">Del faste og uventede udgifter i familien</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-[#d8d7cf] bg-[#f8f7f3]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="h-4 w-4 text-[#666359]" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {users.map((user) => {
              const userBalance = balance[user.id] || 0;
              const isPositive = userBalance > 0;
              return (
                <div key={user.id} className="flex items-center justify-between rounded-xl border border-[#dfddd6] bg-white p-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-[#2f2f2d]">{user.name}</span>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isPositive ? 'text-[#b96424]' : userBalance < 0 ? 'text-[#2f2f2f]' : 'text-[#75736b]'
                    )}
                  >
                    {isPositive ? '+' : ''}{formatCurrency(userBalance)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-[#d8d7cf] bg-[#faf9f6]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-[#666359]" />
              Send / anmod penge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {!canUsePayments && (
              <p className="rounded-xl border border-[#f3c59d] bg-[#fff2e6] px-3 py-2 text-sm text-[#a7632c]">
                Denne funktion kræver Family Plus eller Enlig Plus.
              </p>
            )}

            <p className="text-xs text-[#75736b]">
              Din primære konto: {myAccounts.find((account) => account.isPrimary)?.accountLabel || 'Ikke sat'}
            </p>

            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" disabled={!canUsePayments}>
                  Opret betaling eller anmodning
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send eller anmod penge</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={transferMode === 'request' ? 'default' : 'outline'}
                      onClick={() => setTransferMode('request')}
                    >
                      Anmod
                    </Button>
                    <Button
                      type="button"
                      variant={transferMode === 'send' ? 'default' : 'outline'}
                      onClick={() => setTransferMode('send')}
                    >
                      Send
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Modpart</Label>
                    <Select
                      value={transferDraft.peerUserId}
                      onValueChange={(value) => setTransferDraft((prev) => ({ ...prev, peerUserId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg forælder" />
                      </SelectTrigger>
                      <SelectContent>
                        {partnerUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Beløb (DKK)</Label>
                    <Input
                      type="number"
                      value={transferDraft.amount}
                      onChange={(event) => setTransferDraft((prev) => ({ ...prev, amount: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Note</Label>
                    <Textarea
                      rows={2}
                      value={transferDraft.note}
                      onChange={(event) => setTransferDraft((prev) => ({ ...prev, note: event.target.value }))}
                      placeholder="Fx andel af institution"
                    />
                  </div>

                  <Button type="button" className="w-full" onClick={handleCreateTransfer}>
                    {transferMode === 'request' ? 'Send anmodning' : 'Registrer sendt betaling'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {incomingRequests.length > 0 && (
              <div className="space-y-2">
                {incomingRequests.slice(0, 2).map((transfer) => {
                  const sender = users.find((user) => user.id === transfer.fromUserId);
                  return (
                    <div key={transfer.id} className="rounded-xl border border-[#dfddd6] bg-white p-3">
                      <p className="text-sm font-medium text-[#2f2f2d]">
                        {sender?.name || 'Ukendt'} anmoder om {formatCurrency(transfer.amount)}
                      </p>
                      <p className="text-xs text-[#75736b]">{transfer.note || 'Ingen note'}</p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => respondToTransfer(transfer.id, 'declined')}>
                          Afvis
                        </Button>
                        <Button size="sm" onClick={() => respondToTransfer(transfer.id, 'completed')}>
                          Bekræft betalt
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Tilføj udgift
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ny udgift</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Hvad er der betalt for?</Label>
                <Input
                  value={newExpense.title}
                  onChange={(event) => setNewExpense((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Fx Institution, forsikring eller medicin"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Beløb (DKK)</Label>
                  <Input
                    type="number"
                    value={newExpense.amount}
                    onChange={(event) => setNewExpense((prev) => ({ ...prev, amount: event.target.value }))}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dato</Label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(event) => setNewExpense((prev) => ({ ...prev, date: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <div className="grid grid-cols-2 gap-2">
                  {expenseCategories.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setNewExpense((prev) => ({ ...prev, category: category.value }))}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border p-2.5 text-left transition-colors',
                        newExpense.category === category.value
                          ? 'border-[#f3c59d] bg-[#fff2e6]'
                          : 'border-[#d8d7cf] bg-[#faf9f6] hover:bg-[#f2f1ec]'
                      )}
                    >
                      <div className={cn('rounded-lg p-1.5', category.color)}>
                        <category.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-[#35342f]">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fordelingsmodel</Label>
                <Select
                  value={splitMode}
                  onValueChange={(value: 'equal' | 'amount' | 'percentage' | 'full_request') => setSplitMode(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Lige fordeling</SelectItem>
                    <SelectItem value="amount">Beløb pr. person</SelectItem>
                    <SelectItem value="percentage">Procent pr. person</SelectItem>
                    <SelectItem value="full_request">Anmod én person om hele beløbet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {splitMode === 'full_request' ? (
                <div className="space-y-2">
                  <Label>Hele beløbet anmodes hos</Label>
                  <Select
                    value={splitTargetUserId}
                    onValueChange={setSplitTargetUserId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg forælder" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentUsers
                        .filter((user) => user.id !== currentUser?.id)
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {(splitMode === 'amount' || splitMode === 'percentage') ? (
                <div className="space-y-2 rounded-xl border border-[#dfddd6] bg-[#faf9f6] p-3">
                  {parentUsers.map((user) => (
                    <div key={user.id} className="grid grid-cols-[1fr_120px] items-center gap-2">
                      <p className="text-sm text-[#47443d]">{user.name}</p>
                      <Input
                        type="number"
                        value={customShares[user.id] || ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          setCustomShares((prev) => ({ ...prev, [user.id]: value }));
                        }}
                        placeholder={splitMode === 'percentage' ? '%' : 'kr'}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-[#75736b]">
                    {splitMode === 'percentage'
                      ? 'Procenter skal tilsammen være 100.'
                      : 'Beløb skal tilsammen være lig totalbeløbet.'}
                  </p>
                </div>
              ) : null}

              {newExpense.category === 'institution' && institutions.length > 0 && (
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Select
                    value={newExpense.institutionId}
                    onValueChange={(value) => setNewExpense((prev) => ({ ...prev, institutionId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg institution" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((institution) => (
                        <SelectItem key={institution.id} value={institution.id}>
                          {institution.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Kvittering link (valgfri)</Label>
                <Input
                  value={newExpense.receiptUrl}
                  onChange={(event) => setNewExpense((prev) => ({ ...prev, receiptUrl: event.target.value }))}
                  placeholder="https://..."
                />
                {shouldAutoArchiveReceipts && (
                  <p className="text-xs text-[#75736b]">
                    Kvitteringer bliver automatisk gemt i dokumentation.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 rounded-xl border border-[#dfddd6] bg-[#faf9f6] p-3">
                <label className="flex items-center gap-2 text-sm text-[#47443d]">
                  <Checkbox
                    checked={newExpense.isUnexpected}
                    onCheckedChange={(checked) => setNewExpense((prev) => ({ ...prev, isUnexpected: checked as boolean }))}
                  />
                  Uventet udgift
                </label>

                <label className="flex items-center gap-2 text-sm text-[#47443d]">
                  <Checkbox
                    checked={newExpense.isRecurring}
                    onCheckedChange={(checked) => setNewExpense((prev) => ({ ...prev, isRecurring: checked as boolean }))}
                    disabled={!canUseRecurring}
                  />
                  Fast (gentagende) udgift
                </label>

                {newExpense.isRecurring && canUseRecurring && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Select
                      value={newExpense.recurringInterval}
                      onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => setNewExpense((prev) => ({ ...prev, recurringInterval: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {recurringIntervals.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={newExpense.nextDueDate}
                      onChange={(event) => setNewExpense((prev) => ({ ...prev, nextDueDate: event.target.value }))}
                      placeholder="Næste betaling"
                    />
                  </div>
                )}

                {newExpense.isRecurring && !canUseRecurring && (
                  <p className="text-xs text-[#b3662f]">
                    Faste udgifter kræver Family Plus eller Enlig Plus.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse (valgfri)</Label>
                <Textarea
                  rows={3}
                  value={newExpense.description}
                  onChange={(event) => setNewExpense((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Yderligere detaljer..."
                />
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={!newExpense.title || !newExpense.amount}
                onClick={handleAddExpense}
              >
                Gem udgift
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filter bar: dropdown + period + stats toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="h-10 rounded-xl border-[#d8d7cf] bg-[#f8f7f3]">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-[#78766d]" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle udgifter</SelectItem>
                <SelectItem value="pending">Afventer</SelectItem>
                <SelectItem value="paid">Betalt</SelectItem>
                <SelectItem value="disputed">Anfægtet</SelectItem>
                <SelectItem value="recurring">Faste</SelectItem>
                <SelectItem value="unexpected">Uventet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant={showStats ? 'default' : 'outline'}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl border-[#d8d7cf]"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeriodYear(y => y - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8d7cf] bg-[#f8f7f3] text-[#5f5d56] hover:bg-[#efeee9]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => { setPeriodMonth(null); }}
            className={cn(
              'h-8 rounded-lg border px-3 text-sm font-semibold transition-colors',
              periodMonth === null
                ? 'border-[#f3c59d] bg-[#fff2e6] text-[#b96424]'
                : 'border-[#d8d7cf] bg-[#f8f7f3] text-[#4a4945] hover:bg-[#efeee9]'
            )}
          >
            {periodYear}
          </button>
          <div className="flex flex-1 gap-1 overflow-x-auto scrollbar-hide">
            {danishMonths.map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => setPeriodMonth(periodMonth === i ? null : i)}
                className={cn(
                  'shrink-0 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                  periodMonth === i
                    ? 'bg-[#f58a2d] text-white'
                    : 'text-[#78766d] hover:bg-[#ecebe5]'
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPeriodYear(y => y + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8d7cf] bg-[#f8f7f3] text-[#5f5d56] hover:bg-[#efeee9]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Period summary */}
        <div className="flex items-center justify-between rounded-xl border border-[#e8e7e0] bg-white px-4 py-2.5">
          <span className="text-sm text-[#78766d]">
            {periodMonth !== null ? `${danishMonthsFull[periodMonth]} ${periodYear}` : `Hele ${periodYear}`}
          </span>
          <span className="text-sm font-semibold text-[#2f2f2d]">
            {formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
          </span>
        </div>
      </motion.div>

      {/* Stats view */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {expenses.length === 0 ? (
            <div className="py-10 text-center text-[#75736b]">
              <Receipt className="mx-auto mb-3 h-10 w-10 text-[#c5c3bb]" />
              Ingen udgifter at vise statistik for
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-[#e8e7e0] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="mb-3 text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">Månedlig udgift (6 mdr.)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthlyStats} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#78766d' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#78766d' }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '' : `${v}`} />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(0)} kr`, 'Total']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e8e7e0', fontSize: 12 }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {monthlyStats.map((_, i) => (
                        <Cell key={i} fill={i === monthlyStats.length - 1 ? '#f58a2d' : '#d0cec5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-[#e8e7e0] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="mb-3 text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">Udgifter pr. kategori</p>
                {categoryStats.length === 0 ? (
                  <p className="text-sm text-[#78766d]">Ingen kategoriserede udgifter</p>
                ) : (
                  <div className="space-y-2.5">
                    {categoryStats.map(cat => {
                      const max = categoryStats[0].total;
                      const pct = max > 0 ? (cat.total / max) * 100 : 0;
                      return (
                        <div key={cat.name}>
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="font-medium text-[#3f3e3a]">{cat.name}</span>
                            <span className="font-semibold text-[#2f2f2d]">{cat.total.toFixed(0)} kr</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#ecebe5]">
                            <div className="h-full rounded-full bg-[#f58a2d] transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#e8e7e0] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="mb-3 text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">Betalt pr. forælder</p>
                <div className="space-y-2">
                  {parentUsers.map(u => {
                    const paid = expenses.filter(e => e.paidBy === u.id).reduce((s, e) => s + e.amount, 0);
                    const total = expenses.reduce((s, e) => s + e.amount, 0);
                    const pct = total > 0 ? (paid / total) * 100 : 0;
                    return (
                      <div key={u.id}>
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-medium text-[#3f3e3a]">{u.name}</span>
                          <span className="font-semibold text-[#2f2f2d]">{paid.toFixed(0)} kr ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#ecebe5]">
                          <div className="h-full rounded-full bg-[#2f2f2f] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Expense list */}
      {!showStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <AnimatePresence>
            {filteredExpenses.length === 0 ? (
              <div className="py-8 text-center text-[#75736b]">
                <Receipt className="mx-auto mb-3 h-11 w-11 text-[#c5c3bb]" />
                Ingen udgifter i denne periode
              </div>
            ) : (
              filteredExpenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((expense, index) => {
                  const category = expenseCategories.find((item) => item.value === expense.category);
                  const paidByUser = users.find((user) => user.id === expense.paidBy);
                  const isApproved = expense.approvedBy?.includes(currentUser?.id || '');
                  const needsApproval =
                    expense.status === 'pending' && expense.paidBy !== currentUser?.id && !isApproved;

                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card
                        className={cn(
                          'border-[#d8d7cf] cursor-pointer transition-colors hover:border-[#c5c3bb]',
                          expense.status === 'disputed' && 'border-[#e6b894] bg-[#fff6ef]'
                        )}
                        onClick={() => setDetailExpenseId(expense.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', category?.color || 'bg-[#eceae2] text-[#4f4b43]')}>
                              {category ? <category.icon className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate font-semibold text-[#2f2f2d]">{expense.title}</p>
                                <p className="shrink-0 font-semibold text-[#2f2f2d]">{formatCurrency(expense.amount)}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#78766d]">
                                <span>{formatDate(expense.date)}</span>
                                <span>·</span>
                                <span>{paidByUser?.name}</span>
                                {expense.isRecurring && (
                                  <>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5 text-[#b96424]"><Repeat2 className="h-3 w-3" /> Fast</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {needsApproval && (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff2e6]">
                                <AlertCircle className="h-3.5 w-3.5 text-[#f58a2d]" />
                              </div>
                            )}
                            {expense.status === 'disputed' && (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff2e6]">
                                <TriangleAlert className="h-3.5 w-3.5 text-[#b96424]" />
                              </div>
                            )}
                            {expense.status === 'paid' && (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eceae2]">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#4f4b43]" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {transferHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-[#d8d7cf]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Seneste betalinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {transferHistory.slice(0, 5).map((transfer) => {
                const fromUser = users.find((user) => user.id === transfer.fromUserId);
                const toUser = users.find((user) => user.id === transfer.toUserId);

                return (
                  <div key={transfer.id} className="rounded-xl border border-[#e0ded7] bg-[#faf9f6] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[#2f2f2d]">
                        {fromUser?.name} → {toUser?.name}
                      </p>
                      <Badge variant="outline">{formatCurrency(transfer.amount)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#75736b]">
                      {transfer.status === 'requested' && 'Anmodet'}
                      {transfer.status === 'sent' && 'Sendt'}
                      {transfer.status === 'completed' && 'Gennemført'}
                      {transfer.status === 'declined' && 'Afvist'}
                      {' · '}
                      {formatDate(transfer.createdAt)}
                    </p>
                    {transfer.note && <p className="mt-0.5 text-xs text-[#75736b]">{transfer.note}</p>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Export buttons — bottom of page */}
      {filteredExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex gap-3 pb-2"
        >
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-2xl border-[#d8d7cf] bg-[#f8f7f3] text-sm font-medium text-[#4a4945] hover:bg-[#efeee9]"
            onClick={() => exportExpensesCSV(filteredExpenses, users)}
          >
            <Download className="mr-2 h-4 w-4" />
            Eksporter CSV
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-2xl border-[#d8d7cf] bg-[#f8f7f3] text-sm font-medium text-[#4a4945] hover:bg-[#efeee9]"
            onClick={() => printExpenses(filteredExpenses, users)}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print / PDF
          </Button>
        </motion.div>
      )}

      {/* Expense detail Sheet */}
      <Sheet open={!!detailExpense} onOpenChange={(open) => { if (!open) setDetailExpenseId(null); }}>
        <SheetContent side="bottom" className="rounded-t-[28px] bg-[#faf9f6] max-h-[85vh] overflow-y-auto">
          {detailExpense && (() => {
            const cat = expenseCategories.find(c => c.value === detailExpense.category);
            const paidBy = users.find(u => u.id === detailExpense.paidBy);
            const isApproved = detailExpense.approvedBy?.includes(currentUser?.id || '');
            const needsApproval = detailExpense.status === 'pending' && detailExpense.paidBy !== currentUser?.id && !isApproved;
            const linkedTransfer = detailExpense.linkedTransferId ? transfers.find(t => t.id === detailExpense.linkedTransferId) : null;

            return (
              <>
                <SheetHeader className="pb-2">
                  <SheetTitle className="text-left text-lg font-bold text-[#2f2f2d]">{detailExpense.title}</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 px-4 pb-8">
                  {/* Amount + category header */}
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', cat?.color || 'bg-[#eceae2] text-[#4f4b43]')}>
                      {cat ? <cat.icon className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-[#2f2f2d]">{formatCurrency(detailExpense.amount)}</p>
                      <div className="flex items-center gap-2 text-sm text-[#78766d]">
                        <span>{cat?.label || detailExpense.category}</span>
                        <span>·</span>
                        <span>{formatDate(detailExpense.date)}</span>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'shrink-0',
                        detailExpense.status === 'pending' && 'bg-[#fff2e6] text-[#b96424]',
                        detailExpense.status === 'paid' && 'bg-[#eceae2] text-[#4f4b43]',
                        detailExpense.status === 'disputed' && 'bg-[#fff2e6] text-[#b55f22]'
                      )}
                    >
                      {detailExpense.status === 'pending' ? 'Afventer' : detailExpense.status === 'paid' ? 'Godkendt' : 'Anfægtet'}
                    </Badge>
                  </div>

                  {detailExpense.description && (
                    <p className="text-sm text-[#5f5d56]">{detailExpense.description}</p>
                  )}

                  {/* Payment info */}
                  <div className="rounded-2xl border border-[#e8e7e0] bg-white p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9b9a93]">Betalingsdetaljer</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#78766d]">Betalt af</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={paidBy?.avatar} />
                          <AvatarFallback className="text-[10px]">{paidBy?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-[#2f2f2d]">{paidBy?.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#78766d]">Fordelingstype</span>
                      <span className="text-sm font-medium text-[#2f2f2d]">
                        {detailExpense.splitType === 'equal' ? 'Lige fordeling' : detailExpense.splitType === 'percentage' ? 'Procentvis' : 'Fast beløb'}
                      </span>
                    </div>
                    {detailExpense.isRecurring && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#78766d]">Gentagelse</span>
                        <span className="text-sm font-medium text-[#2f2f2d]">
                          {detailExpense.recurringInterval === 'weekly' ? 'Ugentlig' : detailExpense.recurringInterval === 'monthly' ? 'Månedlig' : 'Årlig'}
                        </span>
                      </div>
                    )}
                    {detailExpense.isRecurring && detailExpense.nextDueDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#78766d]">Næste betaling</span>
                        <span className="text-sm font-medium text-[#2f2f2d]">{formatDate(detailExpense.nextDueDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Split breakdown */}
                  <div className="rounded-2xl border border-[#e8e7e0] bg-white p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9b9a93]">Fordeling</p>
                    {Object.entries(detailExpense.splitAmounts).map(([userId, amount]) => {
                      const user = users.find(u => u.id === userId);
                      const pct = detailExpense.amount > 0 ? ((amount / detailExpense.amount) * 100).toFixed(0) : '0';
                      return (
                        <div key={userId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback className="text-[10px]">{user?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-[#2f2f2d]">{user?.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-[#2f2f2d]">{formatCurrency(amount)}</span>
                            <span className="ml-1.5 text-xs text-[#9b9a93]">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Linked transfer info */}
                  {linkedTransfer && (
                    <div className="rounded-2xl border border-[#e8e7e0] bg-white p-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9b9a93]">Betalingsstatus</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#78766d]">Status</span>
                        <Badge variant="outline">
                          {linkedTransfer.status === 'requested' ? 'Anmodet' : linkedTransfer.status === 'sent' ? 'Sendt' : linkedTransfer.status === 'completed' ? 'Gennemført' : 'Afvist'}
                        </Badge>
                      </div>
                      {linkedTransfer.completedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#78766d]">Betalt</span>
                          <span className="text-sm font-medium text-[#2f2f2d]">{formatDate(linkedTransfer.completedAt)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {detailExpense.receiptUrl && (
                    <a
                      href={detailExpense.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-[#e8e7e0] bg-white p-3 text-center text-sm font-medium text-[#b96424]"
                    >
                      Åbn kvittering
                    </a>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {needsApproval && (
                      <>
                        <Button className="flex-1" onClick={() => { handleApprove(detailExpense.id); setDetailExpenseId(null); }}>
                          <Check className="mr-1.5 h-4 w-4" /> Godkend
                        </Button>
                        <Button variant="outline" className="flex-1 text-[#b55f22]" onClick={() => { handleDispute(detailExpense.id); setDetailExpenseId(null); }}>
                          <X className="mr-1.5 h-4 w-4" /> Anfægt
                        </Button>
                      </>
                    )}
                    {canUsePayments && detailExpense.status === 'pending' && detailExpense.paidBy === currentUser?.id && (
                      <Button variant="outline" className="w-full" onClick={() => { requestPaymentForExpense(detailExpense); setDetailExpenseId(null); }}>
                        <CreditCard className="mr-1.5 h-4 w-4" /> Anmod betaling
                      </Button>
                    )}
                    {detailExpense.status === 'disputed' && (
                      <Button variant="outline" className="w-full" onClick={() => { handleResolve(detailExpense.id); setDetailExpenseId(null); }}>
                        <CheckCircle2 className="mr-1.5 h-4 w-4" /> Foreslå løsning
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Dispute reason dialog */}
      <Dialog open={disputeDialogExpenseId !== null} onOpenChange={(open) => { if (!open) setDisputeDialogExpenseId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anfægt udgift</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-[#75736b]">Beskriv hvorfor du anfægter denne udgift. Den anden forælder vil se din begrundelse.</p>
            <div className="space-y-1.5">
              <Label htmlFor="dispute-reason">Begrundelse</Label>
              <Textarea
                id="dispute-reason"
                value={disputeReasonInput}
                onChange={(e) => setDisputeReasonInput(e.target.value)}
                placeholder="Fx: Beløbet stemmer ikke overens med aftalen…"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDisputeDialogExpenseId(null)}>
                Annuller
              </Button>
              <Button className="flex-1 bg-[#b55f22] hover:bg-[#9a5120]" onClick={submitDispute}>
                Anfægt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve dispute dialog */}
      <Dialog open={resolveDialogExpenseId !== null} onOpenChange={(open) => { if (!open) setResolveDialogExpenseId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Løs tvist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-[#75736b]">Beskriv hvordan tvisten løses. Udgiften vil blive markeret som godkendt.</p>
            <div className="space-y-1.5">
              <Label htmlFor="resolve-note">Løsning</Label>
              <Textarea
                id="resolve-note"
                value={resolveNoteInput}
                onChange={(e) => setResolveNoteInput(e.target.value)}
                placeholder="Fx: Vi er enige om at dele beløbet 60/40…"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setResolveDialogExpenseId(null)}>
                Annuller
              </Button>
              <Button className="flex-1" onClick={submitResolve}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Godkend løsning
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
