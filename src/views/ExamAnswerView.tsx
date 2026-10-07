import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Printer,
  RotateCcw,
  GraduationCap,
  ShieldCheck,
  FileText,
  HelpCircle,
  BookOpen,
  Award,
  AlertCircle,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { api } from '../services/api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SubjectItem, SavedItem, AppLanguage, AppTheme, NavigationTab } from '../types';
import { translations } from '../services/i18n';
import { findSubjectByCodeOrName } from '../data/gtuBcaCurriculum';

interface ExamAnswerViewProps {
  language: AppLanguage;
  theme: AppTheme;
  subjects: SubjectItem[];
  initialSubject?: string;
  initialQuestion?: string;
  onSaveItem: (item: Omit<SavedItem, 'id' | 'timestamp'>) => void;
  onDeleteSavedItem?: (id: string) => void;
  savedItems?: SavedItem[];
  onNavigate?: (tab: NavigationTab, query?: string, subject?: string) => void;
}

// Helper: Extract high-weightage canonical GTU exam questions for the selected subject
function getCanonicalExamQuestionsForSubject(subjectNameOrCode: string): Array<{ q: string; marks: number }> {
  const matched = findSubjectByCodeOrName(subjectNameOrCode);
  if (!matched) return [];
  const list: Array<{ q: string; marks: number }> = [];
  for (const unit of matched.units) {
    for (const topic of unit.topics) {
      if (topic.examQuestions && topic.examQuestions.length > 0) {
        for (const eq of topic.examQuestions) {
          list.push({ q: eq.question, marks: eq.marks });
        }
      }
    }
  }
  return list.slice(0, 8);
}

// Helper: Get default question for a subject without hardcoded deadlock questions
function getDefaultQuestionForSubject(subjectName: string, passedQ?: string): string {
  if (passedQ && passedQ.trim()) return passedQ.trim();
  const sampleList = getCanonicalExamQuestionsForSubject(subjectName);
  if (sampleList.length > 0) return sampleList[0].q;
  return `Explain the core concepts, architecture, and practical applications of ${subjectName}.`;
}

export const ExamAnswerView: React.FC<ExamAnswerViewProps> = ({
  language,
  theme,
  subjects,
  initialSubject,
  initialQuestion,
  onSaveItem,
  onDeleteSavedItem,
  savedItems,
  onNavigate,
}) => {
  const t = translations[language];
  const isHi = language === 'hi';

  const marksOptions = [2, 3, 5, 7, 10, 15];

  const resolvedInitialSubject =
    initialSubject?.trim() || (subjects[0]?.name ?? 'Fundamental of Computer Organization');

  const [selectedSubject, setSelectedSubject] = useState(resolvedInitialSubject);
  const [customSubject, setCustomSubject] = useState('');
  const [question, setQuestion] = useState(() =>
    getDefaultQuestionForSubject(resolvedInitialSubject, initialQuestion)
  );
  const [selectedMarks, setSelectedMarks] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Curriculum match for the selected subject
  const activeSubjectName = customSubject.trim() || selectedSubject;
  const curriculumMatch = findSubjectByCodeOrName(activeSubjectName);

  // Dynamic sample questions for current subject
  const currentSampleQuestions = React.useMemo(() => {
    return getCanonicalExamQuestionsForSubject(activeSubjectName);
  }, [activeSubjectName]);

  // Sync when props change from navigation
  useEffect(() => {
    if (initialSubject && initialSubject.trim()) {
      const nextSubj = initialSubject.trim();
      setSelectedSubject(nextSubj);
      setCustomSubject('');
      if (initialQuestion && initialQuestion.trim()) {
        setQuestion(initialQuestion.trim());
      } else {
        setQuestion(getDefaultQuestionForSubject(nextSubj));
      }
      setGeneratedAnswer(null);
      setErrorMessage(null);
      setIsSaved(false);
    } else if (initialQuestion && initialQuestion.trim()) {
      setQuestion(initialQuestion.trim());
    }
  }, [initialSubject, initialQuestion]);

  // Handle subject change from dropdown
  const handleSubjectChange = (newSubject: string) => {
    soundManager.play('button_click');
    setSelectedSubject(newSubject);
    setCustomSubject('');
    const newDefaultQ = getDefaultQuestionForSubject(newSubject);
    setQuestion(newDefaultQ);
    const newSamples = getCanonicalExamQuestionsForSubject(newSubject);
    if (newSamples.length > 0 && newSamples[0].marks) {
      setSelectedMarks(newSamples[0].marks);
    }
    setGeneratedAnswer(null);
    setErrorMessage(null);
    setIsSaved(false);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || isLoading) return;

    soundManager.play('button_click');
    setIsLoading(true);
    setGeneratedAnswer(null);
    setErrorMessage(null);
    setIsSaved(false);

    const activeSubj = customSubject.trim() || selectedSubject;

    try {
      const res = await api.generateExamAnswer({
        subject: activeSubj,
        question: question.trim(),
        marks: selectedMarks,
        language,
      });

      if (!res || !res.answer) {
        throw new Error('Unable to generate examination answer right now. Please try again.');
      }

      setGeneratedAnswer(res.answer);
      soundManager.play('ai_response_ready');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate answer. Please try again.');
      setGeneratedAnswer(`### Error Generating Answer\n\n${err?.message || 'Unable to connect to service. Please retry.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedAnswer) return;
    soundManager.play('button_click');
    navigator.clipboard.writeText(generatedAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if answer is already saved in savedItems
  const existingSavedItem = React.useMemo(() => {
    if (!generatedAnswer || !savedItems) return null;
    return savedItems.find(
      (item) => item.content === generatedAnswer || (item.title.includes(question.slice(0, 30)) && item.type === 'exam_answer')
    );
  }, [generatedAnswer, savedItems, question]);

  const isAlreadySaved = isSaved || !!existingSavedItem;

  const handleSaveToggle = () => {
    if (!generatedAnswer) return;
    if (isAlreadySaved) {
      if (existingSavedItem && onDeleteSavedItem) {
        soundManager.play('delete');
        onDeleteSavedItem(existingSavedItem.id);
      }
      setIsSaved(false);
    } else {
      soundManager.play('save');
      onSaveItem({
        title: `${selectedMarks}M Answer: ${question.slice(0, 50)}...`,
        type: 'exam_answer',
        content: generatedAnswer,
        subject: customSubject.trim() || selectedSubject,
        marks: selectedMarks,
      });
      setIsSaved(true);
    }
  };

  const handlePrint = () => {
    soundManager.play('button_click');
    window.print();
  };

  // Group subjects by Semester
  const groupedSubjects = React.useMemo(() => {
    const map = new Map<number, SubjectItem[]>();
    for (const s of subjects) {
      const sem = s.semester || 1;
      if (!map.has(sem)) map.set(sem, []);
      map.get(sem)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [subjects]);

  // EMPTY STATE: If no subjects are available
  if (subjects.length === 0) {
    return (
      <div id="exam-empty-view" className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-8 w-full min-w-0">
        <div className="p-8 rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 mx-auto flex items-center justify-center text-[#004741] dark:text-[#38BDF8]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-black dark:text-[#F1F5F9]">
              {isHi ? 'कोई विषय उपलब्ध नहीं है' : 'No Subjects Available'}
            </h2>
            <p className="text-xs sm:text-sm text-black/60 dark:text-[#94A3B8] max-w-md mx-auto mt-1">
              {isHi
                ? 'परीक्षा उत्तर तैयार करने के लिए कृपया GTU BCA पाठ्यक्रम से एक विषय चुनें।'
                : 'Please navigate through the GTU BCA curriculum to choose a semester and subject.'}
            </p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('gtu_bca')}
              className="px-5 py-2.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-black transition-all"
            >
              {isHi ? 'GTU BCA पाठ्यक्रम देखें' : 'Explore GTU BCA Curriculum'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="exam-answer-view" className="space-y-5 sm:space-y-6 max-w-4xl mx-auto pb-24 md:pb-8 w-full min-w-0">
      {/* Title & Introduction */}
      <div className="border-b border-black/10 dark:border-[#263449] pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4] shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-black text-black dark:text-[#F1F5F9] tracking-tight leading-tight">
              {t.examHeader}
            </h1>
            <p className="text-xs sm:text-sm text-black/70 dark:text-[#94A3B8]">
              {t.examSub}
            </p>
          </div>
        </div>

        {curriculumMatch && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-[#004741]/10 text-[#004741] dark:text-[#38BDF8] text-[11px] font-bold">
              Sem {curriculumMatch.semester}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70 text-[11px] font-mono font-bold">
              {curriculumMatch.code}
            </span>
          </div>
        )}
      </div>

      {/* Main Generator Form */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-sm space-y-4 sm:space-y-5">
        {/* Subject & Marks Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-black dark:text-[#F1F5F9] uppercase tracking-wider mb-1.5 sm:mb-2">
              {t.selectSubject}
            </label>
            <div className="flex gap-2">
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl border border-black/15 dark:border-[#263449] bg-[#F0EDE4]/40 dark:bg-[#172033] text-black dark:text-[#F1F5F9] text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#004741]"
              >
                {groupedSubjects.map(([semNum, subjs]) => (
                  <optgroup key={semNum} label={`Semester ${semNum}`}>
                    {subjs.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.code ? `${s.code} - ${s.name}` : s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="custom">-- Custom Subject --</option>
              </select>
            </div>
            {selectedSubject === 'custom' && (
              <input
                type="text"
                placeholder="Type custom subject name..."
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="mt-2 w-full py-2 px-3 rounded-xl border border-black/15 dark:border-[#263449] bg-white dark:bg-[#111827] text-black dark:text-[#F1F5F9] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#004741]"
              />
            )}
          </div>

          {/* Marks Selector */}
          <div>
            <label className="block text-xs font-bold text-black dark:text-[#F1F5F9] uppercase tracking-wider mb-1.5 sm:mb-2">
              {t.marksLabel}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {marksOptions.map((marks) => {
                const isSelected = selectedMarks === marks;
                return (
                  <button
                    key={marks}
                    type="button"
                    onClick={() => {
                      soundManager.play('button_click');
                      setSelectedMarks(marks);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[#004741] text-[#F0EDE4] border-[#004741] shadow-sm scale-102'
                        : 'bg-black/5 dark:bg-white/5 text-black dark:text-[#F1F5F9] border-black/10 dark:border-[#263449] hover:border-[#004741]'
                    }`}
                  >
                    {marks}M
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Question Textarea */}
        <div>
          <label className="block text-xs font-bold text-black dark:text-[#F1F5F9] uppercase tracking-wider mb-1.5 sm:mb-2">
            {t.enterQuestion}
          </label>
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Type university exam question for ${activeSubjectName}...`}
            className="w-full p-3 sm:p-3.5 rounded-2xl border border-black/15 dark:border-[#263449] bg-[#F0EDE4]/30 dark:bg-[#172033] text-black dark:text-[#F1F5F9] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#004741] leading-relaxed"
          />
        </div>

        {/* Dynamic GTU Exam Question Chips for Selected Subject */}
        {currentSampleQuestions.length > 0 && (
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-black/60 dark:text-[#94A3B8] block mb-1.5">
              {isHi
                ? `${activeSubjectName} के महत्वपूर्ण GTU परीक्षा प्रश्न:`
                : `Verified High-Weightage GTU Exam Questions for ${activeSubjectName}:`}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentSampleQuestions.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    soundManager.play('button_click');
                    setQuestion(sample.q);
                    setSelectedMarks(sample.marks);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#004741]/10 text-black dark:text-[#F1F5F9] text-[11px] sm:text-xs font-medium border border-black/10 dark:border-[#263449] active:scale-95 transition-all text-left truncate max-w-full"
                  title={sample.q}
                >
                  <span className="font-bold text-[#004741] dark:text-[#38BDF8] mr-1">
                    {sample.marks}M:
                  </span>
                  <span>{sample.q.slice(0, 48)}...</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">{errorMessage}</p>
              <button
                type="button"
                onClick={() => handleGenerate()}
                className="mt-2 px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
              >
                {isHi ? 'पुनः प्रयास करें (Retry)' : 'Retry Generation'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold px-2 py-1 rounded-lg hover:bg-rose-500/20 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Submit button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-black/60 dark:text-[#94A3B8]">
            <ShieldCheck className="w-4 h-4 text-[#004741] dark:text-[#38BDF8] shrink-0" />
            <span>Includes formal structure, diagrams & examiner scoring criteria</span>
          </div>

          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={!question.trim() || isLoading}
            className="w-full sm:w-auto py-2.5 sm:py-3 px-5 sm:px-6 rounded-2xl bg-[#004741] text-[#F0EDE4] font-bold text-xs sm:text-sm hover:bg-black transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#F0EDE4] border-t-transparent rounded-full animate-spin" />
                <span>Generating {selectedMarks}-Mark Answer...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.generateExamBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Answer Display */}
      {generatedAnswer && (
        <div className="p-4 sm:p-7 rounded-3xl bg-white dark:bg-[#172033] border-2 border-[#004741]/20 shadow-md space-y-4 relative w-full overflow-hidden">
          {/* Header of Answer Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-black/10 dark:border-[#263449]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold uppercase tracking-wider">
                {selectedMarks} Marks Solution
              </span>
              <span className="text-xs font-bold text-black/70 dark:text-[#94A3B8]">
                {activeSubjectName}
              </span>
              {curriculumMatch && (
                <span className="text-[11px] font-mono text-black/50 dark:text-white/50">
                  [{curriculumMatch.code}]
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                title="Copy Answer"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-black/15 dark:border-[#263449] hover:bg-black/5 dark:hover:bg-[#1E293B] text-black dark:text-[#F1F5F9] text-xs font-bold transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.copied : t.copyAnswer}</span>
              </button>

              <button
                onClick={handleSaveToggle}
                title={isAlreadySaved ? 'Remove from Saved Library' : 'Save Solution to Library'}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  isAlreadySaved
                    ? 'bg-[#004741] text-[#F0EDE4] hover:bg-[#003833]'
                    : 'bg-black/5 dark:bg-white/10 hover:bg-[#004741] hover:text-[#F0EDE4] text-black dark:text-[#F1F5F9]'
                }`}
              >
                {isAlreadySaved ? (
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                <span>{isAlreadySaved ? (isHi ? 'सहेजा गया' : 'Saved') : (isHi ? 'सहेजें' : 'Save Answer')}</span>
              </button>

              <button
                onClick={handlePrint}
                title="Print Answer"
                className="p-1.5 sm:p-2 rounded-xl border border-black/15 dark:border-[#263449] hover:bg-black/5 dark:hover:bg-[#1E293B] text-black dark:text-[#F1F5F9] transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Answer Body */}
          <div className="pt-2">
            <MarkdownRenderer content={generatedAnswer} theme={theme} />
          </div>

          {/* Bottom Actions */}
          {onNavigate && (
            <div className="pt-4 border-t border-black/10 dark:border-[#263449] flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-xs text-black/60 dark:text-white/60">
                {isHi ? 'संबंधित अध्ययन विकल्प:' : 'Related Academic Actions:'}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onNavigate('quiz', undefined, activeSubjectName)}
                  className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-black dark:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Award className="w-3.5 h-3.5 text-[#004741] dark:text-[#38BDF8]" />
                  <span>{isHi ? 'इस विषय के MCQs अभ्यास करें' : 'Practice MCQs for Subject'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('gtu_bca', undefined, activeSubjectName)}
                  className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-black dark:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#004741] dark:text-[#38BDF8]" />
                  <span>{isHi ? 'GTU BCA विषय पर जाएं' : 'View in GTU BCA'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

