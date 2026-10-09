import type { ActionCategory } from '@/types';
import { useApp } from '@/context/AppContext';

const CATEGORY_STYLES: Record<ActionCategory, { bg: string; text: string; border: string }> = {
  assignment: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  exam: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  meeting: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  task: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  project: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  event: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  request: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  general: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

interface CategoryBadgeProps {
  category: ActionCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const { t } = useApp();
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.general;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
      {t(`cat.${category}`)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const { t } = useApp();
  const styles = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles[priority]}`}>
      {t(`conversations.${priority}`)}
    </span>
  );
}

const PRIORITY_STYLES = {
  high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  low: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
};

export { CATEGORY_STYLES, PRIORITY_STYLES };
