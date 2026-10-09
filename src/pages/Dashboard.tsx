import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { createSampleConversation } from '@/data/sampleData';
import { RobotAvatar } from '@/components/RobotAvatar';
import { CategoryBadge, PriorityBadge } from '@/components/Badges';
import { ImportChatModal } from '@/components/ImportChatModal';
import type { ConversationMode } from '@/types';
import {
  MessageSquare,
  CheckSquare,
  Clock,
  UserCheck,
  Bot,
  ArrowRight,
  Zap,
  BookOpen,
  Calendar,
  HelpCircle,
  Languages,
  TrendingUp,
  Upload,
  Sparkles,
} from 'lucide-react';

export function Dashboard() {
  const {
    t,
    conversations,
    analysis,
    settings,
    addConversation,
    setCurrentPage,
    setSelectedConversationId,
  } = useApp();

  const allActionItems: { item: import('@/types').ActionItem; conversationId: string }[] = [];
  const allDeadlines: import('@/types').Deadline[] = [];

  for (const key of Object.keys(analysis)) {
    for (const item of analysis[key].actionItems) {
      allActionItems.push({ item, conversationId: key });
    }
    allDeadlines.push(...analysis[key].deadlines);
  }

  const incompleteItems = allActionItems.filter(({ item }) => !item.completed);
  const upcomingDeadlines = allDeadlines
    .filter((d) => d.date && d.date > Date.now() - 86400000)
    .sort((a, b) => (a.date || 0) - (b.date || 0));
  const requests = allActionItems.filter(
    ({ item }) => !item.completed && item.category === 'request'
  );
  const highPriority = incompleteItems.filter(({ item }) => item.priority === 'high');

  const stats = [
    { label: t('dashboard.stats.conversations'), value: conversations.length, icon: MessageSquare, color: 'text-sky-600 bg-sky-50' },
    { label: t('dashboard.stats.actionItems'), value: allActionItems.length, icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50' },
    { label: t('dashboard.stats.deadlines'), value: upcomingDeadlines.length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: t('dashboard.stats.requests'), value: requests.length, icon: UserCheck, color: 'text-pink-600 bg-pink-50' },
  ];

  const modes: ConversationMode[] = [
    { id: 'catchmeup', labelKey: 'dashboard.catchmeup', icon: 'zap', prompt: t('suggestion.missed') },
    { id: 'explain', labelKey: 'dashboard.explainSimply', icon: 'book', prompt: t('suggestion.important') },
    { id: 'help', labelKey: 'dashboard.helpWithTask', icon: 'help', prompt: t('suggestion.helpStep') },
    { id: 'deadline', labelKey: 'dashboard.findDeadline', icon: 'calendar', prompt: t('suggestion.deadline') },
    { id: 'practice', labelKey: 'dashboard.practiceLanguage', icon: 'languages', prompt: t('suggestion.likeFriend') },
  ];

  const modeIcons: Record<string, typeof Zap> = {
    zap: Zap,
    book: BookOpen,
    help: HelpCircle,
    calendar: Calendar,
    languages: Languages,
  };

  const [showImport, setShowImport] = useState(false);

  const handleLoadDemo = () => {
    const conv = createSampleConversation();
    addConversation(conv);
  };

  const handleMode = (prompt: string) => {
    setCurrentPage('aibuddy');
    // The AI Buddy page will pick up the pending prompt via a global event
    window.dispatchEvent(new CustomEvent('buddy-prompt', { detail: prompt }));
  };

  const handleViewConversation = (id: string) => {
    setSelectedConversationId(id);
    setCurrentPage('conversations');
  };

  const formatDate = (ts?: number) => {
    if (!ts) return '';
    const diff = ts - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return t('student.overdue');
    if (days === 0) return t('student.dueToday');
    if (days === 1) return t('student.dueTomorrow');
    return `${days} ${t('student.daysLeft')}`;
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-6">
          <RobotAvatar state="idle" size={120} reducedMotion={settings.reducedMotion} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('dashboard.noConversations')}</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">{t('dashboard.noConversationsDesc')}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleLoadDemo}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-medium hover:bg-amber-100 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {t('conversations.loadDemo')}
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-md shadow-sky-200"
          >
            <Upload className="w-4 h-4" />
            {t('dashboard.importChat')}
          </button>
          <button
            onClick={() => setCurrentPage('conversations')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {t('dashboard.viewAll')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Import + Demo buttons */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-sky-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{t('dashboard.welcome')}</h1>
            <p className="text-sky-100 text-sm">{t('dashboard.welcomeSub')}</p>
          </div>
          <div className="hidden sm:block">
            <RobotAvatar state="speaking" size={70} reducedMotion={settings.reducedMotion} />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            {t('dashboard.importChat')}
          </button>
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {t('conversations.loadDemo')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sky-500" />
          {t('dashboard.quickActions')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modes.map((mode) => {
            const Icon = modeIcons[mode.icon] || Zap;
            return (
              <button
                key={mode.id}
                onClick={() => handleMode(mode.prompt)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-sm font-medium text-slate-700 flex-1">{t(mode.labelKey)}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            {t('dashboard.upcomingDeadlines')}
          </h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{t('dashboard.noDeadlines')}</p>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleViewConversation(d.conversationId)}
                >
                  <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{d.text.slice(0, 60)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={d.category} />
                      {d.date && (
                        <span className="text-xs text-amber-600 font-medium">{formatDate(d.date)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unfinished Tasks */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-500" />
            {t('dashboard.unfinishedTasks')}
          </h2>
          {incompleteItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{t('dashboard.noTasks')}</p>
          ) : (
            <div className="space-y-2">
              {incompleteItems.slice(0, 5).map(({ item }) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleViewConversation(item.conversationId)}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{item.text.slice(0, 60)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={item.category} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity / Conversations */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-500" />
            {t('dashboard.recentActivity')}
          </h2>
          <button
            onClick={() => setCurrentPage('conversations')}
            className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
          >
            {t('dashboard.viewAll')}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {conversations.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">{t('dashboard.noActivity')}</p>
        ) : (
          <div className="space-y-2">
            {conversations.slice(-5).reverse().map((conv) => (
              <div
                key={conv.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => handleViewConversation(conv.id)}
              >
                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700 truncate">{conv.title}</p>
                    {conv.isSample && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{t('conversations.demo')}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{conv.messages.length} {t('conversations.messages')}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating AI Buddy button is in App.tsx */}

      <ImportChatModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
