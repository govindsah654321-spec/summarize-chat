import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { parseChatFile, parseChatText } from '@/utils/chatParser';
import { createSampleConversation } from '@/data/sampleData';
import { CategoryBadge, PriorityBadge } from '@/components/Badges';
import type { ChatMessage } from '@/types';
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  Zap,
  Search,
  X,
  Check,
  MessageSquare,
  ChevronRight,
  Clipboard,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export function ConversationsPage() {
  const {
    t,
    conversations,
    addConversation,
    deleteConversation,
    analysis,
    selectedConversationId,
    setSelectedConversationId,
    getAnalysis,
    regenerateAnalysis,
    toggleActionItem,
    setCurrentPage,
  } = useApp();

  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOriginalIds, setShowOriginalIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        if (!content || content.trim().length < 10) {
          setError(t('error.parseFailed'));
          return;
        }
        const conv = parseChatFile(content, file.name);
        if (conv.messages.length === 0) {
          setError(t('error.parseFailed'));
          return;
        }
        addConversation(conv);
        setShowImport(false);
        setError(null);
        setPasteText('');
      } catch {
        setError(t('error.importFailed'));
      }
    };
    reader.onerror = () => setError(t('error.importFailed'));
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!pasteText.trim() || pasteText.trim().length < 10) {
      setError(t('error.parseFailed'));
      return;
    }
    try {
      const conv = parseChatText(pasteText, undefined, 'pasted-chat.txt', false);
      if (conv.messages.length === 0) {
        setError(t('error.parseFailed'));
        return;
      }
      addConversation(conv);
      setShowImport(false);
      setPasteText('');
      setError(null);
    } catch {
      setError(t('error.importFailed'));
    }
  };

  const handleLoadDemo = () => {
    const conv = createSampleConversation();
    addConversation(conv);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('conversations.deleteConfirm'))) {
      deleteConversation(id);
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
      }
    }
  };

  const toggleShowOriginal = (msgId: string) => {
    setShowOriginalIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  const selectedConv = conversations.find((c) => c.id === selectedConversationId);
  const selectedAnalysis = selectedConv ? getAnalysis(selectedConv.id) : null;

  const filteredMessages: ChatMessage[] = selectedConv
    ? searchQuery.trim()
      ? selectedConv.messages.filter((m) =>
          m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.sender.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : selectedConv.messages
    : [];

  if (selectedConv) {
    return (
      <div className="space-y-4">
        {/* Conversation header */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSelectedConversationId(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-800 truncate">{selectedConv.title}</h1>
                <p className="text-xs text-slate-500">
                  {selectedConv.messages.length} {t('conversations.messages')} • {t('conversations.importedAt')}{' '}
                  {new Date(selectedConv.importedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => regenerateAnalysis(selectedConv.id)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                title={t('conversations.regenerate')}
              >
                <RefreshCw className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => handleDelete(selectedConv.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Analysis panels */}
        {selectedAnalysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Action Items */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                {t('conversations.actionItems')}
                <span className="text-xs text-slate-400">({selectedAnalysis.actionItems.length})</span>
              </h2>
              {selectedAnalysis.actionItems.length === 0 ? (
                <p className="text-xs text-slate-400">{t('conversations.noActions')}</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedAnalysis.actionItems.map((item) => (
                    <div key={item.id} className="p-2.5 bg-slate-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleActionItem(selectedConv.id, item.id)}
                          className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 border-2 transition-all ${
                            item.completed
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-slate-300 hover:border-emerald-400'
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {item.text.slice(0, 100)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <CategoryBadge category={item.category} />
                            <PriorityBadge priority={item.priority} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deadlines */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                {t('conversations.deadlines')}
                <span className="text-xs text-slate-400">({selectedAnalysis.deadlines.length})</span>
              </h2>
              {selectedAnalysis.deadlines.length === 0 ? (
                <p className="text-xs text-slate-400">{t('conversations.noDeadlines')}</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedAnalysis.deadlines.map((d) => (
                    <div key={d.id} className="p-2.5 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-700">{d.text.slice(0, 100)}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <CategoryBadge category={d.category} />
                        {d.date && (
                          <span className="text-xs text-amber-600 font-medium">
                            {new Date(d.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Decisions */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-500" />
                {t('conversations.decisions')}
                <span className="text-xs text-slate-400">({selectedAnalysis.decisions.length})</span>
              </h2>
              {selectedAnalysis.decisions.length === 0 ? (
                <p className="text-xs text-slate-400">{t('conversations.noDecisions')}</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedAnalysis.decisions.map((d) => (
                    <div key={d.id} className="p-2.5 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-700">{d.text.slice(0, 100)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {selectedAnalysis && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-500" />
              {t('conversations.keyPoints')}
            </h2>
            <div className="space-y-1.5">
              {selectedAnalysis.summary.keyPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('conversations.search')}
              className="flex-1 text-sm bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">{t('conversations.noResults')}</p>
          ) : (
            filteredMessages.map((msg) => (
              <div key={msg.id} className="flex flex-col p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-700">{msg.sender}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{msg.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{t('conversations.title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-medium hover:bg-amber-100 transition-colors text-sm"
          >
            <Zap className="w-4 h-4" />
            {t('conversations.loadDemo')}
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors text-sm shadow-md shadow-sky-200"
          >
            <Upload className="w-4 h-4" />
            {t('conversations.import')}
          </button>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">{t('conversations.empty')}</h2>
          <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">{t('conversations.emptyDesc')}</p>
          <p className="text-xs text-slate-400 mb-6">{t('conversations.importHint')}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleLoadDemo}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-medium hover:bg-amber-100"
            >
              <Zap className="w-4 h-4" />
              {t('conversations.loadDemo')}
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600"
            >
              <Upload className="w-4 h-4" />
              {t('conversations.import')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const convAnalysis = analysis[conv.id];
            const actionCount = convAnalysis?.actionItems.length || 0;
            const deadlineCount = convAnalysis?.deadlines.length || 0;
            return (
              <div
                key={conv.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                    onClick={() => setSelectedConversationId(conv.id)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-sky-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800 truncate">{conv.title}</h3>
                        {conv.isSample && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            {t('conversations.demo')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>{conv.messages.length} {t('conversations.messages')}</span>
                        {actionCount > 0 && <span className="text-emerald-600">{actionCount} {t('conversations.actionItems')}</span>}
                        {deadlineCount > 0 && <span className="text-amber-600">{deadlineCount} {t('conversations.deadlines')}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedConversationId(conv.id)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(conv.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{t('conversations.import')}</h3>
              <button onClick={() => { setShowImport(false); setError(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setImportMode('file')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  importMode === 'file' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-1" />
                {t('conversations.fileMode')}
              </button>
              <button
                onClick={() => setImportMode('paste')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  importMode === 'paste' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Clipboard className="w-4 h-4 inline mr-1" />
                {t('conversations.pasteMode')}
              </button>
            </div>

            {importMode === 'file' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-sky-300 hover:bg-sky-50/50 transition-colors"
              >
                <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">{t('conversations.importHint')}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </div>
            ) : (
              <div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={t('conversations.paste')}
                  rows={8}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                />
                <button
                  onClick={handlePasteImport}
                  className="mt-3 w-full px-4 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
                >
                  {t('conversations.importBtn')}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <p className="text-xs text-slate-400 mt-3">{t('conversations.importHint')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
