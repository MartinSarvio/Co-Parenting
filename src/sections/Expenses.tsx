import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
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
import { SelectSheet } from '@/components/custom/SelectSheet';
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
  BarChart3,
  Gift,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Expense, MoneyTransfer } from '@/types';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { ExpensesSidePanel } from '@/components/custom/ExpensesSidePanel';
import { AnalyseView } from '@/sections/AnalyseView';
import { searchProducts } from '@/lib/openFoodFacts';
import { ProductCard, type ProductCardData } from '@/components/custom/ProductCard';

const expenseCategories = [
  { value: 'institution', label: 'Institution', icon: Building2, color: 'bg-secondary text-foreground' },
  { value: 'medical', label: 'Medicin/Sundhed', icon: Pill, color: 'bg-orange-tint text-[#f58a2d] dark:text-[#f5a55d]' },
  { value: 'clothing', label: 'Tøj', icon: Shirt, color: 'bg-card text-muted-foreground' },
  { value: 'activities', label: 'Aktiviteter', icon: GraduationCap, color: 'bg-orange-tint text-[#c66f23]' },
  { value: 'school', label: 'Skole', icon: GraduationCap, color: 'bg-secondary text-foreground' },
  { value: 'food', label: 'Mad', icon: UtensilsCrossed, color: 'bg-orange-tint text-[#c66f23]' },
  { value: 'transport', label: 'Transport', icon: Bus, color: 'bg-card text-muted-foreground' },
  { value: 'other', label: 'Andet', icon: MoreHorizontal, color: 'bg-secondary text-foreground' },
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
    disputeExpense,
    resolveExpenseDispute,
    addTransfer,
    updateTransfer,
    addDocument,
    setActiveTab: setAppTab,
    activeTab,
    budgetGoals,
    wishItems,
  } = useAppStore();
  const { createExpense, updateExpense, approveExpense, saveBudgetGoals, createWishItem, updateWishItem, deleteWishItem } = useApiActions();

  const features = getPlanFeatures(household, currentUser?.isAdmin);
  const canUseExpenses = features.expenses;
  const canUsePayments = features.inAppPayments;
  const canUseRecurring = features.recurringExpenses;
  const shouldAutoArchiveReceipts = Boolean(
    household?.singleParentSupport?.autoArchiveReceipts && features.singleParentEvidence
  );

  const { expenseFilter, wishPersonFilter, wishCoverImage, wishCoverImageOpen, setWishCoverImage, setWishCoverImageOpen, budgetPeriod, showBudgetEdit, setShowBudgetEdit, showWishForm, setShowWishForm } = useAppStore();
  const [showStats, setShowStats] = useState(false);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState<number | null>(null); // null = all months
  const [detailExpenseId, setDetailExpenseId] = useState<string | null>(null);
  const showAddExpenseForm = useAppStore(s => s.showExpenseForm);
  const setShowAddExpenseForm = useAppStore(s => s.setShowExpenseForm);
  const showAddWishForm = showWishForm;
  const setShowAddWishForm = setShowWishForm;
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
  const parentUsers = useMemo(() => users.filter((user) => user.role === 'parent'), [users]);

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
    if (expenseFilter === 'all') return true;
    if (expenseFilter === 'pending') return expense.status === 'pending';
    if (expenseFilter === 'paid') return expense.status === 'paid';
    if (expenseFilter === 'disputed') return expense.status === 'disputed';
    if (expenseFilter === 'recurring') return Boolean(expense.isRecurring);
    if (expenseFilter === 'unexpected') return Boolean(expense.isUnexpected);
    return expense.category === expenseFilter;
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

  const handleAddExpense = async () => {
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
    setIsSaving(true);
    try {

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

    const created = await createExpense(expense);
    if (created) archiveReceiptAsEvidence(created);

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
      void updateExpense(expenseId, { linkedTransferId: transferId });
    }

    toast.success('Udgift tilføjet');
    setShowAddExpenseForm(false);
    setNewExpense(getDefaultExpenseState());
    setSplitMode('equal');
    setCustomShares({});
    } catch {
      toast.error('Kunne ikke tilføje udgift');
    } finally {
      setIsSaving(false);
    }
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

    void updateExpense(expense.id, { linkedTransferId: transferId });
    toast.success(`Betalingsanmodning sendt til ${debtor.name}`);
  };

  const handleCreateTransfer = async () => {
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

    setIsSaving(true);
    try {
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
      toast.success(transferMode === 'request' ? 'Betalingsanmodning sendt' : 'Betaling markeret som sendt');
      setTransferDraft({ peerUserId: '', amount: '', note: '' });
      setIsTransferOpen(false);
    } catch {
      toast.error('Kunne ikke oprette overførsel');
    } finally {
      setIsSaving(false);
    }
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
    void approveExpense(expenseId, currentUser.id);
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

  const meUser = currentUser;
  const otherUser = users.find(u => u.id !== currentUser?.id && u.role === 'parent');
  const totalBalance = Object.values(balance).reduce((sum, b) => sum + Math.abs(b), 0) / 2;

  // Budget state
  const [budgetEditCategory, setBudgetEditCategory] = useState<string | null>(null);
  const [budgetEditAmount, setBudgetEditAmount] = useState('');
  // budgetPeriod is now from store

  // Wish list state
  const [wishChildFilter, setWishChildFilter] = useState<string>('all');
  const [newWish, setNewWish] = useState({ title: '', priceEstimate: '', link: '', childId: '', description: '' });
  const wishImageInputRef = useRef<HTMLInputElement>(null);
  const wishCoverInputRef = useRef<HTMLInputElement>(null);
  const [wishImagePreview, setWishImagePreview] = useState<string | null>(null);
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [wishProductQuery, setWishProductQuery] = useState('');
  const [wishProductResults, setWishProductResults] = useState<ProductCardData[]>([]);
  const [isWishSearching, setIsWishSearching] = useState(false);

  const handleWishCoverChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setWishCoverImage(reader.result as string);
    reader.readAsDataURL(file);
  }, [setWishCoverImage]);

  // Open cover image file picker when triggered from TopBar
  useEffect(() => {
    if (wishCoverImageOpen) {
      wishCoverInputRef.current?.click();
      setWishCoverImageOpen(false);
    }
  }, [wishCoverImageOpen, setWishCoverImageOpen]);

  // Debounced product search for wishlist
  useEffect(() => {
    if (!wishProductQuery.trim()) {
      setWishProductResults([]);
      return;
    }
    setIsWishSearching(true);
    const timer = setTimeout(async () => {
      const { products } = await searchProducts(wishProductQuery, 1, 12);
      setWishProductResults(
        products.map((p, i) => ({
          id: p.barcode || `off-${i}-${Date.now()}`,
          name: p.name,
          brand: p.brand,
          imageUrl: p.imageUrl,
          quantity: p.quantity,
          category: p.categories?.split(',')[0]?.trim(),
          barcode: p.barcode,
          nutriscoreGrade: p.nutriscoreGrade,
        }))
      );
      setIsWishSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [wishProductQuery]);

  const handleWishImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setWishImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const fetchLinkPreview = useCallback(async (url: string) => {
    if (!url.startsWith('http')) return;
    setIsLinkLoading(true);
    try {
      const res = await fetch(url);
      const html = await res.text();

      const getMetaContent = (property: string) => {
        const match = html.match(new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
          || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i'));
        return match?.[1] || '';
      };

      // Rens titel — fjern hashtags, site-navne, "Køb online" suffixer, HTML entities
      const cleanTitle = (raw: string): string => {
        return raw
          .replace(/#\w+/g, '')
          .replace(/\|.*$/g, '')
          .replace(/\s*[-–—]\s*(?:Køb|Shop|Buy|Bestil).*$/i, '')
          .replace(/&amp;/g, '&')
          .replace(/&#x27;/g, "'")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ')
          .trim();
      };

      // Rens beskrivelse
      const cleanDescription = (raw: string): string => {
        return raw
          .replace(/&amp;/g, '&')
          .replace(/&#x27;/g, "'")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 200);
      };

      // Hent pris fra flere kilder
      const extractPrice = (): string => {
        const metaPrice = getMetaContent('product:price:amount')
          || getMetaContent('og:price:amount')
          || getMetaContent('product:price');
        if (metaPrice) return metaPrice;

        // Søg i JSON-LD structured data
        const jsonLdMatch = html.match(/"price"\s*:\s*"?(\d+[\.,]?\d*)/);
        if (jsonLdMatch) return jsonLdMatch[1].replace(',', '.');

        // Søg i HTML pris-elementer
        const priceMatch = html.match(/class="[^"]*price[^"]*"[^>]*>[^<]*?(\d{1,6}[\.,]\d{2})/i);
        if (priceMatch) return priceMatch[1].replace(',', '.');

        return '';
      };

      const rawTitle = getMetaContent('og:title') || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '';
      const rawDescription = getMetaContent('og:description') || getMetaContent('description');
      const image = getMetaContent('og:image');
      const priceStr = extractPrice();

      setNewWish(prev => ({
        ...prev,
        title: prev.title || cleanTitle(rawTitle),
        description: cleanDescription(rawDescription) || prev.description,
        priceEstimate: priceStr || prev.priceEstimate,
      }));
      if (image) setWishImagePreview(image);
    } catch {
      // Silently fail — user can fill in manually
    } finally {
      setIsLinkLoading(false);
    }
  }, []);

  if (!canUseExpenses) {
    return (
      <div className="space-y-1.5 py-1">
        <ExpensesSidePanel />
        <Card className="border-orange-tint bg-orange-tint">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-[8px] bg-[#f58a2d] p-2 text-white">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Udgifter er en abonnementsfunktion</p>
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

  // ─── Balance page ───
  if (activeTab === 'balance') {
    const meBalance = meUser ? (balance[meUser.id] || 0) : 0;
    const otherBalance = otherUser ? (balance[otherUser.id] || 0) : 0;

    return (
      <div className="relative">
        <ExpensesSidePanel />
        {/* Orange background extending behind header/status bar */}
        <div
          className="absolute inset-x-0 rounded-b-3xl bg-[#f58a2d] -mx-3 sm:-mx-4"
          style={{
            top: 'calc(-1 * (env(safe-area-inset-top, 0px) + 74px))',
            height: otherUser
              ? 'calc(env(safe-area-inset-top, 0px) + 74px + 360px)'
              : 'calc(env(safe-area-inset-top, 0px) + 74px + 260px)',
          }}
        />

        {/* Content — relative z to sit above the orange backdrop */}
        <div className="relative z-[1]">
          {/* Balance hero */}
          <div className="text-center pt-2 pb-6">
            <p className="text-sm font-medium text-white/80">Samlet balance</p>
            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalBalance)}</p>
          </div>

          {/* Parent rows — overlap bottom of orange */}
          <div className="space-y-2">
            <div className="rounded-[8px] border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={meUser?.avatar} />
                    <AvatarFallback>{meUser?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{meUser?.name}</p>
                    <p className="text-[11px] text-muted-foreground">Dig</p>
                  </div>
                </div>
                <span className={cn('text-lg font-bold', meBalance > 0 ? 'text-green-600' : meBalance < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                  {meBalance > 0 ? '+' : ''}{formatCurrency(meBalance)}
                </span>
              </div>
            </div>
            {otherUser && (
              <div className="rounded-[8px] border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className={cn('text-lg font-bold', otherBalance > 0 ? 'text-green-600' : otherBalance < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                    {otherBalance > 0 ? '+' : ''}{formatCurrency(otherBalance)}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{otherUser.name}</p>
                      <p className="text-[11px] text-muted-foreground">Medforælder</p>
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={otherUser.avatar} />
                      <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent payments */}
          {transferHistory.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[0.95rem] font-semibold text-foreground">Seneste betalinger</p>
              {transferHistory.slice(0, 8).map((transfer) => {
                const from = users.find(u => u.id === transfer.fromUserId);
                const to = users.find(u => u.id === transfer.toUserId);
                return (
                  <div key={transfer.id} className="flex items-center justify-between rounded-[8px] border border-border bg-card px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{from?.name} → {to?.name}</p>
                      {transfer.note && <p className="text-xs text-muted-foreground truncate">{transfer.note}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(transfer.amount)}</p>
                      <Badge variant="outline" className="text-[10px]">{transfer.status === 'completed' ? 'Betalt' : transfer.status === 'requested' ? 'Anmodet' : transfer.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Send/modtag penge page ───
  if (activeTab === 'send-penge') {
    return (
      <div className="relative">
        <ExpensesSidePanel />
        {/* Green background extending behind header/status bar */}
        <div
          className="absolute inset-x-0 rounded-b-3xl bg-[#43a047] -mx-3 sm:-mx-4"
          style={{
            top: 'calc(-1 * (env(safe-area-inset-top, 0px) + 74px))',
            height: 'calc(env(safe-area-inset-top, 0px) + 74px + 180px)',
          }}
        />

        <div className="relative z-[1] space-y-3">
          <div className="text-center pt-2 pb-6">
            <p className="text-sm font-medium text-white/80">Betalinger</p>
            <h1 className="text-2xl font-bold text-white mt-1">Send / modtag penge</h1>
            <p className="text-sm text-white/70 mt-1">Opret betalinger og anmodninger</p>
          </div>

          <Card className="border-border bg-card">
          <CardContent className="space-y-2 pt-4">
            {!canUsePayments && (
              <p className="rounded-[8px] border border-orange-tint bg-orange-tint px-3 py-2 text-sm text-[#a7632c]">
                Denne funktion kræver Family Plus eller Enlig Plus.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
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
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={transferMode === 'request' ? 'default' : 'outline'} onClick={() => setTransferMode('request')}>Anmod</Button>
                    <Button type="button" variant={transferMode === 'send' ? 'default' : 'outline'} onClick={() => setTransferMode('send')}>Send</Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Modpart</Label>
                    <SelectSheet
                      value={transferDraft.peerUserId}
                      onValueChange={(value) => setTransferDraft((prev) => ({ ...prev, peerUserId: value }))}
                      title="Modpart"
                      placeholder="Vælg forælder"
                      options={partnerUsers.map((user) => ({ value: user.id, label: user.name }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Beløb (DKK)</Label>
                    <Input type="number" value={transferDraft.amount} onChange={(event) => setTransferDraft((prev) => ({ ...prev, amount: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Note</Label>
                    <Textarea rows={2} value={transferDraft.note} onChange={(event) => setTransferDraft((prev) => ({ ...prev, note: event.target.value }))} placeholder="Fx andel af institution" />
                  </div>
                  <Button type="button" className="w-full flex items-center justify-center gap-2" disabled={isSaving} onClick={handleCreateTransfer}>
                    {transferMode === 'request' ? 'Send anmodning' : 'Registrer sendt betaling'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {incomingRequests.length > 0 && (
              <div className="space-y-2">
                {incomingRequests.map((transfer) => {
                  const sender = users.find((user) => user.id === transfer.fromUserId);
                  return (
                    <div key={transfer.id} className="rounded-[8px] border border-border bg-card p-3">
                      <p className="text-sm font-medium text-foreground">{sender?.name || 'Ukendt'} anmoder om {formatCurrency(transfer.amount)}</p>
                      <p className="text-xs text-muted-foreground">{transfer.note || 'Ingen note'}</p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => respondToTransfer(transfer.id, 'declined')}>Afvis</Button>
                        <Button size="sm" onClick={() => respondToTransfer(transfer.id, 'completed')}>Bekræft betalt</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All transfers */}
        {transferHistory.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Betalingshistorik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {transferHistory.map((transfer) => {
                const from = users.find(u => u.id === transfer.fromUserId);
                const to = users.find(u => u.id === transfer.toUserId);
                return (
                  <div key={transfer.id} className="flex items-center justify-between rounded-[8px] border border-border bg-card px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{from?.name} → {to?.name}</p>
                      {transfer.note && <p className="text-xs text-muted-foreground truncate">{transfer.note}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(transfer.amount)}</p>
                      <Badge variant="outline" className="text-[10px]">{transfer.status === 'completed' ? 'Betalt' : transfer.status === 'requested' ? 'Anmodet' : transfer.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    );
  }

  // ─── Budget page ───
  if (activeTab === 'budget' && showBudgetEdit && budgetEditCategory) {
    const catLabel = expenseCategories.find(c => c.value === budgetEditCategory)?.label ?? budgetEditCategory;
    return (
      <div className="relative">
        <ExpensesSidePanel />
        <div className="pt-4 space-y-4">
          <div className="space-y-2 rounded-2xl bg-card p-4 border border-border">
            <p className="text-sm font-medium text-muted-foreground">Kategori: {catLabel}</p>
            <div className="space-y-2">
              <Label>Månedligt beløb (DKK)</Label>
              <Input type="number" value={budgetEditAmount} onChange={(e) => setBudgetEditAmount(e.target.value)} placeholder="0" />
            </div>
            <Button className="w-full mt-2" onClick={() => {
              const amount = Number(budgetEditAmount) || 0;
              const existing = budgetGoals.find(g => g.category === budgetEditCategory);
              const updatedGoals = existing
                ? budgetGoals.map(g => g.category === budgetEditCategory ? { ...g, monthlyAmount: amount } : g)
                : [...budgetGoals, { category: budgetEditCategory!, monthlyAmount: amount }];
              saveBudgetGoals(updatedGoals);
              setShowBudgetEdit(false);
              setBudgetEditCategory(null);
              toast.success('Budget opdateret');
            }}>
              Gem budget
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'budget') {
    const multiplier = budgetPeriod === 'yearly' ? 12 : 1;
    const totalBudget = budgetGoals.reduce((sum, g) => sum + g.monthlyAmount, 0) * multiplier;
    const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const totalSpent = budgetPeriod === 'monthly'
      ? expenses.filter(e => e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.amount, 0)
      : expenses.filter(e => e.date.startsWith(String(new Date().getFullYear()))).reduce((sum, e) => sum + e.amount, 0);

    return (
      <div className="relative">
        <ExpensesSidePanel />
        {/* White background extending behind header/status bar */}
        <div
          className="absolute inset-x-0 rounded-b-3xl bg-card border-b border-border -mx-3 sm:-mx-4"
          style={{
            top: 'calc(-1 * (env(safe-area-inset-top, 0px) + 74px))',
            height: 'calc(env(safe-area-inset-top, 0px) + 74px + 180px)',
          }}
        />

        <div className="relative z-[1] space-y-3">
          <div className="text-center pt-1 pb-4">
            <h1 className="text-2xl font-bold text-foreground mt-1">Budget</h1>
            <p className="text-sm text-muted-foreground mt-1">{budgetPeriod === 'monthly' ? 'Månedligt overblik' : 'Årligt overblik'}</p>
          </div>

        {/* Summary */}
        <Card className="border-border bg-card">
          <CardContent className="pt-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget total</span>
              <span className="font-semibold text-foreground">{formatCurrency(totalBudget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Brugt</span>
              <span className="font-semibold text-foreground">{formatCurrency(totalSpent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Resterende</span>
              <span className={cn('font-semibold', totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-500')}>
                {formatCurrency(totalBudget - totalSpent)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Per-category cards */}
        <div className="space-y-2">
          {expenseCategories.map(cat => {
            const CatIcon = cat.icon;
            const goal = budgetGoals.find(g => g.category === cat.value);
            const budgetAmount = (goal?.monthlyAmount || 0) * multiplier;
            const spent = budgetPeriod === 'monthly'
              ? expenses.filter(e => e.category === cat.value && e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.amount, 0)
              : expenses.filter(e => e.category === cat.value && e.date.startsWith(String(new Date().getFullYear()))).reduce((sum, e) => sum + e.amount, 0);
            const progress = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;

            return (
              <div key={cat.value} className="rounded-[8px] border border-border bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', cat.color)}>
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                  </div>
                  <button
                    onClick={() => { setBudgetEditCategory(cat.value); setBudgetEditAmount(String(goal?.monthlyAmount || 0)); setShowBudgetEdit(true); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {budgetAmount > 0 ? formatCurrency(budgetAmount) : 'Sæt budget'}
                  </button>
                </div>
                {budgetAmount > 0 && (
                  <>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', progress >= 90 ? 'bg-red-400' : progress >= 70 ? 'bg-yellow-400' : 'bg-green-400')}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[11px] text-muted-foreground">
                      <span>Brugt: {formatCurrency(spent)}</span>
                      <span>Rest: {formatCurrency(Math.max(budgetAmount - spent, 0))}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Budget edit is now a full-page form */}
        </div>
      </div>
    );
  }

  // ─── Full-page: Add wish form ───
  if (activeTab === 'gaveoenskeliste' && showAddWishForm) {
    return (
      <div className="relative">
        <ExpensesSidePanel />
        <input
          ref={wishImageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleWishImageChange}
        />
        <div
          className="absolute inset-x-0 rounded-b-3xl -mx-3 sm:-mx-4 bg-cover bg-center"
          style={{
            top: 'calc(-1 * (env(safe-area-inset-top, 0px) + 74px))',
            height: 'calc(env(safe-area-inset-top, 0px) + 74px + 40px)',
            backgroundColor: wishImagePreview ? undefined : '#1e88e5',
            backgroundImage: wishImagePreview ? `url(${wishImagePreview})` : undefined,
          }}
        />
        <div className="relative z-[1] pt-4">
          <div className="space-y-3 rounded-2xl bg-card p-4 border border-border">
            <div className="space-y-2">
              <Label>Link (valgfrit)</Label>
              <Input
                value={newWish.link}
                onChange={(e) => setNewWish(prev => ({ ...prev, link: e.target.value }))}
                onBlur={(e) => fetchLinkPreview(e.target.value)}
                placeholder="https://..."
              />
              {isLinkLoading && <p className="text-xs text-muted-foreground">Henter produktinfo...</p>}
            </div>
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input value={newWish.title} onChange={(e) => setNewWish(prev => ({ ...prev, title: e.target.value }))} placeholder="Fx LEGO sæt" />
            </div>
            <div className="space-y-2">
              <Label>Beskrivelse (valgfrit)</Label>
              <Input value={newWish.description} onChange={(e) => setNewWish(prev => ({ ...prev, description: e.target.value }))} placeholder="Kort beskrivelse" />
            </div>
            <div className="space-y-2">
              <Label>Pris (valgfrit)</Label>
              <Input type="number" value={newWish.priceEstimate} onChange={(e) => setNewWish(prev => ({ ...prev, priceEstimate: e.target.value }))} placeholder="DKK" />
            </div>
            <div className="space-y-2">
              <Label>Barn</Label>
              <SelectSheet
                value={newWish.childId}
                onValueChange={(value) => setNewWish(prev => ({ ...prev, childId: value }))}
                title="Barn"
                placeholder="Vælg barn"
                options={children.map(child => ({ value: child.id, label: child.name }))}
              />
            </div>
            <Button className="w-full flex items-center justify-center gap-2" disabled={isSaving} onClick={async () => {
              if (!newWish.title.trim() || !newWish.childId) {
                toast.error('Tilføj titel og vælg barn');
                return;
              }
              setIsSaving(true);
              try {
                await createWishItem({
                  title: newWish.title.trim(),
                  priceEstimate: newWish.priceEstimate ? Number(newWish.priceEstimate) : undefined,
                  link: newWish.link || undefined,
                  imageUrl: wishImagePreview || undefined,
                  description: newWish.description || undefined,
                  childId: newWish.childId,
                  addedBy: currentUser?.id || '',
                  status: 'wanted',
                });
                toast.success('Ønske tilføjet');
                setNewWish({ title: '', priceEstimate: '', link: '', childId: '', description: '' });
                setWishImagePreview(null);
                setShowAddWishForm(false);
              } catch {
                toast.error('Kunne ikke tilføje ønske');
              } finally {
                setIsSaving(false);
              }
            }}>
              Tilføj ønske
            </Button>
          </div>
        </div>

        <SavingOverlay open={isSaving} />
      </div>
    );
  }

  // ─── Gave/ønskeliste page ───
  if (activeTab === 'gaveoenskeliste') {
    const filteredWishes = wishItems
      .filter(w => wishChildFilter === 'all' || w.childId === wishChildFilter)
      .filter(w => wishPersonFilter === 'all' || w.addedBy === wishPersonFilter);

    return (
      <div className="relative">
        <ExpensesSidePanel />
        {/* Blue background / cover image extending behind header/status bar */}
        <div
          className={cn(
            "absolute inset-x-0 rounded-b-3xl -mx-3 sm:-mx-4 overflow-hidden",
            !wishCoverImage && "bg-[#1e88e5]"
          )}
          style={{
            top: 'calc(-1 * (env(safe-area-inset-top, 0px) + 74px))',
            height: 'calc(env(safe-area-inset-top, 0px) + 74px + 180px)',
          }}
        >
          {wishCoverImage && (
            <img src={wishCoverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
        <input
          ref={wishCoverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleWishCoverChange}
        />

        <div className="relative z-[1] space-y-3">
          <div className="text-center pt-2 pb-6">
            <p className="text-sm font-medium text-white/80">Hold styr på ønsker</p>
            <h1 className="text-2xl font-bold text-white mt-1">Gave / ønskeliste</h1>
          </div>

        {/* Child filter */}
        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              variant={wishChildFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setWishChildFilter('all')}
            >
              Alle
            </Button>
            {children.map(child => (
              <Button
                key={child.id}
                variant={wishChildFilter === child.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWishChildFilter(child.id)}
              >
                {child.name}
              </Button>
            ))}
          </div>
        )}

        {/* Add wish */}
        <Button variant="outline" className="w-full" onClick={() => setShowAddWishForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tilføj ønske
        </Button>

        {/* Product search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={wishProductQuery}
            onChange={e => setWishProductQuery(e.target.value)}
            placeholder="Søg produkt..."
            className="w-full rounded-[8px] border border-border bg-card py-3 pl-9 pr-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-border"
          />
          {wishProductQuery && (
            <button
              onClick={() => { setWishProductQuery(''); setWishProductResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Product search results */}
        {isWishSearching && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3].map(i => (
              <div key={i} className="min-w-[155px] max-w-[155px] shrink-0 rounded-2xl border border-border bg-card overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-2.5 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isWishSearching && wishProductResults.length > 0 && (
          <div className="flex gap-2 overflow-x-auto snap-x pb-2 scrollbar-hide -mx-1 px-1">
            {wishProductResults.map(product => (
              <div key={product.id} className="min-w-[155px] max-w-[155px] snap-start shrink-0">
                <ProductCard
                  product={product}
                  mode="wishlist"
                  childId={wishChildFilter !== 'all' ? wishChildFilter : children[0]?.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* Wish list */}
        {filteredWishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Gift className="mx-auto mb-3 h-11 w-11 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Ingen ønsker endnu</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredWishes.map(wish => {
              const child = children.find(c => c.id === wish.childId);
              const addedByUser = users.find(u => u.id === wish.addedBy);
              return (
                <div key={wish.id} className={cn('rounded-2xl border border-border bg-card overflow-hidden', wish.status === 'bought' && 'opacity-60')}>
                  {wish.imageUrl && (
                    <div className="aspect-[4/3] w-full bg-card">
                      <img src={wish.imageUrl} alt={wish.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className={cn('text-sm font-semibold text-foreground line-clamp-2', wish.status === 'bought' && 'line-through')}>{wish.title}</p>
                    {wish.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{wish.description}</p>}
                    <div className="flex items-center gap-1.5 mt-1">
                      {wish.priceEstimate && <span className="text-sm font-bold text-foreground">{formatCurrency(wish.priceEstimate)}</span>}
                    </div>
                    {child && <Badge variant="outline" className="text-[10px] mt-1">{child.name}</Badge>}
                    {addedByUser && <p className="text-[10px] text-muted-foreground mt-0.5">Tilføjet af {addedByUser.name?.split(' ')[0]}</p>}
                    <div className="flex items-center gap-0.5 mt-2 border-t border-border pt-2">
                      {wish.link && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#1e88e5]" onClick={() => window.open(wish.link, '_blank')}>
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {wish.status === 'wanted' ? (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => updateWishItem(wish.id, { status: 'bought', boughtBy: currentUser?.id })}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Købt</Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 ml-auto" onClick={() => deleteWishItem(wish.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>

        {/* FAB — tilføj ønske */}
        <button
          onClick={() => setShowAddWishForm(true)}
          className="fixed left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#f58a2d] text-white shadow-lg hover:bg-[#e07b1f] transition-colors"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          aria-label="Tilføj ønske"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // ─── Analyse page ───
  if (activeTab === 'analyse') {
    return <AnalyseView />;
  }

  // ─── Full-page: Add expense form ───
  if (showAddExpenseForm) {
    return (
      <div className="relative">
        <ExpensesSidePanel />
        <div
          className="absolute inset-x-0 rounded-b-3xl bg-[#e53935] -mx-3 sm:-mx-4"
          style={{
            top: 'calc(-1 * (env(safe-area-inset-top, 0px) + 74px))',
            height: 'calc(env(safe-area-inset-top, 0px) + 74px + 40px)',
          }}
        />
        <div className="relative z-[1] pt-4">
          <div className="space-y-2 rounded-2xl bg-card p-4 border border-border">
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
                  className="h-11"
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
                      'flex items-center gap-2 rounded-[8px] border p-2.5 text-left transition-colors',
                      newExpense.category === category.value
                        ? 'border-orange-tint bg-orange-tint'
                        : 'border-border bg-card hover:bg-background'
                    )}
                  >
                    <div className={cn('rounded-lg p-1.5', category.color)}>
                      <category.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fordelingsmodel</Label>
              <SelectSheet
                value={splitMode}
                onValueChange={(value) => setSplitMode(value as 'equal' | 'amount' | 'percentage' | 'full_request')}
                title="Fordelingsmodel"
                options={[
                  { value: 'equal', label: 'Lige fordeling' },
                  { value: 'amount', label: 'Beløb pr. person' },
                  { value: 'percentage', label: 'Procent pr. person' },
                  { value: 'full_request', label: 'Anmod én person om hele beløbet' },
                ]}
              />
            </div>

            {splitMode === 'full_request' ? (
              <div className="space-y-2">
                <Label>Hele beløbet anmodes hos</Label>
                <SelectSheet
                  value={splitTargetUserId}
                  onValueChange={setSplitTargetUserId}
                  title="Hele beløbet anmodes hos"
                  placeholder="Vælg forælder"
                  options={parentUsers
                    .filter((user) => user.id !== currentUser?.id)
                    .map((user) => ({ value: user.id, label: user.name }))}
                />
              </div>
            ) : null}

            {(splitMode === 'amount' || splitMode === 'percentage') ? (
              <div className="space-y-2 rounded-[8px] border border-border bg-card p-3">
                {parentUsers.map((user) => (
                  <div key={user.id} className="grid grid-cols-[1fr_120px] items-center gap-2">
                    <p className="text-sm text-foreground">{user.name}</p>
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
                <p className="text-xs text-muted-foreground">
                  {splitMode === 'percentage'
                    ? 'Procenter skal tilsammen være 100.'
                    : 'Beløb skal tilsammen være lig totalbeløbet.'}
                </p>
              </div>
            ) : null}

            {newExpense.category === 'institution' && institutions.length > 0 && (
              <div className="space-y-2">
                <Label>Institution</Label>
                <SelectSheet
                  value={newExpense.institutionId}
                  onValueChange={(value) => setNewExpense((prev) => ({ ...prev, institutionId: value }))}
                  title="Institution"
                  placeholder="Vælg institution"
                  options={institutions.map((institution) => ({ value: institution.id, label: institution.name }))}
                />
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
                <p className="text-xs text-muted-foreground">
                  Kvitteringer bliver automatisk gemt i dokumentation.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-[8px] border border-border bg-card p-4">
              <label className="flex min-h-[44px] items-center gap-3 text-base text-foreground">
                <Checkbox
                  className="h-5 w-5"
                  checked={newExpense.isUnexpected}
                  onCheckedChange={(checked) => setNewExpense((prev) => ({ ...prev, isUnexpected: checked as boolean }))}
                />
                Uventet udgift
              </label>

              <label className="flex min-h-[44px] items-center gap-3 text-base text-foreground">
                <Checkbox
                  className="h-5 w-5"
                  checked={newExpense.isRecurring}
                  onCheckedChange={(checked) => setNewExpense((prev) => ({ ...prev, isRecurring: checked as boolean }))}
                  disabled={!canUseRecurring}
                />
                Fast (gentagende) udgift
              </label>

              {newExpense.isRecurring && canUseRecurring && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <SelectSheet
                    value={newExpense.recurringInterval}
                    onValueChange={(value) => setNewExpense((prev) => ({ ...prev, recurringInterval: value as 'weekly' | 'monthly' | 'yearly' }))}
                    title="Hyppighed"
                    options={recurringIntervals.map((option) => ({ value: option.value, label: option.label }))}
                  />
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
              className="w-full flex items-center justify-center gap-2"
              disabled={!newExpense.title || !newExpense.amount || isSaving}
              onClick={handleAddExpense}
            >
              Gem udgift
            </Button>
          </div>
        </div>

        <SavingOverlay open={isSaving} />
      </div>
    );
  }

  // ─── Default: Expenses list page ───
  return (
    <div className="relative">
      <ExpensesSidePanel />
      {/* Red background extending behind header/status bar */}
      <div
        className="absolute inset-x-0 rounded-b-3xl bg-[#e53935] -mx-3 sm:-mx-4"
        style={{
          top: 'calc(-1 * (env(safe-area-inset-top, 0px) + 74px))',
          height: 'calc(env(safe-area-inset-top, 0px) + 74px + 180px)',
        }}
      />

      <div className="relative z-[1] space-y-1.5" style={{ minHeight: '180px', paddingBottom: '2px' }}>
        <div className="text-center pt-1 pb-6">
          <p className="text-3xl font-bold text-white mt-1">
            {formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
          </p>
        </div>

        <Button variant="outline" className="w-full border-border bg-card" onClick={() => setShowAddExpenseForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tilføj udgift
        </Button>
      </div>

      {/* Period selector - below the red field */}
      <div className="relative z-[1] pt-[2px]">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setPeriodYear(y => y - 1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => { setPeriodMonth(null); }}
          className={cn(
            'h-9 shrink-0 px-2.5 text-sm font-semibold transition-colors rounded-[8px]',
            periodMonth === null
              ? 'text-[#f58a2d] dark:text-[#f5a55d] bg-orange-tint'
              : 'text-foreground hover:text-foreground'
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
                'shrink-0 rounded-[8px] px-2.5 py-1.5 text-sm font-medium transition-colors',
                periodMonth === i
                  ? 'bg-[#f58a2d] text-white'
                  : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowStats(!showStats)}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] transition-colors',
            showStats ? 'text-[#f58a2d]' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BarChart3 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setPeriodYear(y => y + 1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Period total */}
      <div className="flex items-center justify-between px-1 py-1">
        <span className="text-sm text-muted-foreground">
          {periodMonth !== null ? `${danishMonthsFull[periodMonth]} ${periodYear}` : `Hele ${periodYear}`}
        </span>
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
        </span>
      </div>

      {/* Stats view */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {expenses.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Receipt className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              Ingen udgifter at vise statistik for
            </div>
          ) : (
            <>
              <div className="rounded-[8px] border border-border bg-card px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="mb-3 text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground">Månedlig udgift (6 mdr.)</p>
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

              <div className="rounded-[8px] border border-border bg-card px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="mb-3 text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground">Udgifter pr. kategori</p>
                {categoryStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen kategoriserede udgifter</p>
                ) : (
                  <div className="space-y-2.5">
                    {categoryStats.map(cat => {
                      const max = categoryStats[0].total;
                      const pct = max > 0 ? (cat.total / max) * 100 : 0;
                      return (
                        <div key={cat.name}>
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="font-medium text-foreground">{cat.name}</span>
                            <span className="font-semibold text-foreground">{cat.total.toFixed(0)} kr</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-[#f58a2d] transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-[8px] border border-border bg-card px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="mb-3 text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground">Betalt pr. forælder</p>
                <div className="space-y-2">
                  {parentUsers.map(u => {
                    const paid = expenses.filter(e => e.paidBy === u.id).reduce((s, e) => s + e.amount, 0);
                    const total = expenses.reduce((s, e) => s + e.amount, 0);
                    const pct = total > 0 ? (paid / total) * 100 : 0;
                    return (
                      <div key={u.id}>
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-medium text-foreground">{u.name}</span>
                          <span className="font-semibold text-foreground">{paid.toFixed(0)} kr ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
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
          className="space-y-2"
        >
          <AnimatePresence>
            {filteredExpenses.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Receipt className="mx-auto mb-3 h-11 w-11 text-muted-foreground" />
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
                          'border-border cursor-pointer transition-colors hover:border-border',
                          expense.status === 'disputed' && 'border-[#e6b894] bg-orange-tint-light'
                        )}
                        onClick={() => setDetailExpenseId(expense.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', category?.color || 'bg-secondary text-foreground')}>
                              {category ? <category.icon className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate font-semibold text-foreground">{expense.title}</p>
                                <p className="shrink-0 font-semibold text-foreground">{formatCurrency(expense.amount)}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatDate(expense.date)}</span>
                                <span>·</span>
                                <span>{paidByUser?.name}</span>
                                {expense.isRecurring && (
                                  <>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5 text-[#f58a2d] dark:text-[#f5a55d]"><Repeat2 className="h-3 w-3" /> Fast</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {needsApproval && (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-tint">
                                <AlertCircle className="h-3.5 w-3.5 text-[#f58a2d]" />
                              </div>
                            )}
                            {expense.status === 'disputed' && (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-tint">
                                <TriangleAlert className="h-3.5 w-3.5 text-[#f58a2d] dark:text-[#f5a55d]" />
                              </div>
                            )}
                            {expense.status === 'paid' && (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                                <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />
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
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Seneste betalinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {transferHistory.slice(0, 5).map((transfer) => {
                const fromUser = users.find((user) => user.id === transfer.fromUserId);
                const toUser = users.find((user) => user.id === transfer.toUserId);

                return (
                  <div key={transfer.id} className="rounded-[8px] border border-border bg-card p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {fromUser?.name} → {toUser?.name}
                      </p>
                      <Badge variant="outline">{formatCurrency(transfer.amount)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {transfer.status === 'requested' && 'Anmodet'}
                      {transfer.status === 'sent' && 'Sendt'}
                      {transfer.status === 'completed' && 'Gennemført'}
                      {transfer.status === 'declined' && 'Afvist'}
                      {' · '}
                      {formatDate(transfer.createdAt)}
                    </p>
                    {transfer.note && <p className="mt-0.5 text-xs text-muted-foreground">{transfer.note}</p>}
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
            className="flex-1 h-11 rounded-[8px] border-border bg-card text-sm font-medium text-foreground hover:bg-secondary"
            onClick={() => exportExpensesCSV(filteredExpenses, users)}
          >
            <Download className="mr-2 h-4 w-4" />
            Eksporter CSV
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-[8px] border-border bg-card text-sm font-medium text-foreground hover:bg-secondary"
            onClick={() => printExpenses(filteredExpenses, users)}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print / PDF
          </Button>
        </motion.div>
      )}

      {/* Expense detail Sheet */}
      <Sheet open={!!detailExpense} onOpenChange={(open) => { if (!open) setDetailExpenseId(null); }}>
        <SheetContent side="bottom" className="rounded-t-[28px] bg-card max-h-[85vh] overflow-y-auto">
          {detailExpense && (() => {
            const cat = expenseCategories.find(c => c.value === detailExpense.category);
            const paidBy = users.find(u => u.id === detailExpense.paidBy);
            const isApproved = detailExpense.approvedBy?.includes(currentUser?.id || '');
            const needsApproval = detailExpense.status === 'pending' && detailExpense.paidBy !== currentUser?.id && !isApproved;
            const linkedTransfer = detailExpense.linkedTransferId ? transfers.find(t => t.id === detailExpense.linkedTransferId) : null;

            return (
              <>
                <SheetHeader className="pb-2">
                  <SheetTitle className="text-left text-lg font-bold text-foreground">{detailExpense.title}</SheetTitle>
                </SheetHeader>
                <div className="space-y-2 px-4 pb-8">
                  {/* Amount + category header */}
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', cat?.color || 'bg-secondary text-foreground')}>
                      {cat ? <cat.icon className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(detailExpense.amount)}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{cat?.label || detailExpense.category}</span>
                        <span>·</span>
                        <span>{formatDate(detailExpense.date)}</span>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'shrink-0',
                        detailExpense.status === 'pending' && 'bg-orange-tint text-[#f58a2d] dark:text-[#f5a55d]',
                        detailExpense.status === 'paid' && 'bg-secondary text-foreground',
                        detailExpense.status === 'disputed' && 'bg-orange-tint text-[#b55f22]'
                      )}
                    >
                      {detailExpense.status === 'pending' ? 'Afventer' : detailExpense.status === 'paid' ? 'Godkendt' : 'Anfægtet'}
                    </Badge>
                  </div>

                  {detailExpense.description && (
                    <p className="text-sm text-muted-foreground">{detailExpense.description}</p>
                  )}

                  {/* Payment info */}
                  <div className="rounded-[8px] border border-border bg-card p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Betalingsdetaljer</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Betalt af</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={paidBy?.avatar} />
                          <AvatarFallback className="text-[10px]">{paidBy?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{paidBy?.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Fordelingstype</span>
                      <span className="text-sm font-medium text-foreground">
                        {detailExpense.splitType === 'equal' ? 'Lige fordeling' : detailExpense.splitType === 'percentage' ? 'Procentvis' : 'Fast beløb'}
                      </span>
                    </div>
                    {detailExpense.isRecurring && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Gentagelse</span>
                        <span className="text-sm font-medium text-foreground">
                          {detailExpense.recurringInterval === 'weekly' ? 'Ugentlig' : detailExpense.recurringInterval === 'monthly' ? 'Månedlig' : 'Årlig'}
                        </span>
                      </div>
                    )}
                    {detailExpense.isRecurring && detailExpense.nextDueDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Næste betaling</span>
                        <span className="text-sm font-medium text-foreground">{formatDate(detailExpense.nextDueDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Split breakdown */}
                  <div className="rounded-[8px] border border-border bg-card p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fordeling</p>
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
                            <span className="text-sm text-foreground">{user?.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-foreground">{formatCurrency(amount)}</span>
                            <span className="ml-1.5 text-xs text-muted-foreground">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Linked transfer info */}
                  {linkedTransfer && (
                    <div className="rounded-[8px] border border-border bg-card p-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Betalingsstatus</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant="outline">
                          {linkedTransfer.status === 'requested' ? 'Anmodet' : linkedTransfer.status === 'sent' ? 'Sendt' : linkedTransfer.status === 'completed' ? 'Gennemført' : 'Afvist'}
                        </Badge>
                      </div>
                      {linkedTransfer.completedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Betalt</span>
                          <span className="text-sm font-medium text-foreground">{formatDate(linkedTransfer.completedAt)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {detailExpense.receiptUrl && (
                    <a
                      href={detailExpense.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-[8px] border border-border bg-card p-3 text-center text-sm font-medium text-[#f58a2d] dark:text-[#f5a55d]"
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
          <div className="space-y-2 pt-2">
            <p className="text-sm text-muted-foreground">Beskriv hvorfor du anfægter denne udgift. Den anden forælder vil se din begrundelse.</p>
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
          <div className="space-y-2 pt-2">
            <p className="text-sm text-muted-foreground">Beskriv hvordan tvisten løses. Udgiften vil blive markeret som godkendt.</p>
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

      <SavingOverlay open={isSaving} />
    </div>
  );
}
