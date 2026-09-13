import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Copy,
  Check,
  Bookmark,
  Send,
  HelpCircle,
  File,
  Trash2,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { api } from '../services/api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { UploadedNote, SavedItem, AppLanguage, AppTheme } from '../types';
import { translations } from '../services/i18n';

interface NotesUploadViewProps {
  language: AppLanguage;
  theme: AppTheme;
  uploadedNotes: UploadedNote[];
  onAddNote: (note: UploadedNote) => void;
  onDeleteNote: (id: string) => void;
  onSaveItem: (item: Omit<SavedItem, 'id' | 'timestamp'>) => void;
}

export const NotesUploadView: React.FC<NotesUploadViewProps> = ({
  language,
  theme,
  uploadedNotes,
  onAddNote,
  onDeleteNote,
  onSaveItem,
}) => {
  const t = translations[language];

  const [activeNoteId, setActiveNoteId] = useState<string>(
    uploadedNotes[0]?.id || ''
  );
  const [customQuestion, setCustomQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<string>('summarize');
  const [qaResult, setQaResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeNote = uploadedNotes.find((n) => n.id === activeNoteId) || uploadedNotes[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundManager.play('button_click');
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 20;
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 25;
      });
    }, 120);

    const reader = new FileReader();

    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        const newNote: UploadedNote = {
          id: `note-${Date.now()}`,
          name: file.name,
          sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
          uploadedAt: new Date().toLocaleDateString(),
          content:
            content.length > 0
              ? content
              : `Content extracted from ${file.name}: Comprehensive university notes covering syllabus units, key theorems, architectural definitions, and algorithmic proofs.`,
        };

        onAddNote(newNote);
        setActiveNoteId(newNote.id);
        setUploadProgress(null);
        soundManager.play('upload_completed');
      }, 350);
    };

    reader.onerror = () => {
      clearInterval(progressInterval);
      setUploadProgress(null);
      alert('Failed to read file.');
    };

    // For plain text, markdown, json
    reader.readAsText(file);
  };

  const handleExecuteAction = async (action: string, customPrompt?: string) => {
    if (!activeNote) return;

    soundManager.play('button_click');
    setIsLoading(true);
    setActiveAction(action);
    setQaResult(null);
    setSaved(false);

    try {
      const res = await api.queryDocument({
        documentText: activeNote.content,
        action,
        customQuestion: customPrompt || customQuestion,
        language,
      });

      setQaResult(res.result);
      soundManager.play('ai_response_ready');
    } catch (err: any) {
      setQaResult(`### Error processing document\n\n${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!qaResult) return;
    soundManager.play('button_click');
    navigator.clipboard.writeText(qaResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!qaResult || !activeNote) return;
    soundManager.play('save');
    onSaveItem({
      title: `${activeAction.toUpperCase()}: ${activeNote.name}`,
      type: 'note',
      content: qaResult,
      subject: activeNote.name,
    });
    setSaved(true);
  };

  return (
    <div id="notes-upload-view" className="space-y-5 sm:space-y-6 max-w-4xl mx-auto pb-20 md:pb-8 w-full min-w-0">
      {/* Header */}
      <div className="border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4] shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-black text-black dark:text-[#F0EDE4] tracking-tight leading-tight">
              {t.uploadHeader}
            </h1>
            <p className="text-xs sm:text-sm text-black/70 dark:text-[#F0EDE4]/70">
              {t.uploadSub}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Box Zone */}
      <div className="p-5 sm:p-8 rounded-3xl bg-white/90 dark:bg-[#0c1412] border-2 border-dashed border-black/20 dark:border-white/20 hover:border-[#004741] transition-all text-center space-y-3 relative">
        <div className="w-12 h-12 rounded-2xl bg-[#004741]/10 dark:bg-[#004741]/30 text-[#004741] dark:text-[#6ee7b7] flex items-center justify-center mx-auto">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div>
          <label className="cursor-pointer text-xs sm:text-sm font-bold text-[#004741] dark:text-[#6ee7b7] hover:underline block">
            {t.dragDrop}
            <input
              type="file"
              accept=".pdf,.txt,.md,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <p className="text-[11px] sm:text-xs text-black/50 dark:text-[#F0EDE4]/50 mt-1">
            {t.supportedFiles}
          </p>
        </div>

        {/* Upload Progress Bar */}
        {uploadProgress !== null && (
          <div className="max-w-xs mx-auto space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold text-black/70 dark:text-[#F0EDE4]/70">
              <span>Uploading & Parsing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#004741] transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <h2 className="text-xs sm:text-sm font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider">
          {t.uploadedFiles} ({uploadedNotes.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {uploadedNotes.map((note) => {
            const isSelected = activeNote?.id === note.id;
            return (
              <div
                key={note.id}
                onClick={() => {
                  soundManager.play('card_open');
                  setActiveNoteId(note.id);
                  setQaResult(null);
                }}
                className={`p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 sm:gap-3 ${
                  isSelected
                    ? 'bg-[#004741] text-[#F0EDE4] border-[#004741] shadow-sm'
                    : 'bg-white/80 dark:bg-black/40 text-black dark:text-[#F0EDE4] border-black/10 dark:border-white/10 hover:border-[#004741]'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isSelected
                        ? 'bg-black/20 text-[#F0EDE4]'
                        : 'bg-[#004741]/10 text-[#004741] dark:text-[#6ee7b7]'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold truncate">{note.name}</h3>
                    <p
                      className={`text-[10px] sm:text-[11px] truncate ${
                        isSelected ? 'text-[#F0EDE4]/70' : 'text-black/50 dark:text-[#F0EDE4]/50'
                      }`}
                    >
                      {note.sizeFormatted} • {note.uploadedAt}
                    </p>
                  </div>
                </div>

                {uploadedNotes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundManager.play('delete');
                      onDeleteNote(note.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-black/10 transition-colors opacity-70 hover:opacity-100 shrink-0"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action triggers on Active Document */}
      {activeNote && (
        <div className="p-4 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 shadow-sm space-y-3.5 sm:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider truncate">
              Document Actions: <strong className="text-[#004741] dark:text-[#6ee7b7]">{activeNote.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {[
              { id: 'summarize', label: t.summarizeDoc },
              { id: 'mcq', label: t.generateDocMCQ },
              { id: 'exam_questions', label: t.generateDoc10Mark },
              { id: 'important_topics', label: t.findImportant },
            ].map((act) => (
              <button
                key={act.id}
                onClick={() => handleExecuteAction(act.id)}
                disabled={isLoading}
                className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold border transition-all active:scale-95 text-center truncate ${
                  activeAction === act.id && qaResult
                    ? 'bg-[#004741] text-[#F0EDE4] border-[#004741]'
                    : 'bg-black/5 dark:bg-white/5 text-black dark:text-[#F0EDE4] border-black/10 dark:border-white/10 hover:border-[#004741]'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>

          {/* Custom Question input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customQuestion.trim()) {
                handleExecuteAction('custom', customQuestion.trim());
              }
            }}
            className="relative flex items-center pt-1"
          >
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder={t.askDocCustom}
              className="w-full pl-3.5 sm:pl-4 pr-11 sm:pr-12 py-2.5 sm:py-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#F0EDE4]/30 dark:bg-black/30 text-black dark:text-[#F0EDE4] text-xs focus:outline-none focus:ring-2 focus:ring-[#004741]"
            />
            <button
              type="submit"
              disabled={!customQuestion.trim() || isLoading}
              className="absolute right-1.5 p-1.5 sm:p-2 rounded-lg bg-[#004741] text-[#F0EDE4] hover:bg-black disabled:opacity-40 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#004741] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-black/70 dark:text-[#F0EDE4]/70">
            Analyzing document with Gemini 3.8 Flash...
          </p>
        </div>
      )}

      {/* Document QA Result Display */}
      {qaResult && (
        <div className="p-4 sm:p-7 rounded-3xl bg-white dark:bg-[#0c1412] border-2 border-[#004741]/20 shadow-md space-y-3.5 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-black/10 dark:border-white/10">
            <span className="px-2.5 py-1 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold uppercase tracking-wider self-start">
              {activeAction.replace('_', ' ')}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-black/15 dark:border-white/15 text-xs font-bold text-black dark:text-[#F0EDE4] hover:bg-black/5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.copied : t.copyAnswer}</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-black"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{saved ? t.saved : t.saveAnswer}</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <MarkdownRenderer content={qaResult} theme={theme} />
          </div>
        </div>
      )}
    </div>
  );
};
