import { useState } from 'react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  CheckCircle2,
  ClipboardList,
  ShoppingCart,
  Sparkles,
  Baby,
  ArrowLeftRight,
  Briefcase,
  Receipt,
} from 'lucide-react';
import { OpgaverSidePanel } from '@/components/custom/OpgaverSidePanel';

const categoryConfig: Record<string, { icon: typeof ClipboardList; label: string; color: string }> = {
  general: { icon: ClipboardList, label: 'Generel', color: '#4f4d45' },
  shopping: { icon: ShoppingCart, label: 'Indkøb', color: '#22c55e' },
  child: { icon: Baby, label: 'Barn', color: '#2f82de' },
  handover: { icon: ArrowLeftRight, label: 'Aflevering', color: '#f58a2d' },
  meeting: { icon: Briefcase, label: 'Møde', color: '#8b5cf6' },
  expense: { icon: Receipt, label: 'Udgift', color: '#ef4444' },
  cleaning: { icon: Sparkles, label: 'Rengøring', color: '#a855f7' },
};

export function HistorikView() {
  const { tasks, users, setActiveTab } = useAppStore();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const completedTasks = tasks
    .filter(t => t.completed)
    .filter(t => categoryFilter === 'all' || t.category === categoryFilter)
    .sort((a, b) => {
      const aTime = a.completedAt ? parseISO(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? parseISO(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? 'Ukendt';

  const categories = [
    { value: 'all', label: 'Alle' },
    { value: 'general', label: 'Generel' },
    { value: 'shopping', label: 'Indkøb' },
    { value: 'child', label: 'Barn' },
    { value: 'cleaning', label: 'Rengøring' },
    { value: 'handover', label: 'Aflevering' },
  ];

  return (
    <div className="space-y-4 py-1">
      {/* Side panel for hamburger navigation */}
      <OpgaverSidePanel
        activeSubTab=""
        onSelectSubTab={() => setActiveTab('opgaver')}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-1"
      >
        <h1 className="text-[1.7rem] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          Historik
        </h1>
      </motion.div>

      {/* Category filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-1"
      >
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
              categoryFilter === cat.value
                ? 'bg-primary text-white'
                : 'bg-background text-muted-foreground'
            )}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>

      {completedTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center py-16"
        >
          <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Ingen fuldførte opgaver</p>
        </motion.div>
      ) : (
        <div className="space-y-1">
          {completedTasks.map((task, i) => {
            const config = categoryConfig[task.category] ?? categoryConfig.general;
            const Icon = config.icon;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.02 * Math.min(i, 20) }}
                className="flex w-full items-start gap-3 rounded-[8px] p-3.5"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: config.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-foreground">{task.title}</span>
                    <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-[#7e7c74]">
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Fuldført af {getUserName(task.assignedTo)}
                    {task.completedAt && (
                      <> · {formatDistanceToNow(parseISO(task.completedAt), { addSuffix: true, locale: da })}</>
                    )}
                  </p>
                  {task.completedAt && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {format(parseISO(task.completedAt), 'd. MMMM yyyy', { locale: da })}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
