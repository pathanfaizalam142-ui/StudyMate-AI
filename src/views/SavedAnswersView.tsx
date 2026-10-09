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
  Printer,
  Sparkles,
  BookOpen,
  Award,
  ArrowRight,
  GraduationCap,
  RotateCcw,
  User,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SavedItem, AppLanguage, AppTheme, NavigationTab } from '../types';
import { translations } from '../services/i18n';

interface SavedAnswersViewProps {
  language: AppLanguage;
  theme: AppTheme;
  savedItems: SavedItem[];
  onDeleteSavedItem: (id: string) => void;
  onClearAllSaved: () => void;
  onNavigate?: (tab: NavigationTab, query?: string, subject?: string) => void;
}

export const SavedAnswersView: React.FC<SavedAnswersViewProps> = ({
  language,
  theme,
  savedItems,
  onDeleteSavedItem,
  onClearAllSaved,
  onNavigate,
}) => {
  const t = translations[language];
  const isHi = language === 'hi';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [readingItem, setReadingItem] = useState<SavedItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

  // Category counts
  const examCount = savedItems.filter((i) => i.type === 'exam_answer').length;
  const aiCount = savedItems.filter((i) => i.type === 'ai_answer').length;
  const notesCount = savedItems.filter((i) => i.type === 'note').length;
  const quizCount = savedItems.filter((i) => i.type === 'quiz').length;

  const filteredItems = savedItems.filter((item) => {
    const matchesFilter = filterType === 'all' || item.type === filterType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    soundManager.play('button_click');
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    soundManager.play('delete');
    onDeleteSavedItem(id);
    if (readingItem?.id === id) {
      setReadingItem(null);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'exam_answer':
        return FileCheck2;
      case 'note':
        return FileText;
      case 'quiz':
        return Award;
      default:
        return MessageSquare;
    }
  };

  const getItemTypeBadge = (item: SavedItem) => {
    switch (item.type) {
      case 'exam_answer':
        return {
          label: item.marks ? `${item.marks}M Exam Answer` : (isHi ? 'परीक्षा उत्तर' : 'Exam Answer'),
          color: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20',
        };
      case 'note':
        return {
          label: isHi ? 'अध्ययन नोट्स' : 'Study Note',
          color: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20',
        };
      case 'quiz':
        return {
          label: isHi ? 'क्विज समीक्षा' : 'Quiz Review',
          color: 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/20',
        };
      default:
        return {
          label: isHi ? 'AI समाधान' : 'AI Explanation',
          color: 'bg-[#004741]/10 text-[#004741] dark:text-[#38BDF8] border-[#004741]/20',
        };
    }
  };

  return (
    <div id="saved-answers-view" className="space-y-5 sm:space-y-6 max-w-4xl mx-auto pb-20 md:pb-8 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-black/10 dark:border-[#263449] pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4] shrink-0 shadow-xs">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-display font-black text-black dark:text-[#F1F5F9] tracking-tight leading-tight">
                {t.savedHeader || 'Saved Library'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#004741]/10 text-[#004741] dark:text-[#38BDF8]">
                {savedItems.length}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-black/70 dark:text-[#94A3B8]">
              {t.savedSub || 'Access bookmarked exam solutions, AI explanations, and study notes'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {onNavigate && (
            <button
              onClick={() => {
                soundManager.play('button_click');
                onNavigate('profile');
              }}
              title="View Account Profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/15 dark:border-[#263449] bg-white/70 dark:bg-[#172033] hover:border-[#004741] text-black dark:text-[#F1F5F9] text-xs font-semibold transition-all active:scale-95"
            >
              <User className="w-3.5 h-3.5 text-[#004741] dark:text-[#38BDF8]" />
              <span>{isHi ? 'खाता प्रोफ़ाइल' : 'Account'}</span>
            </button>
          )}

          {savedItems.length > 0 && (
            isConfirmingClearAll ? (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold px-1">
                  {isHi ? 'सभी हटाएं?' : 'Clear all?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('delete');
                    setIsConfirmingClearAll(false);
                    onClearAllSaved();
                  }}
                  className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition-colors shadow-xs"
                >
                  {isHi ? 'हाँ' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClearAll(false)}
                  className="px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 text-black dark:text-[#F1F5F9] text-[11px] font-semibold hover:bg-black/15 transition-colors"
                >
                  {isHi ? 'रद्द' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClearAll(true)}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                {t.clearAll || (isHi ? 'सभी साफ़ करें' : 'Clear All')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-black/40 dark:text-[#94A3B8]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchSaved || (isHi ? 'सहेजे गए उत्तर खोजें...' : 'Search saved solutions, topics, subjects...')}
            className="w-full pl-9 pr-8 py-2 sm:py-2.5 rounded-xl border border-black/15 dark:border-[#263449] bg-white dark:bg-[#172033] text-xs focus:outline-none focus:ring-1 focus:ring-[#004741] text-black dark:text-[#F1F5F9]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#94A3B8] hover:text-black dark:hover:text-[#F1F5F9] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills with Counts */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'all', label: t.filterAll || 'All Items', count: savedItems.length },
            { id: 'exam_answer', label: t.filterExam || 'Exam Answers', count: examCount },
            { id: 'ai_answer', label: t.filterAI || 'AI Answers', count: aiCount },
            { id: 'note', label: t.filterNotes || 'Notes', count: notesCount },
            ...(quizCount > 0 ? [{ id: 'quiz', label: t.filterQuiz || 'Quizzes', count: quizCount }] : []),
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => {
                soundManager.play('button_click');
                setFilterType(pill.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                filterType === pill.id
                  ? 'bg-[#004741] text-[#F0EDE4] border-[#004741] shadow-xs'
                  : 'bg-white/70 dark:bg-[#172033] text-black dark:text-[#F1F5F9] border-black/10 dark:border-[#263449] hover:border-[#004741]/40'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filterType === pill.id
                    ? 'bg-white/20 text-[#F0EDE4]'
                    : 'bg-black/10 dark:bg-white/10 text-black/70 dark:text-[#94A3B8]'
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {savedItems.length === 0 ? (
        /* Empty State A: Nothing in Library at all */
        <div className="p-6 sm:p-10 text-center rounded-3xl bg-white/70 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#004741]/10 dark:bg-[#004741]/30 text-[#004741] dark:text-[#38BDF8] flex items-center justify-center mx-auto">
            <Bookmark className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-black dark:text-[#F1F5F9]">
              {t.noSavedTitle || (isHi ? 'कोई सहेजी गई सामग्री नहीं है' : 'Your Saved Library is Empty')}
            </h3>
            <p className="text-xs sm:text-sm text-black/60 dark:text-[#94A3B8] leading-relaxed">
              {t.noSavedDesc ||
                (isHi
                  ? 'परीक्षा उत्तर जनरेटर, AI से पूछें या दस्तावेज़ विश्लेषक से महत्वपूर्ण उत्तर बुकमार्क करें ताकि आप उन्हें कभी भी दोहरा सकें।'
                  : 'Bookmark important exam solutions, AI explanations, and study notes to revise them quickly anytime.')}
            </p>
          </div>

          {/* Useful Existing Actions */}
          {onNavigate && (
            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-black/40 dark:text-[#94A3B8]/70 mb-3">
                {isHi ? 'सामग्री जनरेट करने के लिए त्वरित क्रियाएं:' : 'Start studying & save your first item:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto text-left">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('button_click');
                    onNavigate('ask_ai');
                  }}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#172033] border border-black/10 dark:border-[#263449] hover:border-[#004741] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#004741]/10 text-[#004741] dark:text-[#38BDF8] group-hover:bg-[#004741] group-hover:text-[#F0EDE4] transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black dark:text-[#F1F5F9]">
                        {isHi ? 'AI से पूछें' : 'Ask AI'}
                      </div>
                      <div className="text-[10px] text-black/50 dark:text-[#94A3B8]">
                        {isHi ? 'त्वरित अवधारणा स्पष्टीकरण' : 'Get fast concept explanations'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-[#004741] dark:group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('button_click');
                    onNavigate('exam_mode');
                  }}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#172033] border border-black/10 dark:border-[#263449] hover:border-[#004741] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 group-hover:bg-[#004741] group-hover:text-[#F0EDE4] transition-colors">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black dark:text-[#F1F5F9]">
                        {isHi ? 'परीक्षा उत्तर जनरेटर' : 'Exam Answer Generator'}
                      </div>
                      <div className="text-[10px] text-black/50 dark:text-[#94A3B8]">
                        {isHi ? 'GTU 3, 5, 7 अंक संरचित उत्तर' : '3, 5 & 7 Mark model answers'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-[#004741] dark:group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('button_click');
                    onNavigate('quiz');
                  }}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#172033] border border-black/10 dark:border-[#263449] hover:border-[#004741] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 group-hover:bg-[#004741] group-hover:text-[#F0EDE4] transition-colors">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black dark:text-[#F1F5F9]">
                        {isHi ? 'MCQ अभ्यास' : 'Practice MCQs'}
                      </div>
                      <div className="text-[10px] text-black/50 dark:text-[#94A3B8]">
                        {isHi ? 'पाठ्यक्रम आधारित प्रश्नोत्तरी' : 'Curriculum-aligned question banks'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-[#004741] dark:group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('button_click');
                    onNavigate('gtu_bca');
                  }}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#172033] border border-black/10 dark:border-[#263449] hover:border-[#004741] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 group-hover:bg-[#004741] group-hover:text-[#F0EDE4] transition-colors">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black dark:text-[#F1F5F9]">
                        {isHi ? 'GTU BCA पाठ्यक्रम' : 'GTU BCA Curriculum'}
                      </div>
                      <div className="text-[10px] text-black/50 dark:text-[#94A3B8]">
                        {isHi ? 'सभी 6 सेमेस्टर और विषय' : 'Explore Sem 1 to 6 syllabi'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-[#004741] dark:group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State B: Search/Filter returned 0 items */
        <div className="p-8 sm:p-10 text-center rounded-3xl bg-white/60 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-3">
          <Search className="w-8 h-8 text-black/30 dark:text-[#94A3B8]/50 mx-auto" />
          <h3 className="text-sm font-bold text-black dark:text-[#F1F5F9]">
            {t.noMatchesTitle || (isHi ? 'कोई मेल खाने वाला आइटम नहीं मिला' : 'No Matching Saved Items')}
          </h3>
          <p className="text-xs text-black/60 dark:text-[#94A3B8] max-w-sm mx-auto">
            {t.noMatchesDesc ||
              (isHi
                ? 'भिन्न खोज शब्दों का प्रयोग करें या श्रेणी फ़िल्टर बदलें।'
                : 'Try adjusting your search query or switching categories.')}
          </p>
          <button
            onClick={() => {
              soundManager.play('button_click');
              setSearchQuery('');
              setFilterType('all');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-[#003833] transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.clearFilters || (isHi ? 'फ़िल्टर हटाएं' : 'Clear Filters')}</span>
          </button>
        </div>
      ) : (
        /* Success State: Saved Items Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
          {filteredItems.map((item) => {
            const Icon = getItemIcon(item.type);
            const isCopied = copiedId === item.id;
            const badge = getItemTypeBadge(item);

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] hover:border-[#004741] transition-all flex flex-col justify-between shadow-xs hover:shadow-md space-y-3 group min-w-0"
              >
                <div className="space-y-2.5 min-w-0">
                  {/* Category / Subject Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#004741]/10 dark:bg-[#004741]/30 text-[#004741] dark:text-[#38BDF8] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 truncate max-w-[65%]">
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.subject}</span>
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F1F5F9] line-clamp-2 leading-snug group-hover:text-[#004741] dark:group-hover:text-[#38BDF8] transition-colors">
                    {item.title}
                  </h3>

                  {/* Content Preview */}
                  <p className="text-xs text-black/60 dark:text-[#94A3B8] line-clamp-3 leading-relaxed">
                    {item.content.replace(/[#*`$\\]/g, '')}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-black/5 dark:border-[#263449]/60">
                  <span className="text-[10px] text-black/40 dark:text-[#94A3B8]/70 font-mono">
                    {item.timestamp}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        soundManager.play('card_open');
                        setReadingItem(item);
                      }}
                      title={isHi ? 'पूरा उत्तर देखें' : 'View Complete Content'}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#004741]/10 text-[#004741] dark:text-[#38BDF8] text-[11px] font-bold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isHi ? 'पढ़ें' : 'Read'}</span>
                    </button>

                    <button
                      onClick={() => handleCopy(item.id, item.content)}
                      title={isHi ? 'कॉपी करें' : 'Copy Content'}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-[#1E293B] text-black/70 dark:text-[#94A3B8] transition-colors"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      title={isHi ? 'लाइब्रेरी से हटाएं' : 'Remove from Library'}
                      aria-label={isHi ? 'लाइब्रेरी से हटाएं' : 'Remove from Library'}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-[#F87171] dark:hover:bg-[#F87171]/15 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
          <div className="w-full max-w-2xl max-h-[88dvh] rounded-3xl bg-white dark:bg-[#172033] border border-black/20 dark:border-[#263449] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-5 border-b border-black/10 dark:border-[#263449] flex items-center justify-between gap-2.5 bg-black/[0.02] dark:bg-[#172033]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#004741] dark:text-[#38BDF8]">
                    {readingItem.subject}
                  </span>
                  {readingItem.marks && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      {readingItem.marks} Marks
                    </span>
                  )}
                  <span className="text-[10px] text-black/40 dark:text-[#94A3B8]/70 font-mono">
                    • {readingItem.timestamp}
                  </span>
                </div>
                <h3 className="text-xs sm:text-base font-bold text-black dark:text-[#F1F5F9] truncate">
                  {readingItem.title}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    soundManager.play('button_click');
                    window.print();
                  }}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-[#1E293B] text-black dark:text-[#F1F5F9]"
                  title={isHi ? 'प्रिंट करें' : 'Print'}
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCopy(readingItem.id, readingItem.content)}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-[#1E293B] text-black dark:text-[#F1F5F9]"
                  title={isHi ? 'कॉपी करें' : 'Copy'}
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
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-[#1E293B] text-black dark:text-[#F1F5F9]"
                  title={isHi ? 'बंद करें' : 'Close'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs sm:text-sm">
              <MarkdownRenderer content={readingItem.content} theme={theme} />
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-black/10 dark:border-[#263449] bg-black/[0.02] dark:bg-[#172033] flex items-center justify-between text-xs">
              <span className="text-black/50 dark:text-[#94A3B8] text-[11px]">
                ID: {readingItem.id}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  handleDelete(readingItem.id, e);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 dark:text-[#F87171] hover:bg-rose-500/10 dark:hover:bg-[#F87171]/15 font-semibold text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isHi ? 'लाइब्रेरी से हटाएं' : 'Remove from Library'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
