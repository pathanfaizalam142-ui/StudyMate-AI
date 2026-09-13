import React, { useState } from 'react';
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
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { api } from '../services/api';
import { QuizQuestion, QuizResult, SubjectItem, AppLanguage, AppTheme } from '../types';
import { translations } from '../services/i18n';

interface QuizViewProps {
  language: AppLanguage;
  theme: AppTheme;
  subjects: SubjectItem[];
  initialSubject?: string;
  onQuizCompleted: (result: QuizResult) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  language,
  theme,
  subjects,
  initialSubject,
  onQuizCompleted,
}) => {
  const t = translations[language];

  // Modes: 'setup' | 'active' | 'review'
  const [mode, setMode] = useState<'setup' | 'active' | 'review'>('setup');

  // Setup options
  const [selectedSubject, setSelectedSubject] = useState(
    initialSubject || subjects[0]?.name || 'Operating System'
  );
  const [topic, setTopic] = useState('Process Scheduling & Deadlocks');
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

  const startQuizGeneration = async () => {
    soundManager.play('button_click');
    setErrorMessage(null);
    setIsFallbackMode(false);
    setFallbackNote(null);
    setIsLoading(true);

    try {
      const res = await api.generateQuiz({
        subject: selectedSubject,
        topic: topic.trim() || 'Core Syllabus Concepts',
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

      if (validated.length === 0) {
        throw new Error('Unable to generate quiz right now. Please try again.');
      }

      setQuestions(validated);
      setIsFallbackMode(Boolean(res.isFallback));
      setFallbackNote(res.note || null);
      setUserAnswers(new Array(validated.length).fill(null));
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

    // Sound effect based on correct vs wrong
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

    // Launch celebratory confetti if score is >= 70%
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
    setMode('setup');
  };

  // 1. SETUP SCREEN
  if (mode === 'setup') {
    return (
      <div id="quiz-setup-view" className="space-y-5 sm:space-y-6 max-w-3xl mx-auto pb-20 md:pb-8 w-full min-w-0">
        <div className="border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4] shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-display font-black text-black dark:text-[#F0EDE4] tracking-tight leading-tight">
                {t.quizHeader}
              </h1>
              <p className="text-xs sm:text-sm text-black/70 dark:text-[#F0EDE4]/70">
                {t.quizSub}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-7 rounded-3xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 shadow-sm space-y-4 sm:space-y-5">
          {/* Subject & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider mb-1.5 sm:mb-2">
                {t.selectSubject}
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  soundManager.play('button_click');
                  setSelectedSubject(e.target.value);
                }}
                className="w-full py-2 sm:py-2.5 px-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#F0EDE4]/40 dark:bg-black/30 text-black dark:text-[#F0EDE4] text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#004741]"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider mb-1.5 sm:mb-2">
                {t.quizTopic}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Deadlock & Semaphores, TCP Handshake..."
                className="w-full py-2 sm:py-2.5 px-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#F0EDE4]/40 dark:bg-black/30 text-black dark:text-[#F0EDE4] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#004741]"
              />
            </div>
          </div>

          {/* Number of questions & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider mb-1.5 sm:mb-2">
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
                        : 'bg-black/5 dark:bg-white/5 text-black dark:text-[#F0EDE4] border-black/10 dark:border-white/10'
                    }`}
                  >
                    <span className="hidden sm:inline">{cnt} Questions</span>
                    <span className="sm:hidden">{cnt} Qs</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider mb-1.5 sm:mb-2">
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
                        : 'bg-black/5 dark:bg-white/5 text-black dark:text-[#F0EDE4] border-black/10 dark:border-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div
              id="quiz-error-banner"
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{errorMessage}</p>
                <p className="text-xs mt-1 text-rose-600/80 dark:text-rose-300/80">
                  Please try again or select a different topic/chapter.
                </p>
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

          <div className="pt-3">
            <button
              onClick={startQuizGeneration}
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#004741] text-[#F0EDE4] font-bold text-sm hover:bg-black transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#F0EDE4] border-t-transparent rounded-full animate-spin" />
                  <span>Generating MCQs with Gemini 3.8 Flash...</span>
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
      <div id="quiz-active-view" className="space-y-5 max-w-3xl mx-auto pb-20 md:pb-8">
        {/* Quiz Progress & Details */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#004741] dark:text-[#6ee7b7] uppercase tracking-wider">
              {selectedSubject} • {difficulty.toUpperCase()}
            </span>
            <h2 className="text-sm font-semibold text-black/70 dark:text-[#F0EDE4]/70">
              {t.questionProgress} {currentIndex + 1} {t.of} {questions.length}
            </h2>
          </div>

          <button
            onClick={handleResetSetup}
            className="text-xs font-bold text-black/60 dark:text-[#F0EDE4]/60 hover:text-rose-600 underline"
          >
            Cancel Quiz
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
              <span>{fallbackNote || 'Verified GTU Academic Question Bank (High demand model fallback)'}</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-100">
              Verified
            </span>
          </div>
        )}

        {/* Question Card */}
        {currentQ && (
          <div className="p-5 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 shadow-sm space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-black dark:text-[#F0EDE4] leading-relaxed">
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
                        : 'bg-[#F0EDE4]/40 dark:bg-black/30 text-black dark:text-[#F0EDE4] border-black/10 dark:border-white/10 hover:border-[#004741]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-black/30 text-[#F0EDE4]'
                            : 'bg-black/5 dark:bg-white/10 text-black dark:text-[#F0EDE4]'
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
            <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-white/10">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 text-black dark:text-[#F0EDE4] text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
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
    <div id="quiz-review-view" className="space-y-6 max-w-3xl mx-auto pb-20 md:pb-8">
      {/* Score Summary Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#004741] text-[#F0EDE4] shadow-md text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex p-3 rounded-2xl bg-black/20 text-[#F0EDE4] mb-1">
          <Trophy className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight">
          {t.quizScore}
        </h1>

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
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
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
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-black dark:text-[#F0EDE4] tracking-tight">
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
                <h3 className="text-sm font-bold text-black dark:text-[#F0EDE4]">
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
                          : 'bg-white/60 dark:bg-black/30 border-black/10 dark:border-white/10 text-black/70 dark:text-[#F0EDE4]/70'
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
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-black/80 dark:text-[#F0EDE4]/80">
                <span className="font-bold text-[#004741] dark:text-[#6ee7b7] block mb-0.5">
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
