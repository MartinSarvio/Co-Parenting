import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  Bell,
  CalendarDays,
  CheckSquare,
  MessageCircle,
  Receipt,
  ArrowLeftRight,
  FileText,
  UtensilsCrossed,
  ShoppingCart,
  Sparkles,
  BellOff,
  Users,
} from 'lucide-react';
import type { NotificationType } from '@/types';

const typeConfig: Record<NotificationType, { icon: typeof Bell; label: string; color: string }> = {
  handover_reminder: { icon: ArrowLeftRight, label: 'Aflevering', color: '#f58a2d' },
  task_due: { icon: CheckSquare, label: 'Opgave', color: '#4f4d45' },
  event_reminder: { icon: CalendarDays, label: 'Begivenhed', color: '#2f82de' },
  message: { icon: MessageCircle, label: 'Besked', color: '#10b981' },
  expense_pending: { icon: Receipt, label: 'Udgift', color: '#8b5cf6' },
  schedule_change: { icon: ArrowLeftRight, label: 'Samvær', color: '#f58a2d' },
  meeting_minutes: { icon: FileText, label: 'Referat', color: '#6b7280' },
  professional_message: { icon: MessageCircle, label: 'Professionel', color: '#0ea5e9' },
  expense_approved: { icon: Receipt, label: 'Udgift godkendt', color: '#22c55e' },
  expense_disputed: { icon: Receipt, label: 'Udgift anfægtet', color: '#ef4444' },
  document_shared: { icon: FileText, label: 'Dokument', color: '#0ea5e9' },
  meal_plan: { icon: UtensilsCrossed, label: 'Madplan', color: '#f97316' },
  shopping_reminder: { icon: ShoppingCart, label: 'Indkøb', color: '#22c55e' },
  cleaning_reminder: { icon: Sparkles, label: 'Rengøring', color: '#a855f7' },
  group_request_approved: { icon: Users, label: 'Gruppe', color: '#22c55e' },
};

const fallbackConfig = { icon: Bell, label: 'Notifikation', color: '#6b7280' };

export function NotifikationsView() {
  const { notifications, markNotificationRead } = useAppStore();

  const sorted = [...notifications].sort(
    (a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()
  );

  const unread = sorted.filter(n => !n.read);
  const read = sorted.filter(n => n.read);

  const handleMarkRead = (id: string) => {
    if (markNotificationRead) markNotificationRead(id);
  };

  return (
    <div className="space-y-4 py-1">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-1"
      >
        <h1 className="text-[1.7rem] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          Notifikationer
        </h1>
      </motion.div>

      {sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center py-16"
        >
          <BellOff className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Ingen notifikationer endnu</p>
        </motion.div>
      ) : (
        <div className="space-y-1">
          {unread.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-1"
            >
              <p className="px-1 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Nye</p>
              {unread.map((n, i) => {
                const config = typeConfig[n.type] ?? fallbackConfig;
                const Icon = config.icon;
                return (
                  <motion.button
                    key={n.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => handleMarkRead(n.id)}
                    className="flex w-full items-start gap-3 rounded-[8px] bg-orange-tint-light p-3.5 text-left transition-colors active:bg-orange-tint"
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: config.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground">{n.title}</span>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f58a2d]" />
                      </div>
                      <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true, locale: da })}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {read.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-1"
            >
              <p className={cn("px-1 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground", unread.length > 0 && "mt-4")}>
                Tidligere
              </p>
              {read.map((n, i) => {
                const config = typeConfig[n.type] ?? fallbackConfig;
                const Icon = config.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.02 * i }}
                    className="flex w-full items-start gap-3 rounded-[8px] p-3.5"
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-muted-foreground">{n.title}</span>
                      <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true, locale: da })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
