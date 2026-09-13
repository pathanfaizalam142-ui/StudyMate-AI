import React, { useState } from 'react';
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
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { api } from '../services/api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SubjectItem, SavedItem, AppLanguage, AppTheme } from '../types';
import { translations } from '../services/i18n';

interface ExamAnswerViewProps {
  language: AppLanguage;
  theme: AppTheme;
  subjects: SubjectItem[];
  initialSubject?: string;
  onSaveItem: (item: Omit<SavedItem, 'id' | 'timestamp'>) => void;
}

export const ExamAnswerView: React.FC<ExamAnswerViewProps> = ({
  language,
  theme,
  subjects,
  initialSubject,
  onSaveItem,
}) => {
  const t = translations[language];

  const marksOptions = [2, 3, 5, 7, 10, 15];

  const [selectedSubject, setSelectedSubject] = useState(
    initialSubject || (subjects[0]?.name ?? 'Operating System')
  );
  const [customSubject, setCustomSubject] = useState('');
  const [question, setQuestion] = useState(
    'Explain Deadlock in Operating Systems. What are the four necessary Coffman conditions? How is it prevented?'
  );
  const [selectedMarks, setSelectedMarks] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const sampleExamQuestions = [
    {
      subject: 'Operating System',
      marks: 10,
      q: 'Explain Deadlock in Operating Systems. What are the four necessary Coffman conditions? How is it prevented?',
    },
    {
      subject: 'Computer Networks',
      marks: 7,
      q: 'Differentiate between TCP and UDP protocols with packet headers and state diagrams.',
    },
    {
      subject: 'Java',
      marks: 5,
      q: 'What is Polymorphism in Java? Explain Compile-time vs Runtime Polymorphism with code examples.',
    },
    {
      subject: 'Mathematics',
      marks: 5,
      q: 'State and prove Bayes Theorem with a practical engineering conditional probability example.',
    },
    {
      subject: 'Web Development',
      marks: 10,
      q: 'Explain the Virtual DOM reconciliation algorithm in modern frontend frameworks.',
    },
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || isLoading) return;

    soundManager.play('button_click');
    setIsLoading(true);
    setGeneratedAnswer(null);
    setIsSaved(false);

    const activeSubj = customSubject.trim() || selectedSubject;

    try {
      const res = await api.generateExamAnswer({
        subject: activeSubj,
        question: question.trim(),
        marks: selectedMarks,
        language,
      });

      setGeneratedAnswer(res.answer);
      soundManager.play('ai_response_ready');
    } catch (err: any) {
      setGeneratedAnswer(`### Error Generating Answer\n\n${err.message}`);
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

  const handleSave = () => {
    if (!generatedAnswer) return;
    soundManager.play('save');
    onSaveItem({
      title: `${selectedMarks}M Answer: ${question.slice(0, 50)}...`,
      type: 'exam_answer',
      content: generatedAnswer,
      subject: customSubject.trim() || selectedSubject,
      marks: selectedMarks,
    });
    setIsSaved(true);
  };

  const handlePrint = () => {
    soundManager.play('button_click');
    window.print();
  };

  return (
    <div id="exam-answer-view" className="space-y-5 sm:space-y-6 max-w-4xl mx-auto pb-20 md:pb-8 w-full min-w-0">
      {/* Title & Introduction */}
      <div className="border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4] shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-black text-black dark:text-[#F0EDE4] tracking-tight leading-tight">
              {t.examHeader}
            </h1>
            <p className="text-xs sm:text-sm text-black/70 dark:text-[#F0EDE4]/70">
              {t.examSub}
            </p>
          </div>
        </div>
      </div>

      {/* Main Generator Form */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 shadow-sm space-y-4 sm:space-y-5">
        {/* Subject & Marks Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider mb-1.5 sm:mb-2">
              {t.selectSubject}
            </label>
            <div className="flex gap-2">
              <select
                value={selectedSubject}
                onChange={(e) => {
                  soundManager.play('button_click');
                  setSelectedSubject(e.target.value);
                  setCustomSubject('');
                }}
                className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#F0EDE4]/40 dark:bg-black/30 text-black dark:text-[#F0EDE4] text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#004741]"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
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
                className="mt-2 w-full py-2 px-3 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/50 text-black dark:text-[#F0EDE4] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#004741]"
              />
            )}
          </div>

          {/* Marks Selector */}
          <div>
            <label className="block text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider mb-1.5 sm:mb-2">
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
                        : 'bg-black/5 dark:bg-white/5 text-black dark:text-[#F0EDE4] border-black/10 dark:border-white/10 hover:border-[#004741]'
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
          <label className="block text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider mb-1.5 sm:mb-2">
            {t.enterQuestion}
          </label>
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your exam question here..."
            className="w-full p-3 sm:p-3.5 rounded-2xl border border-black/15 dark:border-white/15 bg-[#F0EDE4]/30 dark:bg-black/30 text-black dark:text-[#F0EDE4] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#004741] leading-relaxed"
          />
        </div>

        {/* Quick Sample Questions Chips */}
        <div>
          <span className="text-[11px] sm:text-xs font-semibold text-black/60 dark:text-[#F0EDE4]/60 block mb-1.5">
            {language === 'hi' ? 'परीक्षा उदाहरण प्रश्न:' : 'Common University Exam Questions:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleExamQuestions.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  soundManager.play('button_click');
                  setQuestion(sample.q);
                  setSelectedSubject(sample.subject);
                  setSelectedMarks(sample.marks);
                }}
                className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 hover:bg-[#004741]/10 text-black dark:text-[#F0EDE4] text-[11px] sm:text-xs font-medium border border-black/10 dark:border-white/10 active:scale-95 transition-all text-left truncate max-w-full"
              >
                {sample.marks}M: {sample.q.slice(0, 32)}...
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-black/60 dark:text-[#F0EDE4]/60">
            <ShieldCheck className="w-4 h-4 text-[#004741] dark:text-[#6ee7b7] shrink-0" />
            <span>Includes formal structure, diagrams & scoring tips</span>
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
        <div className="p-4 sm:p-7 rounded-3xl bg-white dark:bg-[#0c1412] border-2 border-[#004741]/20 shadow-md space-y-4 relative w-full overflow-hidden">
          {/* Header of Answer Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold uppercase tracking-wider">
                {selectedMarks} Marks Solution
              </span>
              <span className="text-xs font-bold text-black/70 dark:text-[#F0EDE4]/70">
                {selectedSubject}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                title="Copy Answer"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-[#F0EDE4] text-xs font-bold transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.copied : t.copyAnswer}</span>
              </button>

              <button
                onClick={handleSave}
                title="Save Solution"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-black transition-all active:scale-95"
              >
                {isSaved ? (
                  <BookmarkCheck className="w-3.5 h-3.5" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                <span>{isSaved ? t.saved : t.saveAnswer}</span>
              </button>

              <button
                onClick={handlePrint}
                title="Print Answer"
                className="p-1.5 sm:p-2 rounded-xl border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-[#F0EDE4] transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Answer Body */}
          <div className="pt-2">
            <MarkdownRenderer content={generatedAnswer} theme={theme} />
          </div>
        </div>
      )}
    </div>
  );
};
