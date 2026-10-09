import { useApp } from '@/context/AppContext';
import { CategoryBadge, PriorityBadge } from '@/components/Badges';
import { RobotAvatar } from '@/components/RobotAvatar';
import {
  GraduationCap,
  Zap,
  Clock,
  CheckSquare,
  UserCheck,
  Check,
  MessageSquare,
  AlertCircle,
  BookOpen,
  Calendar,
} from 'lucide-react';
import type { BriefingItem } from '@/types';

export function StudentLifePage() {
  const {
    t,
    settings,
    setSettings,
    conversations,
    analysis,
    toggleActionItem,
    setSelectedConversationId,
    setCurrentPage,
  } = useApp();

  // Gather all items
  const allActionItems: { item: import('@/types').ActionItem; conversationId: string }[] = [];
  const allDeadlines: import('@/types').Deadline[] = [];

  for (const key of Object.keys(analysis)) {
    for (const item of analysis[key].actionItems) {
      allActionItems.push({ item, conversationId: key });
    }
    allDeadlines.push(...analysis[key].deadlines);
  }

  const incompleteItems = allActionItems.filter(({ item }) => !item.completed);

  // Student categories filter
  const studentCategories = ['assignment', 'exam', 'meeting', 'task', 'project', 'event', 'request'];
  const studentItems = incompleteItems.filter(({ item }) =>
    studentCategories.includes(item.category)
  );
  const studentDeadlines = allDeadlines.filter((d) =>
    studentCategories.includes(d.category)
  );

  // Urgent items (high priority or due within 2 days)
  const urgentItems = studentItems.filter(({ item }) => {
    if (item.priority === 'high') return true;
    if (item.dueDate) {
      const days = Math.ceil((item.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 2;
    }
    return false;
  });

  // Upcoming deadlines (sorted by date)
  const upcomingDeadlines = studentDeadlines
    .filter((d) => d.date && d.date > Date.now() - 86400000)
    .sort((a, b) => (a.date || 0) - (b.date || 0));

  // Requests
  const requests = studentItems.filter(({ item }) => item.category === 'request');

  const formatDate = (ts?: number) => {
    if (!ts) return '';
    const diff = ts - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return t('student.overdue');
    if (days === 0) return t('student.dueToday');
    if (days === 1) return t('student.dueTomorrow');
    return `${days} ${t('student.daysLeft')}`;
  };

  const handleViewSource = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setCurrentPage('conversations');
  };

  if (conversations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-amber-500" />
                {t('student.title')}
              </h1>
              <p className="text-sm text-slate-500 mt-1">{t('student.subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <RobotAvatar state="idle" size={100} reducedMotion={settings.reducedMotion} />
          <p className="text-slate-400 mt-4 text-center max-w-md">{t('student.noData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with toggle */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-amber-500" />
              {t('student.title')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{t('student.subtitle')}</p>
          </div>
          <button
            onClick={() => setSettings({ studentMode: !settings.studentMode })}
            className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
              settings.studentMode ? 'bg-amber-500' : 'bg-slate-200'
            }`}
            aria-label={settings.studentMode ? t('student.disable') : t('student.enable')}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                settings.studentMode ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>
        <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium ${
          settings.studentMode ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'
        }`}>
          {settings.studentMode ? t('student.enabled') : t('student.disabled')}
        </div>
      </div>

      {/* Daily Briefing */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-200">
        <div className="flex items-start gap-4">
          <div className="hidden sm:block">
            <RobotAvatar state="speaking" size={64} reducedMotion={settings.reducedMotion} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{t('student.briefing')}</h2>
            <p className="text-amber-100 text-sm">
              {urgentItems.length > 0 && `${urgentItems.length} ${t('student.urgent')}. `}
              {upcomingDeadlines.length > 0 && `${upcomingDeadlines.length} ${t('student.deadlines')}. `}
              {studentItems.length > 0 && `${studentItems.length} ${t('student.tasks')}. `}
              {requests.length > 0 && `${requests.length} ${t('student.requests')}.`}
            </p>
          </div>
        </div>
      </div>

      {/* Evidence note */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">{t('student.evidenceNote')}</p>
      </div>

      {/* Urgent Items */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-red-500" />
          {t('student.urgent')}
        </h2>
        {urgentItems.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">{t('student.noUrgent')}</p>
        ) : (
          <div className="space-y-2">
            {urgentItems.map(({ item, conversationId }) => (
              <BriefingItemRow
                key={item.id}
                item={item}
                conversationId={conversationId}
                onToggle={() => toggleActionItem(conversationId, item.id)}
                onView={() => handleViewSource(conversationId)}
                formatDate={formatDate}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          {t('student.deadlines')}
        </h2>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">{t('student.noDeadlines')}</p>
        ) : (
          <div className="space-y-2">
            {upcomingDeadlines.slice(0, 10).map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => handleViewSource(d.conversationId)}
              >
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{d.text.slice(0, 80)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryBadge category={d.category} />
                    {d.date && (
                      <span className={`text-xs font-medium ${
                        formatDate(d.date) === t('student.overdue') ? 'text-red-600' :
                        formatDate(d.date) === t('student.dueToday') ? 'text-red-500' : 'text-amber-600'
                      }`}>
                        {formatDate(d.date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unfinished Tasks */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-500" />
            {t('student.tasks')}
          </h2>
          {studentItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{t('student.noTasks')}</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {studentItems.map(({ item, conversationId }) => (
                <BriefingItemRow
                  key={item.id}
                  item={item}
                  conversationId={conversationId}
                  onToggle={() => toggleActionItem(conversationId, item.id)}
                  onView={() => handleViewSource(conversationId)}
                  formatDate={formatDate}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* Unanswered Requests */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-pink-500" />
            {t('student.requests')}
          </h2>
          {requests.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{t('student.noRequests')}</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {requests.map(({ item, conversationId }) => (
                <BriefingItemRow
                  key={item.id}
                  item={item}
                  conversationId={conversationId}
                  onToggle={() => toggleActionItem(conversationId, item.id)}
                  onView={() => handleViewSource(conversationId)}
                  formatDate={formatDate}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface BriefingItemRowProps {
  item: import('@/types').ActionItem;
  conversationId: string;
  onToggle: () => void;
  onView: () => void;
  formatDate: (ts?: number) => string;
  t: (key: string, fallback?: string) => string;
}

function BriefingItemRow({ item, onToggle, onView, formatDate, t }: BriefingItemRowProps) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded-md flex-shrink-0 mt-0.5 border-2 transition-all flex items-center justify-center ${
          item.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-300 hover:border-emerald-400'
        }`}
      >
        {item.completed && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          {item.text.slice(0, 100)}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <CategoryBadge category={item.category} />
          <PriorityBadge priority={item.priority} />
          {item.dueDate && (
            <span className={`text-xs font-medium ${
              formatDate(item.dueDate) === t('student.overdue') ? 'text-red-600' : 'text-amber-600'
            }`}>
              {formatDate(item.dueDate)}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onView}
        className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-sky-500 transition-colors flex-shrink-0"
        title={t('student.viewSource')}
      >
        <MessageSquare className="w-4 h-4" />
      </button>
    </div>
  );
}
