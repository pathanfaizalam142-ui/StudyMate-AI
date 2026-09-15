import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  MessageSquare,
  FileCheck2,
  FileText,
  Award,
  UploadCloud,
  CalendarCheck,
  Plus,
  ArrowRight,
  Code2,
  Network,
  Cpu,
  Calculator,
  Globe,
  Palette,
  CheckCircle2,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { NavigationTab, SubjectItem, AppLanguage } from '../types';
import { translations } from '../services/i18n';

interface DashboardViewProps {
  language: AppLanguage;
  subjects: SubjectItem[];
  onOpenAddSubject: () => void;
  onNavigate: (tab: NavigationTab, initialQuery?: string, initialSubject?: string) => void;
  completedTasksCount: number;
  totalTasksCount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  language,
  subjects,
  onOpenAddSubject,
  onNavigate,
  completedTasksCount,
  totalTasksCount,
}) => {
  const t = translations[language];
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Web Speech API Voice Recognition
  const handleVoiceInput = () => {
    soundManager.play('button_click');
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuickPrompt(transcript);
        setIsListening(false);
        soundManager.play('save');
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSubmitQuickPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickPrompt.trim()) return;
    soundManager.play('button_click');
    onNavigate('ask_ai', quickPrompt.trim());
  };

  const getSubjectIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'java':
        return Code2;
      case 'networks':
      case 'computernetworks':
        return Network;
      case 'os':
      case 'operatingsystem':
        return Cpu;
      case 'math':
      case 'mathematics':
        return Calculator;
      case 'web':
      case 'webdevelopment':
        return Globe;
      case 'design':
      case 'designthinking':
        return Palette;
      default:
        return Layers;
    }
  };

  const quickActionList = [
    {
      id: 'gtu_bca',
      title: 'GTU BCA Portal',
      desc: language === 'hi' ? 'सेम 1-6 पाठ्यक्रम व प्रश्न' : 'Sem 1-6 syllabus & bank',
      icon: GraduationCap,
      color: 'bg-[#004741] text-[#F0EDE4]',
      target: 'gtu_bca' as NavigationTab,
    },
    {
      id: 'question_papers',
      title: language === 'hi' ? 'GTU प्रश्न पत्र' : 'GTU Papers (2025-26)',
      desc: language === 'hi' ? 'सेम 1-6 PDF डाउनलोड करें' : 'Sem 1-6 authentic PDFs',
      icon: FileText,
      color: 'bg-[#004741] text-[#F0EDE4]',
      target: 'question_papers' as NavigationTab,
    },
    {
      id: 'ask_ai',
      title: t.actionAskAI,
      desc: language === 'hi' ? 'कोई भी शंका पूछें' : 'Instant Q&A and concepts',
      icon: MessageSquare,
      color: 'bg-[#004741] text-[#F0EDE4]',
      target: 'ask_ai' as NavigationTab,
    },
    {
      id: 'exam_mode',
      title: t.actionExamAnswer,
      desc: language === 'hi' ? '5, 7, 10 अंक वाले उत्तर' : '5, 7 & 10-mark templates',
      icon: FileCheck2,
      color: 'bg-[#004741] text-[#F0EDE4]',
      target: 'exam_mode' as NavigationTab,
    },
    {
      id: 'summarize',
      title: t.actionSummarize,
      desc: language === 'hi' ? 'त्वरित संशोधन नोट्स' : 'High-yield key revision',
      icon: FileText,
      color: 'bg-[#004741] text-[#F0EDE4]',
      target: 'notes_upload' as NavigationTab,
    },
    {
      id: 'quiz',
      title: t.actionQuiz,
      desc: language === 'hi' ? 'अभ्यास MCQs' : 'Smart MCQs & evaluations',
      icon: Award,
      color: 'bg-[#004741] text-[#F0EDE4]',
      target: 'quiz' as NavigationTab,
    },
    {
      id: 'upload_pdf',
      title: t.actionUploadPDF,
      desc: language === 'hi' ? 'दस्तावेज़ से प्रश्न पूछें' : 'PDF, TXT & Notes QA',
      icon: UploadCloud,
      color: 'bg-[#004741] text-[#F0EDE4]',
      target: 'notes_upload' as NavigationTab,
    },
    {
      id: 'study_plan',
      title: t.actionStudyPlan,
      desc: language === 'hi' ? 'परीक्षा समय सारिणी' : 'Adaptive revision schedule',
      icon: CalendarCheck,
      color: 'bg-[#004741] text-[#F0EDE4]',
      target: 'study_plan' as NavigationTab,
    },
  ];

  return (
    <div id="dashboard-view" className="space-y-5 sm:space-y-6 pb-20 md:pb-8 w-full max-w-full overflow-hidden">
      {/* 1. Main Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-black dark:text-[#F0EDE4] tracking-tight leading-tight">
            {t.greetingMorning}
          </h1>
          <p className="text-xs sm:text-sm text-black/70 dark:text-[#F0EDE4]/70 mt-0.5">
            {t.greetingSub}
          </p>
        </div>

        {/* Daily Goal Mini Progress */}
        <div
          onClick={() => {
            soundManager.play('card_open');
            onNavigate('study_plan');
          }}
          className="cursor-pointer flex items-center justify-between sm:justify-start gap-3 p-3 rounded-2xl bg-white/80 dark:bg-black/40 border border-black/10 dark:border-white/10 shadow-sm hover:border-[#004741] transition-all active:scale-98 w-full sm:w-auto shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#004741] flex items-center justify-center text-[#F0EDE4] font-bold text-xs shrink-0">
              {totalTasksCount > 0
                ? Math.round((completedTasksCount / totalTasksCount) * 100)
                : 60}
              %
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-bold text-black dark:text-[#F0EDE4]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#004741] dark:text-[#6ee7b7]" />
                <span>{t.dailyTarget}</span>
              </div>
              <p className="text-[11px] text-black/60 dark:text-[#F0EDE4]/60">
                {completedTasksCount} / {totalTasksCount || 3} {language === 'hi' ? 'कार्य पूर्ण' : 'tasks done'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-black/40 dark:text-[#F0EDE4]/40 sm:hidden" />
        </div>
      </div>

      {/* 2. Main AI Input Card */}
      <div className="relative p-4 sm:p-6 rounded-3xl bg-[#004741] text-[#F0EDE4] shadow-md overflow-hidden w-full max-w-full">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-black/10 -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 -mb-12 pointer-events-none" />

        <div className="relative z-10 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-black/20 text-[#F0EDE4]">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#F0EDE4]/90">
              StudyMate AI Engine
            </span>
          </div>

          <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[#F0EDE4] leading-snug">
            {t.askAnythingPrompt}
          </h2>

          <form onSubmit={handleSubmitQuickPrompt} className="relative flex items-center w-full">
            <input
              id="dashboard-quick-input"
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder={t.askInputPlaceholder}
              className="w-full pl-3.5 sm:pl-4 pr-20 sm:pr-24 py-3 sm:py-3.5 rounded-2xl bg-[#F0EDE4] text-black placeholder-black/50 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
            />
            <div className="absolute right-1.5 sm:right-2 flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={handleVoiceInput}
                title={isListening ? t.listening : t.voiceInput}
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
              <button
                type="submit"
                disabled={!quickPrompt.trim()}
                title="Ask AI"
                className="p-1.5 sm:p-2 rounded-xl bg-[#004741] text-[#F0EDE4] hover:bg-black disabled:opacity-40 disabled:hover:bg-[#004741] transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </form>

          {/* Quick chip prompts */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 text-[11px] sm:text-xs">
            <span className="text-[#F0EDE4]/70 font-semibold">{language === 'hi' ? 'सुझाव:' : 'Try:'}</span>
            {[
              'Explain constructor in Java',
              'OS Deadlock 4 Conditions',
              'TCP 3-Way Handshake',
              'Differentiate 1NF vs 2NF',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  soundManager.play('button_click');
                  onNavigate('ask_ai', chip);
                }}
                className="px-2.5 py-1 rounded-full bg-black/20 hover:bg-black/30 text-[#F0EDE4] text-[11px] sm:text-xs font-medium transition-all active:scale-95 truncate max-w-full"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-black dark:text-[#F0EDE4] tracking-tight">
            {t.quickActions}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {quickActionList.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                id={`quick-action-${action.id}`}
                onClick={() => {
                  soundManager.play('card_open');
                  onNavigate(action.target);
                }}
                className="flex flex-col items-start p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-black/40 border border-black/10 dark:border-white/10 hover:border-[#004741] hover:shadow-md transition-all active:scale-96 text-left group"
              >
                <div className="p-2 sm:p-2.5 rounded-xl bg-[#004741] text-[#F0EDE4] mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F0EDE4] group-hover:text-[#004741] dark:group-hover:text-[#6ee7b7] transition-colors leading-snug line-clamp-1">
                  {action.title}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-black/60 dark:text-[#F0EDE4]/60 line-clamp-1 mt-0.5">
                  {action.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* GTU Question Papers Dedicated Card */}
      <div
        id="dashboard-gtu-papers-card"
        onClick={() => {
          soundManager.play('card_open');
          onNavigate('question_papers');
        }}
        className="cursor-pointer relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#004741] to-[#002f2b] p-4 sm:p-6 text-[#F0EDE4] shadow-md hover:shadow-lg transition-all group border border-[#004741]/40"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-white/15 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                Official GTU Archive
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                2025 & 2026 Papers
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-bold tracking-tight text-white group-hover:text-[#6ee7b7] transition-colors">
              {language === 'hi'
                ? 'GTU BCA पिछले वर्ष के प्रश्न पत्र (Sem 1-6)'
                : 'GTU BCA Previous Year Question Papers (Sem 1-6)'}
            </h3>
            <p className="text-xs sm:text-sm text-[#F0EDE4]/80 leading-relaxed">
              {language === 'hi'
                ? 'सेमेस्टर और विषयवार 2025 व 2026 के प्रामाणिक विश्वविद्यालय प्रश्न पत्र ब्राउज़ करें, PDF डाउनलोड करें या सीधे AI से हल करवाएं।'
                : 'Browse semester and subject-wise 2025 & 2026 authentic university examination papers, download genuine PDFs, or solve with AI.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-[#F0EDE4] hover:bg-white text-[#004741] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <span>{language === 'hi' ? 'सभी पेपर देखें' : 'Browse Papers'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
          <FileText className="w-36 h-36 text-white" />
        </div>
      </div>

      {/* 4. Subject Cards Grid */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-black dark:text-[#F0EDE4] tracking-tight">
              {t.subjectsHeading}
            </h2>
            <button
              onClick={() => {
                soundManager.play('card_open');
                onNavigate('gtu_bca');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#004741]/10 dark:bg-[#004741]/30 hover:bg-[#004741] text-[#004741] dark:text-[#6ee7b7] hover:text-[#F0EDE4] text-[11px] sm:text-xs font-bold transition"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>GTU BCA Sem 1-6</span>
            </button>
          </div>
          <button
            id="add-subject-btn"
            onClick={() => {
              soundManager.play('button_click');
              onOpenAddSubject();
            }}
            className="flex items-center gap-1 text-xs font-bold text-[#004741] dark:text-[#6ee7b7] hover:underline active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addSubject}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subj) => {
            const Icon = getSubjectIcon(subj.iconName);
            return (
              <div
                key={subj.id}
                id={`subject-card-${subj.id}`}
                className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-black/40 border border-black/10 dark:border-white/10 hover:border-[#004741] hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-[#004741]/10 dark:bg-[#004741]/30 text-[#004741] dark:text-[#6ee7b7] group-hover:bg-[#004741] group-hover:text-[#F0EDE4] transition-colors shrink-0">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F0EDE4] truncate">
                        {subj.name}
                      </h3>
                      {subj.code && (
                        <span className="text-[10px] sm:text-[11px] font-mono text-black/50 dark:text-[#F0EDE4]/50">
                          {subj.code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <button
                    onClick={() => {
                      soundManager.play('button_click');
                      onNavigate('ask_ai', `Explain key concepts in ${subj.name}`, subj.name);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#004741] hover:text-[#F0EDE4] text-[11px] sm:text-xs font-semibold text-black dark:text-[#F0EDE4] transition-colors text-center truncate"
                  >
                    {t.actionAskAI}
                  </button>
                  <button
                    onClick={() => {
                      soundManager.play('button_click');
                      onNavigate('exam_mode', '', subj.name);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#004741] hover:text-[#F0EDE4] text-[11px] sm:text-xs font-semibold text-black dark:text-[#F0EDE4] transition-colors text-center truncate"
                  >
                    {t.actionExamAnswer}
                  </button>
                  <button
                    onClick={() => {
                      soundManager.play('button_click');
                      onNavigate('quiz', '', subj.name);
                    }}
                    className="p-1.5 rounded-xl bg-[#004741] text-[#F0EDE4] hover:bg-black transition-colors shrink-0"
                    title="Take Quiz"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
