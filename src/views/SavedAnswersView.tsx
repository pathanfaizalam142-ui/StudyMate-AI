import React, { useState } from 'react';
import {
  Bookmark,
  Search,
  Copy,
  Check,
  Trash2,
  FileCheck2,
  MessageSquare,
  FileText,
  Eye,
  X,
  Share2,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SavedItem, AppLanguage, AppTheme } from '../types';
import { translations } from '../services/i18n';

interface SavedAnswersViewProps {
  language: AppLanguage;
  theme: AppTheme;
  savedItems: SavedItem[];
  onDeleteSavedItem: (id: string) => void;
  onClearAllSaved: () => void;
}

export const SavedAnswersView: React.FC<SavedAnswersViewProps> = ({
  language,
  theme,
  savedItems,
  onDeleteSavedItem,
  onClearAllSaved,
}) => {
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [readingItem, setReadingItem] = useState<SavedItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = savedItems.filter((item) => {
    const matchesFilter = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    soundManager.play('button_click');
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    soundManager.play('delete');
    if (window.confirm(language === 'hi' ? 'क्या आप इस सेव किए गए उत्तर को हटाना चाहते हैं?' : 'Remove this saved item?')) {
      onDeleteSavedItem(id);
      if (readingItem?.id === id) {
        setReadingItem(null);
      }
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'exam_answer':
        return FileCheck2;
      case 'note':
        return FileText;
      default:
        return MessageSquare;
    }
  };

  return (
    <div id="saved-answers-view" className="space-y-5 sm:space-y-6 max-w-4xl mx-auto pb-20 md:pb-8 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4] shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-black text-black dark:text-[#F0EDE4] tracking-tight leading-tight">
              {t.savedHeader}
            </h1>
            <p className="text-xs sm:text-sm text-black/70 dark:text-[#F0EDE4]/70">
              {t.savedSub} ({savedItems.length})
            </p>
          </div>
        </div>

        {savedItems.length > 0 && (
          <button
            onClick={() => {
              soundManager.play('delete');
              if (window.confirm('Delete all saved answers?')) {
                onClearAllSaved();
              }
            }}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline self-start sm:self-auto"
          >
            {t.clearAll}
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-black/40 dark:text-[#F0EDE4]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchSavedPlaceholder}
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/30 text-xs focus:outline-none focus:ring-1 focus:ring-[#004741]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'all', label: t.filterAll },
            { id: 'exam_answer', label: t.filterExam },
            { id: 'ai_answer', label: t.filterAI },
            { id: 'note', label: t.filterNotes },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => {
                soundManager.play('button_click');
                setFilterType(pill.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                filterType === pill.id
                  ? 'bg-[#004741] text-[#F0EDE4] border-[#004741]'
                  : 'bg-white/70 dark:bg-black/30 text-black dark:text-[#F0EDE4] border-black/10 dark:border-white/10'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-white/60 dark:bg-black/20 border border-black/10 dark:border-white/10 space-y-2">
          <Bookmark className="w-8 h-8 text-black/30 dark:text-[#F0EDE4]/30 mx-auto" />
          <h3 className="text-sm font-bold text-black dark:text-[#F0EDE4]">
            {t.noSavedTitle}
          </h3>
          <p className="text-xs text-black/60 dark:text-[#F0EDE4]/60 max-w-sm mx-auto">
            {t.noSavedDesc}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
          {filteredItems.map((item) => {
            const Icon = getItemIcon(item.type);
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 hover:border-[#004741] transition-all flex flex-col justify-between shadow-sm space-y-2.5 sm:space-y-3 group min-w-0"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#004741]/10 dark:bg-[#004741]/30 text-[#004741] dark:text-[#6ee7b7] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 truncate max-w-[70%]">
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.subject}</span>
                    </span>

                    {item.marks && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold shrink-0">
                        {item.marks} Marks
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F0EDE4] line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-black/60 dark:text-[#F0EDE4]/60 line-clamp-3 leading-relaxed">
                    {item.content.replace(/[#*`]/g, '')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-black/40 dark:text-[#F0EDE4]/40">
                    {item.timestamp}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        soundManager.play('card_open');
                        setReadingItem(item);
                      }}
                      title="View Complete Answer"
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-[#F0EDE4]"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleCopy(item.id, item.content)}
                      title="Copy Answer"
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-[#F0EDE4]"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reader Modal */}
      {readingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl max-h-[88dvh] rounded-3xl bg-white dark:bg-[#0c1412] border border-black/20 dark:border-white/20 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#004741] dark:text-[#6ee7b7]">
                  {readingItem.subject} {readingItem.marks ? `• ${readingItem.marks} Marks` : ''}
                </span>
                <h3 className="text-xs sm:text-base font-bold text-black dark:text-[#F0EDE4] truncate">
                  {readingItem.title}
                </h3>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleCopy(readingItem.id, readingItem.content)}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-[#F0EDE4]"
                  title="Copy"
                >
                  {copiedId === readingItem.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    soundManager.play('button_click');
                    setReadingItem(null);
                  }}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-[#F0EDE4]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs sm:text-sm">
              <MarkdownRenderer content={readingItem.content} theme={theme} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
