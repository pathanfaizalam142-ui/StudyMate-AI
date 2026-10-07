import React, { useState, useMemo } from 'react';
import {
  Send,
  Mic,
  MicOff,
  FileText,
  Award,
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
  Circle,
  Layers,
  GraduationCap,
  BookOpen,
  Bookmark,
  MessageSquare,
  FileCheck2,
  UploadCloud,
  Clock,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import {
  NavigationTab,
  SubjectItem,
  AppLanguage,
  StudyPlanData,
  SavedItem,
  QuizResult,
  UploadedNote,
} from '../types';
import { translations } from '../services/i18n';
import { findSubjectByCodeOrName } from '../data/gtuBcaCurriculum';

interface DashboardViewProps {
  language: AppLanguage;
  subjects: SubjectItem[];
  onOpenAddSubject: () => void;
  onNavigate: (tab: NavigationTab, initialQuery?: string, initialSubject?: string) => void;
  completedTasksCount: number;
  totalTasksCount: number;
  currentSemester?: number;
  studyPlan?: StudyPlanData;
  onToggleTask?: (taskId: string) => void;
  savedItems?: SavedItem[];
  quizHistory?: QuizResult[];
  uploadedNotes?: UploadedNote[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  language,
  subjects,
  onOpenAddSubject,
  onNavigate,
  completedTasksCount,
  totalTasksCount,
  currentSemester = 3,
  studyPlan,
  onToggleTask,
  savedItems = [],
  quizHistory = [],
  uploadedNotes = [],
}) => {
  const t = translations[language];
  const isHi = language === 'hi';

  const [activeSemesterFilter, setActiveSemesterFilter] = useState<number>(
    Number(currentSemester) >= 1 && Number(currentSemester) <= 6 ? Number(currentSemester) : 3
  );
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    soundManager.play('button_click');
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isHi ? 'hi-IN' : 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuickPrompt(transcript);
        setIsListening(false);
        soundManager.play('save');
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
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

  const semesterSubjects = useMemo(() => {
    const filtered = subjects.filter((s) => !s.semester || s.semester === activeSemesterFilter);
    return filtered.length > 0 ? filtered : subjects.slice(0, 6);
  }, [subjects, activeSemesterFilter]);

  // Context-aware subject resumption: prioritize most recent activity if it matches this semester
  const continueSubject = useMemo(() => {
    const recentCandidate = quizHistory[0]?.subject || savedItems[0]?.subject;
    if (recentCandidate) {
      const match = semesterSubjects.find(
        (s) =>
          s.name.toLowerCase() === recentCandidate.toLowerCase() ||
          (s.code && s.code.toLowerCase() === recentCandidate.toLowerCase())
      );
      if (match) return match;
    }
    return semesterSubjects[0] || subjects[0];
  }, [quizHistory, savedItems, semesterSubjects, subjects]);

  const progressPercent =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const quickActions: Array<{
    id: NavigationTab;
    label: string;
    sub: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'ask_ai',
      label: isHi ? 'AI से पूछें' : 'Ask AI',
      sub: isHi ? 'तुरंत अवधारणा और शंका समाधान' : 'Instant concept & doubt solver',
      icon: MessageSquare,
    },
    {
      id: 'quiz',
      label: isHi ? 'MCQ अभ्यास' : 'Practice MCQs',
      sub: isHi ? 'इकाई और विषयवार प्रश्नोत्तरी' : 'Subject & unit-isolated quizzes',
      icon: Award,
    },
    {
      id: 'exam_mode',
      label: isHi ? 'परीक्षा उत्तर जनरेटर' : 'Generate Exam Answer',
      sub: isHi ? '2M से 15M GTU उत्तर प्रारूप' : '2M, 3M, 5M, 7M, 10M, 15M answers',
      icon: FileCheck2,
    },
    {
      id: 'notes_upload',
      label: isHi ? 'नोट्स विश्लेषक' : 'Analyze Notes',
      sub: isHi ? 'सारांश, फ्लैशकार्ड और प्रश्न' : 'Upload notes for AI summary & QA',
      icon: UploadCloud,
    },
    {
      id: 'study_plan',
      label: isHi ? 'अध्ययन योजनाकार' : 'Study Planner',
      sub: isHi ? 'दैनिक लक्ष्य और परीक्षा समय-सारिणी' : 'Daily tasks & exam schedule',
      icon: CalendarCheck,
    },
  ];

  return (
    <div id="dashboard-view" className="space-y-6 pb-20 md:pb-8 w-full max-w-full">
      {/* =====================================================================
          1. CONTINUE LEARNING (Current Semester, Subject & Active Study Tasks)
         ===================================================================== */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-black/60 dark:text-[#94A3B8]">
              <span>GTU Bachelor of Computer Applications (BCA)</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-semibold text-[#004741] dark:text-[#38BDF8]">
                Semester {activeSemesterFilter}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-black dark:text-[#F1F5F9] tracking-tight">
              {t.greetingMorning}
            </h1>
            <p className="text-xs sm:text-sm text-black/70 dark:text-[#94A3B8]">
              {t.greetingSub}
            </p>
          </div>

          {/* Semester Context Switcher */}
          <div className="flex flex-col sm:items-end gap-1.5">
            <span className="text-[11px] font-semibold text-black/50 dark:text-[#94A3B8]">
              {isHi ? 'सक्रिय सेमेस्टर चुनें' : 'Select Semester'}
            </span>
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-[#263449]">
              {[1, 2, 3, 4, 5, 6].map((sem) => {
                const active = activeSemesterFilter === sem;
                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => {
                      soundManager.play('nav_tap');
                      setActiveSemesterFilter(sem);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'bg-[#004741] text-[#F0EDE4] shadow-xs'
                        : 'text-black/70 dark:text-[#94A3B8] hover:text-black dark:hover:text-[#F1F5F9]'
                    }`}
                  >
                    Sem {sem}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Continue Learning Banner */}
        {continueSubject && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#004741] text-[#F0EDE4] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-xs text-[#F0EDE4]/75">
                <span className="font-semibold uppercase tracking-wider">
                  {isHi ? 'अध्ययन जारी रखें' : 'Continue Learning'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">
                  {continueSubject.code || `Semester ${activeSemesterFilter}`}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {completedTasksCount}/{totalTasksCount || 4}{' '}
                  {isHi ? 'दैनिक कार्य पूर्ण' : 'tasks done'} ({progressPercent}%)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-display font-black tracking-tight text-white">
                {continueSubject.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#F0EDE4]/80 leading-relaxed">
                {isHi
                  ? 'वर्तमान सेमेस्टर के पाठ्यक्रम, अध्ययन सामग्री, आधिकारिक GTU प्रश्न पत्रों और अभ्यास प्रश्नों को जारी रखें।'
                  : 'Resume your current semester syllabus, curated study materials, verified GTU papers, and practice questions.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundManager.play('card_open');
                  onNavigate('gtu_bca', undefined, continueSubject.name);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#F0EDE4] hover:bg-white text-[#004741] text-xs font-bold transition flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{isHi ? 'विषय खोलें' : 'Resume Subject'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.play('card_open');
                  onNavigate('study_materials', undefined, continueSubject.name);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-black/25 hover:bg-black/40 text-[#F0EDE4] border border-white/15 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isHi ? 'अध्ययन सामग्री' : 'Study Materials'}</span>
              </button>

              <button
                type="button"
                id="dashboard-gtu-papers-card"
                onClick={() => {
                  soundManager.play('card_open');
                  onNavigate('question_papers', undefined, continueSubject.code || continueSubject.name);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-black/25 hover:bg-black/40 text-[#F0EDE4] border border-white/15 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>{isHi ? 'GTU प्रश्न पत्र' : 'GTU Papers'}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          2. MY SEMESTER SUBJECTS (Syllabus, Materials, Papers, Practice)
         ===================================================================== */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-black dark:text-[#F1F5F9] tracking-tight">
              {isHi
                ? `मेरे सेमेस्टर ${activeSemesterFilter} के विषय (${semesterSubjects.length})`
                : `My Semester ${activeSemesterFilter} Subjects (${semesterSubjects.length})`}
            </h2>
            <button
              type="button"
              onClick={() => {
                soundManager.play('card_open');
                onNavigate('gtu_bca');
              }}
              className="text-xs font-semibold text-[#004741] dark:text-[#38BDF8] hover:underline"
            >
              {isHi ? 'सभी सेमेस्टर देखें →' : 'View All Semesters →'}
            </button>
          </div>

          <button
            id="add-subject-btn"
            type="button"
            onClick={() => {
              soundManager.play('button_click');
              onOpenAddSubject();
            }}
            className="flex items-center gap-1 text-xs font-bold text-[#004741] dark:text-[#38BDF8] hover:underline"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addSubject}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {semesterSubjects.map((subj) => {
            const Icon = getSubjectIcon(subj.iconName);
            return (
              <div
                key={subj.id}
                id={`subject-card-${subj.id}`}
                className="p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] hover:border-[#004741] transition-all group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-[#004741]/10 dark:bg-[#004741]/30 text-[#004741] dark:text-[#38BDF8] group-hover:bg-[#004741] group-hover:text-[#F0EDE4] transition-colors shrink-0">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F1F5F9] truncate">
                        {subj.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-black/50 dark:text-[#94A3B8]">
                        {subj.code && <span className="font-mono font-semibold">{subj.code}</span>}
                        {subj.category && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{subj.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Direct Subject Actions: Syllabus, Materials, Papers, Practice */}
                <div className="grid grid-cols-4 gap-1.5 pt-2.5 border-t border-black/5 dark:border-[#263449]/60">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('button_click');
                      onNavigate('gtu_bca', 'syllabus', subj.name);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-[#004741] hover:text-[#F0EDE4] text-[11px] font-semibold text-black dark:text-[#F1F5F9] transition-colors text-center truncate"
                  >
                    {isHi ? 'पाठ्यक्रम' : 'Syllabus'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('button_click');
                      onNavigate('study_materials', 'materials', subj.name);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-[#004741] hover:text-[#F0EDE4] text-[11px] font-semibold text-black dark:text-[#F1F5F9] transition-colors text-center truncate"
                  >
                    {isHi ? 'सामग्री' : 'Materials'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('button_click');
                      onNavigate('question_papers', undefined, subj.code || subj.name);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-[#004741] hover:text-[#F0EDE4] text-[11px] font-semibold text-black dark:text-[#F1F5F9] transition-colors text-center truncate"
                  >
                    {isHi ? 'पेपर्स' : 'Papers'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('button_click');
                      const match = findSubjectByCodeOrName(subj.name);
                      const initialTopic =
                        match?.units?.[0]?.topics?.[0]?.title ||
                        match?.units?.[0]?.unitName ||
                        'Core Concepts & Syllabus';
                      onNavigate('quiz', initialTopic, subj.name);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-[#004741] text-[#F0EDE4] hover:bg-[#003833] text-[11px] font-semibold transition-colors text-center truncate"
                  >
                    {isHi ? 'अभ्यास' : 'Practice'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          3. QUICK STUDY ACTIONS (Ask AI, Practice MCQs, Generate Exam Answer, Analyze Notes, Study Planner)
         ===================================================================== */}
      <section className="p-5 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-black dark:text-[#F1F5F9] tracking-tight">
              {isHi ? 'त्वरित अध्ययन उपकरण' : 'Quick Study Actions'}
            </h2>
            <p className="text-xs text-black/60 dark:text-[#94A3B8]">
              {isHi
                ? 'AI अध्ययन, परीक्षा उत्तर, MCQ अभ्यास और योजनाकार तक सीधी पहुंच'
                : 'Jump directly into AI tutoring, MCQ practice, university answer generation, note analysis, or scheduling.'}
            </p>
          </div>
        </div>

        {/* 5 Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => {
                  soundManager.play('card_open');
                  onNavigate(act.id);
                }}
                className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-[#172033] hover:bg-[#004741] text-left border border-black/8 dark:border-[#263449] transition-all group flex flex-col justify-between gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-[#004741]/10 dark:bg-[#004741]/30 group-hover:bg-white/15 flex items-center justify-center text-[#004741] dark:text-[#38BDF8] group-hover:text-[#F0EDE4] transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-black dark:text-[#F1F5F9] group-hover:text-white">
                    {act.label}
                  </div>
                  <div className="text-[11px] text-black/55 dark:text-[#94A3B8] group-hover:text-[#F0EDE4]/80 line-clamp-1 mt-0.5">
                    {act.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick AI Search Bar */}
        <form onSubmit={handleSubmitQuickPrompt} className="relative flex items-center w-full pt-1">
          <input
            id="dashboard-quick-input"
            type="text"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder={t.askInputPlaceholder}
            className="w-full pl-3.5 pr-20 py-3 rounded-xl bg-[#F0EDE4]/70 dark:bg-[#111827] border border-black/15 dark:border-[#263449] text-black dark:text-[#F1F5F9] placeholder-black/45 dark:placeholder-[#F0EDE4]/45 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004741]"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={handleVoiceInput}
              title={isListening ? t.listening : t.voiceInput}
              className={`p-1.5 rounded-lg transition-all ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-black/60 dark:text-[#94A3B8] hover:bg-black/10 dark:hover:bg-[#1E293B]'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button
              type="submit"
              disabled={!quickPrompt.trim()}
              title="Ask AI"
              className="p-1.5 rounded-lg bg-[#004741] text-[#F0EDE4] hover:bg-[#003833] disabled:opacity-40 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================================
          4. RECENT ACTIVITY (Study Tasks, Recent Quizzes, Saved Answers, Uploaded Notes)
         ===================================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#004741] dark:text-[#38BDF8]" />
            <h2 className="text-base sm:text-lg font-bold text-black dark:text-[#F1F5F9] tracking-tight">
              {isHi ? 'हाल की गतिविधि और अध्ययन कार्य' : 'Recent Activity'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 4A. Study Tasks */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#004741] dark:text-[#38BDF8]" />
                <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F1F5F9]">
                  {isHi ? 'अध्ययन कार्य' : 'Study Tasks'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('study_plan')}
                className="text-xs font-semibold text-[#004741] dark:text-[#38BDF8] hover:underline"
              >
                {isHi ? 'योजनाकार खोलें →' : 'Open Planner →'}
              </button>
            </div>

            <div className="space-y-2">
              {(!studyPlan?.todayTasks || studyPlan.todayTasks.length === 0) ? (
                <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-[#172033] border border-dashed border-black/10 dark:border-[#263449] text-center space-y-2">
                  <p className="text-xs text-black/60 dark:text-[#94A3B8]">
                    {isHi
                      ? 'आज के लिए कोई अध्ययन कार्य निर्धारित नहीं है।'
                      : 'No study tasks scheduled for today.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('button_click');
                      onNavigate('study_plan');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004741] text-[#F0EDE4] text-xs font-semibold hover:bg-[#003833] transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isHi ? 'दैनिक लक्ष्य बनाएं' : 'Create Daily Goals'}</span>
                  </button>
                </div>
              ) : (
                studyPlan.todayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (onToggleTask) {
                        soundManager.play('save');
                        onToggleTask(task.id);
                      } else {
                        onNavigate('study_plan');
                      }
                    }}
                    className="cursor-pointer p-2.5 rounded-xl bg-black/[0.02] dark:bg-[#172033] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-black/5 dark:border-[#263449]/60 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#004741] dark:text-[#38BDF8] shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-black/35 dark:text-[#94A3B8]/60 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            task.completed
                              ? 'line-through text-black/45 dark:text-[#94A3B8]/80'
                              : 'text-black dark:text-[#F1F5F9]'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                          {task.subject} · {task.durationMin} min
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4B. Recent Quizzes, Saved Answers & Uploaded Notes */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#004741] dark:text-[#38BDF8]" />
                <h3 className="text-xs sm:text-sm font-bold text-black dark:text-[#F1F5F9]">
                  {isHi ? 'क्विज़, सहेजे गए उत्तर और नोट्स' : 'Quizzes, Saved Answers & Notes'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('saved')}
                className="text-xs font-semibold text-[#004741] dark:text-[#38BDF8] hover:underline"
              >
                {isHi ? 'पुस्तकालय →' : 'Saved Library →'}
              </button>
            </div>

            <div className="space-y-2">
              {quizHistory.length === 0 && savedItems.length === 0 && uploadedNotes.length === 0 ? (
                <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-[#172033] border border-dashed border-black/10 dark:border-[#263449] text-center space-y-2">
                  <p className="text-xs text-black/60 dark:text-[#94A3B8]">
                    {isHi
                      ? 'कोई हाल की गतिविधि नहीं मिली। प्रश्नोत्तरी हल करें या नोट्स सहेजें।'
                      : 'No recent activity yet. Take a quiz or save answers to track progress.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('button_click');
                      onNavigate('quiz');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004741] text-[#F0EDE4] text-xs font-semibold hover:bg-[#003833] transition"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{isHi ? 'अभ्यास शुरू करें' : 'Start MCQ Practice'}</span>
                  </button>
                </div>
              ) : (
                <>
                  {quizHistory.slice(0, 1).map((qz) => (
                    <button
                      key={qz.id}
                      type="button"
                      onClick={() => onNavigate('quiz', qz.topic, qz.subject)}
                      className="w-full text-left p-2.5 rounded-xl bg-black/[0.02] dark:bg-[#172033] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-black/5 dark:border-[#263449]/60 flex items-center justify-between gap-2 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Award className="w-4 h-4 text-[#004741] dark:text-[#38BDF8] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-black dark:text-[#F1F5F9] truncate">
                            Quiz: {qz.subject} — {qz.topic}
                          </p>
                          <p className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                            Score: {qz.score}/{qz.total} ({qz.percentage}%) · {qz.timestamp}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {savedItems.slice(0, 1).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate('saved')}
                      className="w-full text-left p-2.5 rounded-xl bg-black/[0.02] dark:bg-[#172033] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-black/5 dark:border-[#263449]/60 flex items-center justify-between gap-2 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BookOpen className="w-4 h-4 text-[#004741] dark:text-[#38BDF8] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-black dark:text-[#F1F5F9] truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                            {item.subject} {item.marks ? `· ${item.marks}M` : ''} · {item.timestamp}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {uploadedNotes.slice(0, 1).map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => onNavigate('notes_upload')}
                      className="w-full text-left p-2.5 rounded-xl bg-black/[0.02] dark:bg-[#172033] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-black/5 dark:border-[#263449]/60 flex items-center justify-between gap-2 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UploadCloud className="w-4 h-4 text-[#004741] dark:text-[#38BDF8] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-black dark:text-[#F1F5F9] truncate">
                            {note.name}
                          </p>
                          <p className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                            {note.sizeFormatted} · {note.uploadedAt}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
