import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Trophy,
  Target,
  Percent,
  Check,
  X,
  HelpCircle,
  AlertCircle,
  GraduationCap,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { api } from '../services/api';
import {
  QuizQuestion,
  QuizResult,
  SubjectItem,
  AppLanguage,
  AppTheme,
  NavigationTab,
} from '../types';
import { translations } from '../services/i18n';
import { findSubjectByCodeOrName, GTU_BCA_CURRICULUM } from '../data/gtuBcaCurriculum';

interface QuizViewProps {
  language: AppLanguage;
  theme: AppTheme;
  subjects: SubjectItem[];
  initialSubject?: string;
  initialTopic?: string;
  onQuizCompleted: (result: QuizResult) => void;
  onNavigate?: (tab: NavigationTab, query?: string, subject?: string) => void;
}

// Helper: Extract authoritative primary topic for a given subject
function getAuthoritativeSubjectTopic(subjectNameOrCode: string): string {
  const matched = findSubjectByCodeOrName(subjectNameOrCode);
  if (matched && matched.units && matched.units.length > 0) {
    const firstUnit = matched.units[0];
    if (firstUnit.topics && firstUnit.topics.length > 0) {
      return firstUnit.topics[0].title;
    }
    return firstUnit.unitName;
  }
  return 'Core Concepts & Syllabus';
}

export const QuizView: React.FC<QuizViewProps> = ({
  language,
  theme,
  subjects,
  initialSubject,
  initialTopic,
  onQuizCompleted,
  onNavigate,
}) => {
  const t = translations[language];
  const isHi = language === 'hi';

  // Modes: 'setup' | 'active' | 'review'
  const [mode, setMode] = useState<'setup' | 'active' | 'review'>('setup');

  // Initial subject determination: Pick initialSubject, or first available subject, or canonical BCA101
  const resolvedInitialSubject =
    initialSubject?.trim() || subjects[0]?.name || 'Fundamental of Computer Organization';

  // Setup options
  const [selectedSubject, setSelectedSubject] = useState(resolvedInitialSubject);
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<number | 'all'>('all');
  const [topic, setTopic] = useState<string>(() => {
    if (initialTopic && initialTopic.trim()) {
      return initialTopic.trim();
    }
    return getAuthoritativeSubjectTopic(resolvedInitialSubject);
  });
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);

  // Completed result
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);

  // Current subject curriculum details
  const curriculumMatch = findSubjectByCodeOrName(selectedSubject);

  // Synchronize when initialSubject or initialTopic props change from navigation
  useEffect(() => {
    if (initialSubject && initialSubject.trim()) {
      const nextSubject = initialSubject.trim();
      setSelectedSubject(nextSubject);

      // Determine topic: use passed initialTopic, or authoritative curriculum topic
      if (initialTopic && initialTopic.trim()) {
        setTopic(initialTopic.trim());
      } else {
        setTopic(getAuthoritativeSubjectTopic(nextSubject));
      }

      setSelectedUnitNumber('all');
      setQuestions([]);
      setUserAnswers([]);
      setCurrentIndex(0);
      setMode('setup');
      setErrorMessage(null);
    }
  }, [initialSubject, initialTopic]);

  // Handler for user changing subject in setup dropdown
  const handleSubjectChange = (newSubjectName: string) => {
    soundManager.play('button_click');
    setSelectedSubject(newSubjectName);
    setSelectedUnitNumber('all');

    // Dynamic topic resolution: Always set to the selected subject's real primary topic
    // NEVER retain previous subject's topic!
    const subjectTopic = getAuthoritativeSubjectTopic(newSubjectName);
    setTopic(subjectTopic);

    // Stale Quiz Protection: Clear questions, answers, error, and return to clean setup state
    setQuestions([]);
    setUserAnswers([]);
    setCurrentIndex(0);
    setErrorMessage(null);
    setIsFallbackMode(false);
    setFallbackNote(null);
  };

  // Handler for changing unit filter in setup
  const handleUnitChange = (val: string) => {
    soundManager.play('button_click');
    if (val === 'all') {
      setSelectedUnitNumber('all');
      setTopic(getAuthoritativeSubjectTopic(selectedSubject));
    } else {
      const unitNum = Number(val);
      setSelectedUnitNumber(unitNum);
      const unitObj = curriculumMatch?.units?.find((u) => u.unitNumber === unitNum);
      if (unitObj) {
        const primaryTopic = unitObj.topics?.[0]?.title || unitObj.unitName;
        setTopic(primaryTopic);
      }
    }
  };

  const startQuizGeneration = async () => {
    soundManager.play('button_click');
    setErrorMessage(null);
    setIsFallbackMode(false);
    setFallbackNote(null);
    setIsLoading(true);

    // Clear stale questions and user answers immediately so old ones never show while loading
    setQuestions([]);
    setUserAnswers([]);
    setCurrentIndex(0);

    // Resolve authoritative curriculum metadata for current selection
    const subjectCode = curriculumMatch?.code;
    const semester = curriculumMatch?.semester;
    const selectedUnitObj =
      typeof selectedUnitNumber === 'number'
        ? curriculumMatch?.units?.find((u) => u.unitNumber === selectedUnitNumber)
        : undefined;
    const unitName = selectedUnitObj?.unitName;

    // Validate that topic is not empty
    const activeTopic = topic.trim() || getAuthoritativeSubjectTopic(selectedSubject);

    try {
      const res = await api.generateQuiz({
        subject: selectedSubject,
        subjectCode,
        semester,
        unit: unitName,
        topic: activeTopic,
        questionCount,
        difficulty,
        language,
      });

      // Validate Gemini response structure
      if (!res || !Array.isArray(res.questions) || res.questions.length === 0) {
        throw new Error('Unable to generate quiz right now. Please try again.');
      }

      // Strictly validate questions according to requirements
      const validated: QuizQuestion[] = [];
      for (let i = 0; i < res.questions.length; i++) {
        const q = res.questions[i];
        if (!q || typeof q !== 'object') {
          throw new Error('Invalid question format received. Please try again.');
        }
        if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
          throw new Error(`Question #${i + 1} is missing question text. Please try again.`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Question #${i + 1} does not have exactly 4 options. Please try again.`);
        }

        const validOptions = q.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0);
        if (!validOptions) {
          throw new Error(`Question #${i + 1} contains empty options. Please try again.`);
        }

        let correctIdx = 0;
        if (typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3) {
          correctIdx = Math.floor(q.correctAnswer);
        } else if (typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3) {
          correctIdx = Math.floor(q.correctAnswerIndex);
        }

        validated.push({
          question: q.question.trim(),
          options: q.options.map((opt) => String(opt).trim()),
          correctAnswer: correctIdx,
          correctAnswerIndex: correctIdx,
          explanation:
            typeof q.explanation === 'string' && q.explanation.trim()
              ? q.explanation.trim()
              : `Option ${String.fromCharCode(65 + correctIdx)} is the correct answer.`,
        });
      }

      // Strictly deduplicate questions on client as a defense-in-depth guarantee
      const uniqueValidated: QuizQuestion[] = [];
      const seenTexts = new Set<string>();
      for (const item of validated) {
        const norm = (item.question || '').toLowerCase().replace(/[^\w\u0900-\u097F]/g, '').trim();
        if (!norm || seenTexts.has(norm)) continue;
        seenTexts.add(norm);
        uniqueValidated.push(item);
      }

      if (uniqueValidated.length === 0) {
        throw new Error('Unable to generate quiz right now. Please try again.');
      }

      setQuestions(uniqueValidated);
      setIsFallbackMode(Boolean(res.isFallback));
      setFallbackNote(res.note || null);
      setUserAnswers(new Array(uniqueValidated.length).fill(null));
      setCurrentIndex(0);
      setMode('active');
      soundManager.play('card_open');
    } catch (err: any) {
      console.error('Quiz generation failed:', err);
      setErrorMessage(err?.message || 'Unable to generate quiz right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    const currentQ = questions[currentIndex];
    const correctIdx = currentQ.correctAnswer !== undefined ? currentQ.correctAnswer : currentQ.correctAnswerIndex;
    const isCorrect = optionIndex === correctIdx;

    if (isCorrect) {
      soundManager.play('correct_quiz');
    } else {
      soundManager.play('wrong_quiz');
    }

    const updated = [...userAnswers];
    updated[currentIndex] = optionIndex;
    setUserAnswers(updated);
  };

  const handleNext = () => {
    soundManager.play('button_click');
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    soundManager.play('button_click');
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    soundManager.play('quiz_completed');

    // Calculate score
    let score = 0;
    questions.forEach((q, idx) => {
      const correct = q.correctAnswer !== undefined ? q.correctAnswer : q.correctAnswerIndex;
      if (userAnswers[idx] === correct) {
        score++;
      }
    });

    const percentage = Math.round((score / questions.length) * 100);

    const result: QuizResult = {
      id: `quiz-${Date.now()}`,
      subject: selectedSubject,
      topic: topic || 'General Topics',
      difficulty,
      score,
      total: questions.length,
      percentage,
      timestamp: new Date().toLocaleDateString(),
      questions,
      userAnswers,
    };

    setLastResult(result);
    onQuizCompleted(result);
    setMode('review');

    // Celebrate if score >= 70%
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#004741', '#F0EDE4', '#000000'],
        });
      } catch {}
    }
  };

  const handleRetry = () => {
    soundManager.play('button_click');
    setUserAnswers(new Array(questions.length).fill(null));
    setCurrentIndex(0);
    setMode('active');
  };

  const handleResetSetup = () => {
    soundManager.play('button_click');
    setQuestions([]);
    setUserAnswers([]);
    setCurrentIndex(0);
    setErrorMessage(null);
    setIsFallbackMode(false);
    setFallbackNote(null);
    setMode('setup');
  };

  // Group subjects by Semester for organized dropdown
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
      <div id="quiz-empty-view" className="space-y-6 max-w-3xl mx-auto pb-24 md:pb-8 w-full min-w-0">
        <div className="p-8 rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 mx-auto flex items-center justify-center text-[#004741] dark:text-[#38BDF8]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-black dark:text-[#F1F5F9]">
              {isHi ? 'कोई विषय उपलब्ध नहीं है' : 'No Subjects Available for Practice'}
            </h2>
            <p className="text-xs sm:text-sm text-black/60 dark:text-[#94A3B8] max-w-md mx-auto mt-1">
              {isHi
                ? 'अभ्यास शुरू करने के लिए कृपया GTU BCA पाठ्यक्रम से एक विषय चुनें।'
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

  // 1. SETUP SCREEN
  if (mode === 'setup') {
    return (
      <div id="quiz-setup-view" className="space-y-5 sm:space-y-6 max-w-3xl mx-auto pb-24 md:pb-8 w-full min-w-0">
        {/* Header with Title and Subject Context */}
        <div className="border-b border-black/10 dark:border-[#263449] pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4] shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-display font-black text-black dark:text-[#F1F5F9] tracking-tight leading-tight">
                {t.quizHeader}
              </h1>
              <p className="text-xs sm:text-sm text-black/70 dark:text-[#94A3B8]">
                {t.quizSub}
              </p>
            </div>
          </div>

          {curriculumMatch && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-[#004741]/10 text-[#004741] dark:text-[#38BDF8] text-[11px] font-bold">
                Sem {curriculumMatch.semester}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-black/70 dark:text-[#94A3B8] text-[11px] font-mono font-bold">
                {curriculumMatch.code}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-7 rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-sm space-y-4 sm:space-y-5">
          {/* Academic Subject & Unit/Topic Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-black dark:text-[#F1F5F9] uppercase tracking-wider mb-1.5 sm:mb-2">
                {t.selectSubject}
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full py-2 sm:py-2.5 px-3 rounded-xl border border-black/15 dark:border-[#263449] bg-[#F0EDE4]/40 dark:bg-[#172033] text-black dark:text-[#F1F5F9] text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#004741]"
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
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-black dark:text-[#F1F5F9] uppercase tracking-wider mb-1.5 sm:mb-2">
                {isHi ? 'इकाई (Unit) चुनें' : 'Curriculum Unit'}
              </label>
              <select
                value={String(selectedUnitNumber)}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full py-2 sm:py-2.5 px-3 rounded-xl border border-black/15 dark:border-[#263449] bg-[#F0EDE4]/40 dark:bg-[#172033] text-black dark:text-[#F1F5F9] text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#004741]"
              >
                <option value="all">
                  {isHi ? 'सभी इकाइयां (संपूर्ण पाठ्यक्रम)' : 'All Units (Comprehensive Syllabus)'}
                </option>
                {curriculumMatch?.units?.map((u) => (
                  <option key={u.unitNumber} value={u.unitNumber}>
                    Unit {u.unitNumber}: {u.unitName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic / Subtopic */}
          <div>
            <label className="block text-xs font-bold text-black dark:text-[#F1F5F9] uppercase tracking-wider mb-1.5 sm:mb-2">
              {t.quizTopic}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Core Principles, Architecture, Syntax..."
              className="w-full py-2 sm:py-2.5 px-3 rounded-xl border border-black/15 dark:border-[#263449] bg-[#F0EDE4]/40 dark:bg-[#172033] text-black dark:text-[#F1F5F9] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#004741]"
            />
          </div>

          {/* Number of questions & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-black dark:text-[#F1F5F9] uppercase tracking-wider mb-1.5 sm:mb-2">
                {t.quizNumQuestions}
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[5, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      soundManager.play('button_click');
                      setQuestionCount(cnt);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all truncate text-center ${
                      questionCount === cnt
                        ? 'bg-[#004741] text-[#F0EDE4] border-[#004741]'
                        : 'bg-black/5 dark:bg-white/5 text-black dark:text-[#F1F5F9] border-black/10 dark:border-[#263449]'
                    }`}
                  >
                    <span className="hidden sm:inline">{cnt} Questions</span>
                    <span className="sm:hidden">{cnt} Qs</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black dark:text-[#F1F5F9] uppercase tracking-wider mb-1.5 sm:mb-2">
                {t.difficulty}
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[
                  { id: 'easy', label: t.diffEasy },
                  { id: 'medium', label: t.diffMedium },
                  { id: 'hard', label: t.diffHard },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundManager.play('button_click');
                      setDifficulty(item.id as any);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all truncate text-center ${
                      difficulty === item.id
                        ? 'bg-[#004741] text-[#F0EDE4] border-[#004741]'
                        : 'bg-black/5 dark:bg-white/5 text-black dark:text-[#F1F5F9] border-black/10 dark:border-[#263449]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Banner with Retry */}
          {errorMessage && (
            <div
              id="quiz-error-banner"
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{errorMessage}</p>
                <p className="text-xs mt-1 text-rose-600/80 dark:text-rose-300/80">
                  {isHi
                    ? 'कृपया पुनः प्रयास करें या कोई अन्य विषय/इकाई चुनें।'
                    : 'Please retry or select a different syllabus topic/unit.'}
                </p>
                <button
                  type="button"
                  onClick={startQuizGeneration}
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

          {/* Start Generation Button */}
          <div className="pt-3">
            <button
              onClick={startQuizGeneration}
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#004741] text-[#F0EDE4] font-bold text-sm hover:bg-black transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#F0EDE4] border-t-transparent rounded-full animate-spin" />
                  <span>
                    {isHi
                      ? `${selectedSubject} के लिए MCQs तैयार हो रहे हैं...`
                      : `Generating ${questionCount} MCQs for ${selectedSubject}...`}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.startQuiz}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE QUIZ SCREEN
  if (mode === 'active') {
    if (!questions || questions.length === 0) {
      setMode('setup');
      return null;
    }

    const currentQ = questions[currentIndex];
    const selectedAns = userAnswers[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

    return (
      <div id="quiz-active-view" className="space-y-5 max-w-3xl mx-auto pb-24 md:pb-8 w-full min-w-0">
        {/* Academic Context Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {curriculumMatch && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#004741]/10 text-[#004741] dark:text-[#38BDF8]">
                  Sem {curriculumMatch.semester} • {curriculumMatch.code}
                </span>
              )}
              <span className="text-xs font-bold text-[#004741] dark:text-[#38BDF8] uppercase tracking-wider">
                {selectedSubject}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-black/60 dark:text-[#94A3B8] uppercase">
                {difficulty}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-black/70 dark:text-[#94A3B8]">
              {t.questionProgress} {currentIndex + 1} {t.of} {questions.length}
            </h2>
          </div>

          <button
            onClick={handleResetSetup}
            className="text-xs font-bold text-black/60 dark:text-[#94A3B8] hover:text-rose-600 underline self-start sm:self-auto"
          >
            {isHi ? 'क्विज़ रद्द करें' : 'Cancel Quiz'}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#004741] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {isFallbackMode && (
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>{fallbackNote || 'Verified GTU Academic Question Bank'}</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-100">
              Verified
            </span>
          </div>
        )}

        {/* Question Card */}
        {currentQ && (
          <div className="p-5 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-sm space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-black dark:text-[#F1F5F9] leading-relaxed">
              {currentIndex + 1}. {currentQ.question}
            </h3>

            {/* 4 Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedAns === optIdx;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full p-4 rounded-2xl border text-left font-medium text-sm transition-all flex items-center justify-between gap-3 active:scale-98 ${
                      isSelected
                        ? 'bg-[#004741] text-[#F0EDE4] border-[#004741] shadow-sm'
                        : 'bg-[#F0EDE4]/40 dark:bg-[#172033] text-black dark:text-[#F1F5F9] border-black/10 dark:border-[#263449] hover:border-[#004741]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-black/30 text-[#F0EDE4]'
                            : 'bg-black/5 dark:bg-white/10 text-black dark:text-[#F1F5F9]'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#F0EDE4] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-[#263449]">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/15 dark:border-[#263449] text-black dark:text-[#F1F5F9] text-xs font-bold hover:bg-black/5 dark:hover:bg-[#1E293B] disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.prevQuestion}</span>
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-black transition-all active:scale-95"
                >
                  <span>{t.nextQuestion}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-black transition-all active:scale-95 shadow-sm"
                >
                  <Trophy className="w-4 h-4" />
                  <span>{t.submitQuiz}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. REVIEW & RESULTS SCREEN
  const result = lastResult;
  if (!result) return null;

  const performanceMessage =
    result.percentage >= 80
      ? language === 'hi'
        ? 'शानदार प्रदर्शन! आपकी अवधारणाएं बहुत मजबूत हैं।'
        : 'Outstanding Performance! You have strong conceptual mastery.'
      : result.percentage >= 50
      ? language === 'hi'
        ? 'अच्छा प्रयास! कुछ विषयों पर थोड़ा और अभ्यास करें।'
        : 'Good effort! Review the wrong answers below to solidify concepts.'
      : language === 'hi'
      ? 'अभ्यास की आवश्यकता है। व्याख्याओं को ध्यान से पढ़ें।'
      : 'Needs more revision. Study the detailed explanations below.';

  return (
    <div id="quiz-review-view" className="space-y-6 max-w-3xl mx-auto pb-24 md:pb-8 w-full min-w-0">
      {/* Score Summary Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#004741] text-[#F0EDE4] shadow-md text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex p-3 rounded-2xl bg-black/20 text-[#F0EDE4] mb-1">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs uppercase font-bold tracking-wider text-[#F0EDE4]/80">
            {selectedSubject} • {topic}
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight">
            {t.quizScore}
          </h1>
        </div>

        <div className="flex items-center justify-center gap-3">
          <span className="text-5xl sm:text-6xl font-black">
            {result.score}
            <span className="text-2xl sm:text-3xl text-[#F0EDE4]/60">/{result.total}</span>
          </span>
          <div className="px-3 py-1.5 rounded-2xl bg-black/30 text-base font-bold">
            {result.percentage}%
          </div>
        </div>

        <p className="text-sm text-[#F0EDE4]/90 max-w-md mx-auto">
          {performanceMessage}
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0EDE4] text-[#004741] text-xs font-bold hover:bg-white active:scale-95 transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.retryQuiz}</span>
          </button>

          <button
            onClick={handleResetSetup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/40 text-[#F0EDE4] text-xs font-bold active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.newQuiz}</span>
          </button>

          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('gtu_bca', undefined, selectedSubject)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/40 text-[#F0EDE4] text-xs font-bold active:scale-95 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isHi ? 'GTU BCA विषय पर लौटें' : 'Return to Subject'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('exam_mode', undefined, selectedSubject)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/40 text-[#F0EDE4] text-xs font-bold active:scale-95 transition-all"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>{isHi ? 'परीक्षा उत्तर जनरेटर' : 'Exam Answer Generator'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-black dark:text-[#F1F5F9] tracking-tight">
          {t.reviewAnswers}
        </h2>

        {result.questions.map((q, qIdx) => {
          const userAns = result.userAnswers[qIdx];
          const correctIdx = q.correctAnswer !== undefined ? q.correctAnswer : q.correctAnswerIndex;
          const isCorrect = userAns === correctIdx;

          return (
            <div
              key={qIdx}
              className={`p-5 rounded-2xl border ${
                isCorrect
                  ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-600/30'
                  : 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-600/30'
              } space-y-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-black dark:text-[#F1F5F9]">
                  {qIdx + 1}. {q.question}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                    isCorrect
                      ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-600/20 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt, optIdx) => {
                  const isCorrectOpt = optIdx === correctIdx;
                  const isUserPick = optIdx === userAns;

                  return (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isCorrectOpt
                          ? 'bg-emerald-600/20 border-emerald-600/40 text-emerald-900 dark:text-emerald-200 font-bold'
                          : isUserPick
                          ? 'bg-rose-600/20 border-rose-600/40 text-rose-900 dark:text-rose-200 line-through'
                          : 'bg-white/60 dark:bg-[#172033] border-black/10 dark:border-[#263449] text-black/70 dark:text-[#94A3B8]'
                      }`}
                    >
                      <span>{opt}</span>
                      {isCorrectOpt && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      {isUserPick && !isCorrectOpt && (
                        <X className="w-3.5 h-3.5 text-rose-600" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-black/80 dark:text-[#F1F5F9]/90">
                <span className="font-bold text-[#004741] dark:text-[#38BDF8] block mb-0.5">
                  Explanation:
                </span>
                <p>{q.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

