import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { parseChatFile, parseChatText } from '@/utils/chatParser';
import { createSampleConversation } from '@/data/sampleData';
import {
  Upload,
  Clipboard,
  X,
  Zap,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';

interface ImportChatModalProps {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
}

export function ImportChatModal({ open, onClose, onImported }: ImportChatModalProps) {
  const { t, addConversation } = useApp();
  const [importMode, setImportMode] = useState<'file' | 'paste'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

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
        handleClose();
        onImported?.();
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
      handleClose();
      onImported?.();
    } catch {
      setError(t('error.importFailed'));
    }
  };

  const handleLoadSample = () => {
    const conv = createSampleConversation();
    addConversation(conv);
    setSuccess(t('onboarding.demoLoaded'));
    setError(null);
    setTimeout(() => {
      handleClose();
      onImported?.();
    }, 800);
  };

  const handleClose = () => {
    setShowImport(false);
    setError(null);
    setSuccess(null);
    setPasteText('');
  };

  function setShowImport(_v: boolean) {
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-sky-500" />
            {t('conversations.import')}
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Load Sample Chat - prominent button */}
        <button
          onClick={handleLoadSample}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors mb-4 text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-amber-800 text-sm">{t('conversations.loadDemo')}</div>
            <div className="text-xs text-amber-600 mt-0.5">{t('onboarding.demoDesc')}</div>
          </div>
        </button>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setImportMode('paste')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              importMode === 'paste' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Clipboard className="w-4 h-4 inline mr-1.5" />
            {t('conversations.pasteMode')}
          </button>
          <button
            onClick={() => setImportMode('file')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              importMode === 'file' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-1.5" />
            {t('conversations.fileMode')}
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
              accept=".txt,.csv,.json"
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
              rows={10}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none font-mono"
            />
            <button
              onClick={handlePasteImport}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-md shadow-sky-200"
            >
              <Zap className="w-4 h-4" />
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

        {success && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
            <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-emerald-600">{success}</p>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-3">{t('conversations.importHint')}</p>
      </div>
    </div>
  );
}
