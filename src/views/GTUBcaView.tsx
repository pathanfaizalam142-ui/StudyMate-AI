import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  Layers,
  Search,
  CheckCircle2,
  HelpCircle,
  FileCheck2,
  Award,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Filter,
  Copy,
  Check,
  Bookmark,
  ExternalLink,
  BookMarked,
  Info,
  Calendar,
  Compass,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import {
  GTU_BCA_CURRICULUM,
  searchGTUBcaCurriculum,
  SearchResultItem,
} from '../data/gtuBcaCurriculum';
import {
  GTUSubject,
  GTUUnit,
  GTUTopic,
  GTUExamQuestion,
  NavigationTab,
  AppLanguage,
  AppTheme,
  SavedItem,
} from '../types';

interface GTUBcaViewProps {
  language: AppLanguage;
  theme: AppTheme;
  onNavigate: (
    tab: NavigationTab,
    initialQuery?: string,
    initialSubject?: string
  ) => void;
  onSaveItem: (item: Omit<SavedItem, 'id' | 'timestamp'>) => void;
}

export const GTUBcaView: React.FC<GTUBcaViewProps> = ({
  language,
  theme,
  onNavigate,
  onSaveItem,
}) => {
  // Navigation level state:
  // selectedSemester: 1..6
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('BCA302');
  const [selectedUnitNum, setSelectedUnitNum] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Subject view active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'syllabus' | 'questions' | 'exam_answers' | 'notes'
  >('syllabus');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Filter for questions by marks
  const [marksFilter, setMarksFilter] = useState<number | 'all'>('all');

  // Copied state
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState<number | null>(null);
  const [savedQuestionIndex, setSavedQuestionIndex] = useState<number | null>(null);

  // Current semester curriculum
  const currentSemesterData = useMemo(() => {
    return (
      GTU_BCA_CURRICULUM.find((s) => s.semester === selectedSemester) ||
      GTU_BCA_CURRICULUM[0]
    );
  }, [selectedSemester]);

  // Current selected subject
  const currentSubject: GTUSubject | undefined = useMemo(() => {
    const found = currentSemesterData.subjects.find(
      (s) => s.code === selectedSubjectCode
    );
    if (found) return found;
    return currentSemesterData.subjects[0];
  }, [currentSemesterData, selectedSubjectCode]);

  // Handle switching semester: smoothly reset or pick first subject
  const handleSelectSemester = (sem: number) => {
    soundManager.play('card_open');
    setSelectedSemester(sem);
    const targetSem = GTU_BCA_CURRICULUM.find((s) => s.semester === sem);
    if (targetSem && targetSem.subjects.length > 0) {
      setSelectedSubjectCode(targetSem.subjects[0].code);
      setSelectedUnitNum(null);
      setSelectedTopicId(null);
    }
  };

  // Handle selecting subject
  const handleSelectSubject = (code: string) => {
    soundManager.play('button_click');
    setSelectedSubjectCode(code);
    setSelectedUnitNum(null);
    setSelectedTopicId(null);
  };

  // Search results
  const searchResults: SearchResultItem[] = useMemo(() => {
    return searchGTUBcaCurriculum(searchQuery);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: SearchResultItem) => {
    soundManager.play('nav_tap');
    setSelectedSemester(result.semester);
    setSelectedSubjectCode(result.subjectCode);
    if (result.unitNumber) setSelectedUnitNum(result.unitNumber);
    if (result.topicId) setSelectedTopicId(result.topicId);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  // Collect all questions for currently selected subject
  const allSubjectQuestions = useMemo(() => {
    if (!currentSubject) return [];
    const list: {
      question: string;
      marks: number;
      unitName: string;
      topicTitle: string;
    }[] = [];

    currentSubject.units.forEach((u) => {
      u.topics.forEach((t) => {
        t.examQuestions?.forEach((eq) => {
          list.push({
            question: eq.question,
            marks: eq.marks,
            unitName: u.unitName,
            topicTitle: t.title,
          });
        });
      });
    });

    return list;
  }, [currentSubject]);

  const filteredQuestions = useMemo(() => {
    if (marksFilter === 'all') return allSubjectQuestions;
    return allSubjectQuestions.filter((q) => q.marks === marksFilter);
  }, [allSubjectQuestions, marksFilter]);

  // Launch direct Ask AI with Academic Context
  const handleLaunchAskAI = (topicTitle?: string, customPrompt?: string) => {
    soundManager.play('button_click');
    const prompt =
      customPrompt ||
      `Explain ${topicTitle || currentSubject?.name} in detail with GTU university syllabus context, formal definitions, and examples.`;
    const subjectContext = currentSubject
      ? `${currentSubject.name} (${currentSubject.code}, Sem ${selectedSemester})`
      : 'GTU BCA';
    onNavigate('ask_ai', prompt, subjectContext);
  };

  // Launch Exam Answer with preset Marks
  const handleLaunchExamAnswer = (questionText: string, marks: number) => {
    soundManager.play('button_click');
    const subjectContext = currentSubject
      ? `${currentSubject.name}`
      : 'Operating System';
    onNavigate('exam_mode', questionText, subjectContext);
  };

  // Launch Quiz for Subject or Topic
  const handleLaunchQuiz = (topicTitle?: string) => {
    soundManager.play('button_click');
    const subjectContext = currentSubject?.name || 'Operating System';
    onNavigate(
      'quiz',
      topicTitle || currentSubject?.name || 'Core Concepts',
      subjectContext
    );
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(index);
    soundManager.play('save');
    setTimeout(() => setCopiedQuestionIndex(null), 2000);
  };

  const saveQuestionToNotebook = (
    q: { question: string; marks: number; unitName: string; topicTitle: string },
    index: number
  ) => {
    onSaveItem({
      title: `${q.marks}M GTU Question: ${q.question.slice(0, 60)}...`,
      type: 'exam_answer',
      content: `### GTU BCA Examination Question (${q.marks} Marks)\n**Subject:** ${currentSubject?.name} (${currentSubject?.code})\n**Unit:** ${q.unitName}\n**Topic:** ${q.topicTitle}\n\n**Question:**\n${q.question}\n\n*Use the 'Generate Exam Answer' button in StudyMate AI to retrieve the step-by-step scoring solution.*`,
      subject: currentSubject?.name || 'GTU BCA',
      marks: q.marks,
    });
    setSavedQuestionIndex(index);
    soundManager.play('save');
    setTimeout(() => setSavedQuestionIndex(null), 2000);
  };

  return (
    <div id="gtu-bca-portal" className="space-y-5 sm:space-y-6 pb-20 animate-fade-in w-full min-w-0">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#004741] to-[#002b27] text-[#F0EDE4] p-4 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[#6ee7b7] text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>GTU BCA Academic Curriculum Hub</span>
          </div>
          <h1 className="font-display font-black text-xl sm:text-3xl lg:text-4xl tracking-tight text-white leading-tight">
            {language === 'hi'
              ? 'गुजरात टेक्नोलॉजिकल यूनिवर्सिटी (GTU) BCA'
              : 'Gujarat Technological University (GTU) BCA'}
          </h1>
          <p className="text-xs sm:text-base text-[#F0EDE4]/80 leading-relaxed max-w-2xl">
            {language === 'hi'
              ? 'सेमेस्टर 1 से 6 तक का संपूर्ण आधिकारिक पाठ्यक्रम: विषय, इकाइयां, महत्वपूर्ण प्रश्न (2M, 3M, 5M, 7M, 10M, 15M), और AI परीक्षा तैयारी।'
              : 'Official Semester 1 to Semester 6 curriculum hierarchy: Subjects, Units, Topics, University Exam Questions (2M to 15M), and context-aware AI preparation.'}
          </p>
        </div>

        {/* Decorative Background Accent */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
          <GraduationCap className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* Global Curriculum Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-white dark:bg-[#0c120f] border border-black/10 dark:border-white/10 rounded-2xl p-2.5 shadow-sm focus-within:ring-2 focus-within:ring-[#004741]">
          <Search className="w-5 h-5 text-black/40 dark:text-[#F0EDE4]/40 ml-2" />
          <input
            id="gtu-curriculum-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder={
              language === 'hi'
                ? 'GTU BCA में खोजें (उदा. Java, Deadlock, OSI, DBMS, 10 Marks)...'
                : 'Search GTU BCA syllabus (e.g. Java, Deadlock, OSI Model, Normalization, 10 Marks)...'
            }
            className="flex-1 bg-transparent border-none text-sm text-black dark:text-[#F0EDE4] placeholder-black/40 dark:placeholder-[#F0EDE4]/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold px-2 py-1 rounded bg-black/5 dark:bg-white/10 text-black/60 dark:text-[#F0EDE4]/60"
            >
              Clear
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim().length >= 2 && (
          <div
            id="gtu-search-dropdown"
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#0c120f] border border-black/15 dark:border-white/15 rounded-2xl shadow-xl max-h-80 overflow-y-auto p-2 divide-y divide-black/5 dark:divide-white/5"
          >
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-black/50 dark:text-[#F0EDE4]/50">
                No syllabus topics matching "{searchQuery}".
              </div>
            ) : (
              searchResults.map((item, idx) => (
                <button
                  key={`${item.subjectCode}-${item.type}-${idx}`}
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left p-3 hover:bg-[#004741]/5 dark:hover:bg-[#004741]/20 rounded-xl transition flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#004741]/10 dark:bg-[#004741]/30 text-[#004741] dark:text-[#6ee7b7]">
                        Sem {item.semester}
                      </span>
                      <span className="text-xs font-bold text-black/70 dark:text-[#F0EDE4]/70">
                        {item.subjectCode} - {item.subjectName}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-black dark:text-[#F0EDE4]">
                      {item.matchText}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black/40 dark:text-[#F0EDE4]/40 group-hover:text-[#004741] dark:group-hover:text-[#6ee7b7] transition-transform group-hover:translate-x-1" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* SEMESTER SELECTOR (1 to 6) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-[#F0EDE4]/50 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'सेमेस्टर चुनें' : 'Select Semester'}</span>
          </h2>
          <span className="text-xs font-semibold text-[#004741] dark:text-[#6ee7b7]">
            {currentSemesterData.subjects.length} GTU Subjects Available
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5, 6].map((sem) => {
            const isSelected = selectedSemester === sem;
            return (
              <button
                key={`sem-btn-${sem}`}
                id={`semester-tab-${sem}`}
                onClick={() => handleSelectSemester(sem)}
                className={`py-3 px-2 rounded-xl text-center font-bold text-sm transition-all border ${
                  isSelected
                    ? 'bg-[#004741] text-[#F0EDE4] border-[#004741] shadow-sm scale-[1.02]'
                    : 'bg-white/80 dark:bg-[#0c120f]/80 text-black/80 dark:text-[#F0EDE4]/80 border-black/10 dark:border-white/10 hover:border-[#004741]/50'
                }`}
              >
                <div className="text-[10px] uppercase opacity-70 tracking-wider">
                  GTU BCA
                </div>
                <div className="text-base font-black">Sem {sem}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT: SUBJECTS LIST & DETAILED SUBJECT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SUBJECT CARDS FOR ACTIVE SEMESTER (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-[#F0EDE4]/50">
              {language === 'hi'
                ? `सेमेस्टर ${selectedSemester} के विषय`
                : `Semester ${selectedSemester} Subjects`}
            </span>
            <span className="text-[11px] font-semibold text-black/40 dark:text-[#F0EDE4]/40">
              {currentSemesterData.subjects.length} Total
            </span>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {currentSemesterData.subjects.map((subj) => {
              const isSelected = currentSubject?.code === subj.code;
              return (
                <button
                  key={subj.code}
                  id={`subject-card-${subj.code}`}
                  onClick={() => handleSelectSubject(subj.code)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-[#004741]/10 dark:bg-[#004741]/30 border-[#004741] dark:border-[#004741] shadow-sm'
                      : 'bg-white/70 dark:bg-[#0c120f]/70 border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/5 dark:bg-white/10 text-black/80 dark:text-[#F0EDE4]/80">
                      {subj.code}
                    </span>
                    <span className="text-[11px] font-semibold text-[#004741] dark:text-[#6ee7b7]">
                      {subj.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-black dark:text-[#F0EDE4] line-clamp-2">
                    {subj.name}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-black/50 dark:text-[#F0EDE4]/50 mt-1">
                    <span>{subj.units.length} Units</span>
                    <span>{subj.credits} Credits</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: SUBJECT PAGE / CURRICULUM WORKSPACE (8 cols on lg) */}
        {currentSubject && (
          <div className="lg:col-span-8 space-y-5">
            {/* Subject Header Card */}
            <div className="bg-white dark:bg-[#0c120f] border border-black/10 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-[#004741] text-[#F0EDE4]">
                      {currentSubject.code}
                    </span>
                    <span className="text-xs font-semibold text-black/60 dark:text-[#F0EDE4]/60">
                      Semester {selectedSemester} • {currentSubject.category}
                    </span>
                  </div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-black dark:text-[#F0EDE4] mt-1">
                    {currentSubject.name}
                  </h2>
                </div>

                {/* Quick Action Pills */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLaunchAskAI()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-[#003833] transition shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI</span>
                  </button>
                  <button
                    onClick={() => handleLaunchQuiz()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-black dark:text-[#F0EDE4] text-xs font-bold hover:bg-black/10 dark:hover:bg-white/20 transition"
                  >
                    <Award className="w-3.5 h-3.5 text-[#004741] dark:text-[#6ee7b7]" />
                    <span>Quiz</span>
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-black/70 dark:text-[#F0EDE4]/70 leading-relaxed">
                {currentSubject.description}
              </p>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-2 pb-1 border-t border-black/5 dark:border-white/5 no-scrollbar">
                {[
                  {
                    id: 'syllabus' as const,
                    label: language === 'hi' ? 'इकाइयाँ व विषय' : 'Units & Topics',
                    icon: Layers,
                  },
                  {
                    id: 'questions' as const,
                    label: language === 'hi' ? 'महत्वपूर्ण प्रश्न' : 'Important Questions',
                    icon: HelpCircle,
                    badge: `${allSubjectQuestions.length}`,
                  },
                  {
                    id: 'exam_answers' as const,
                    label: language === 'hi' ? 'परीक्षा उत्तर जनरेटर' : 'Exam Answer System',
                    icon: FileCheck2,
                  },
                  {
                    id: 'notes' as const,
                    label: language === 'hi' ? 'अध्ययन नोट्स' : 'Study Notes',
                    icon: BookOpen,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        soundManager.play('nav_tap');
                        setActiveSubTab(tab.id);
                      }}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                          : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#F0EDE4]/70 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] ${
                            isActive
                              ? 'bg-black/30 text-white'
                              : 'bg-black/10 dark:bg-white/20 text-black/80 dark:text-[#F0EDE4]'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB 1: UNITS & TOPICS */}
            {activeSubTab === 'syllabus' && (
              <div className="space-y-4">
                {currentSubject.units.map((unit) => {
                  const isUnitOpen =
                    selectedUnitNum === null || selectedUnitNum === unit.unitNumber;

                  return (
                    <div
                      key={`unit-${unit.unitNumber}`}
                      className="bg-white dark:bg-[#0c120f] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm"
                    >
                      {/* Unit Header */}
                      <button
                        onClick={() => {
                          soundManager.play('nav_tap');
                          setSelectedUnitNum(
                            selectedUnitNum === unit.unitNumber ? null : unit.unitNumber
                          );
                        }}
                        className="w-full text-left p-4 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between border-b border-black/5 dark:border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#004741]/10 dark:bg-[#004741]/30 text-[#004741] dark:text-[#6ee7b7] font-bold text-xs flex items-center justify-center">
                            U{unit.unitNumber}
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-black dark:text-[#F0EDE4]">
                              {unit.unitName}
                            </h4>
                            <p className="text-[11px] text-black/50 dark:text-[#F0EDE4]/50">
                              Weightage: {unit.weightage || '25%'} • {unit.topics.length}{' '}
                              Topics
                            </p>
                          </div>
                        </div>

                        <ChevronDown
                          className={`w-4 h-4 text-black/40 dark:text-[#F0EDE4]/40 transition-transform ${
                            isUnitOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Topics List */}
                      {isUnitOpen && (
                        <div className="p-4 divide-y divide-black/5 dark:divide-white/5 space-y-3">
                          {unit.topics.map((topic) => {
                            const isTopicActive = selectedTopicId === topic.id;
                            return (
                              <div
                                key={topic.id}
                                className="pt-3 first:pt-0 space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#004741] dark:bg-[#6ee7b7]" />
                                    <h5 className="font-bold text-sm text-black dark:text-[#F0EDE4]">
                                      {topic.title}
                                    </h5>
                                  </div>

                                  {/* Important Marks Pills */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-black/40 dark:text-[#F0EDE4]/40">
                                      Marks:
                                    </span>
                                    {topic.importantMarks.map((m) => (
                                      <button
                                        key={`m-${topic.id}-${m}`}
                                        onClick={() =>
                                          handleLaunchExamAnswer(
                                            `Explain ${topic.title} in detail for ${m} marks with diagrams, definitions, and university scoring points.`,
                                            m
                                          )
                                        }
                                        title={`Generate ${m} Marks Answer`}
                                        className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#004741]/10 dark:bg-[#004741]/30 hover:bg-[#004741] hover:text-[#F0EDE4] text-[#004741] dark:text-[#6ee7b7] transition"
                                      >
                                        {m}M
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <p className="text-xs text-black/70 dark:text-[#F0EDE4]/70 leading-relaxed pl-4">
                                  {topic.summary}
                                </p>

                                {/* Action bar for this topic */}
                                <div className="flex items-center gap-2 pl-4 pt-1">
                                  <button
                                    onClick={() => handleLaunchAskAI(topic.title)}
                                    className="text-xs font-bold text-[#004741] dark:text-[#6ee7b7] hover:underline inline-flex items-center gap-1"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Ask AI about topic</span>
                                  </button>
                                  <span className="text-black/30 dark:text-white/30">•</span>
                                  <button
                                    onClick={() => handleLaunchQuiz(topic.title)}
                                    className="text-xs font-bold text-black/60 dark:text-[#F0EDE4]/60 hover:text-black dark:hover:text-[#F0EDE4] inline-flex items-center gap-1"
                                  >
                                    <Award className="w-3 h-3" />
                                    <span>Practice MCQs</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: IMPORTANT QUESTIONS (WITH MARKS FILTER) */}
            {activeSubTab === 'questions' && (
              <div className="space-y-4">
                {/* Marks Filter Buttons */}
                <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#0c120f] border border-black/10 dark:border-white/10 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-black/60 dark:text-[#F0EDE4]/60 mr-2">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter Marks:</span>
                  </div>

                  {(['all', 2, 3, 5, 7, 10, 15] as const).map((m) => {
                    const isSelected = marksFilter === m;
                    return (
                      <button
                        key={`filter-${m}`}
                        onClick={() => {
                          soundManager.play('nav_tap');
                          setMarksFilter(m);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                            : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#F0EDE4]/70 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        {m === 'all' ? 'All Marks' : `${m} Marks`}
                      </button>
                    );
                  })}
                </div>

                {/* Questions Grid */}
                {filteredQuestions.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-[#0c120f] rounded-2xl border border-black/10 dark:border-white/10 text-sm text-black/50 dark:text-[#F0EDE4]/50">
                    No questions found for the selected filter.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQuestions.map((item, idx) => (
                      <div
                        key={`q-${idx}`}
                        className="bg-white dark:bg-[#0c120f] border border-black/10 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-3 hover:border-black/20 dark:hover:border-white/20 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-xs font-black bg-[#004741] text-[#F0EDE4]">
                                {item.marks} Marks
                              </span>
                              <span className="text-[11px] font-semibold text-black/50 dark:text-[#F0EDE4]/50">
                                {item.unitName} • {item.topicTitle}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-black dark:text-[#F0EDE4] leading-snug">
                              {item.question}
                            </h4>
                          </div>
                        </div>

                        {/* Question Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                          <button
                            onClick={() =>
                              handleLaunchExamAnswer(item.question, item.marks)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-[#003833] transition shadow-sm"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Generate {item.marks}M Exam Answer</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(item.question, idx)}
                              title="Copy Question"
                              className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-[#F0EDE4]/60 transition"
                            >
                              {copiedQuestionIndex === idx ? (
                                <Check className="w-3.5 h-3.5 text-[#004741] dark:text-[#6ee7b7]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => saveQuestionToNotebook(item, idx)}
                              title="Bookmark Question"
                              className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-[#F0EDE4]/60 transition"
                            >
                              {savedQuestionIndex === idx ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#004741] dark:text-[#6ee7b7]" />
                              ) : (
                                <Bookmark className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: EXAM ANSWER SYSTEM (Quick Generator) */}
            {activeSubTab === 'exam_answers' && (
              <div className="bg-white dark:bg-[#0c120f] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="font-display font-black text-lg text-black dark:text-[#F0EDE4]">
                    GTU University Exam Answer Generator
                  </h3>
                  <p className="text-xs text-black/60 dark:text-[#F0EDE4]/60">
                    Instantly craft answers structured for GTU scoring schemes: formal
                    definition, architectural diagram, core points, code/derivation,
                    and evaluation criteria.
                  </p>
                </div>

                {/* Direct Marks Selector Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-[#F0EDE4]/60">
                    Choose Mark Allocation:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[2, 3, 5, 7, 10, 15].map((m) => (
                      <button
                        key={`exam-launch-m-${m}`}
                        onClick={() =>
                          handleLaunchExamAnswer(
                            `Explain key concepts in ${currentSubject.name} for a ${m}-mark GTU examination question with diagrams and examples.`,
                            m
                          )
                        }
                        className="p-3 rounded-xl border border-black/10 dark:border-white/10 hover:border-[#004741] dark:hover:border-[#6ee7b7] text-center font-bold transition hover:scale-105"
                      >
                        <div className="text-lg font-black text-[#004741] dark:text-[#6ee7b7]">
                          {m}M
                        </div>
                        <div className="text-[10px] text-black/50 dark:text-[#F0EDE4]/50">
                          {m === 2 || m === 3
                            ? 'Short Answer'
                            : m === 5 || m === 7
                            ? 'Detailed'
                            : 'Full Essay'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Topics to Generate */}
                <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-[#F0EDE4]/60">
                    Quick-Start Exam Questions for {currentSubject.shortName || currentSubject.name}:
                  </span>
                  <div className="space-y-2">
                    {allSubjectQuestions.slice(0, 4).map((q, idx) => (
                      <button
                        key={`quick-q-${idx}`}
                        onClick={() => handleLaunchExamAnswer(q.question, q.marks)}
                        className="w-full text-left p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] hover:bg-[#004741]/10 dark:hover:bg-[#004741]/20 border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 group transition"
                      >
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#004741] text-[#F0EDE4]">
                            {q.marks} Marks
                          </span>
                          <p className="text-xs font-bold text-black dark:text-[#F0EDE4] group-hover:text-[#004741] dark:group-hover:text-[#6ee7b7]">
                            {q.question}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-black/30 dark:text-white/30 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STUDY NOTES & SUMMARIES */}
            {activeSubTab === 'notes' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-[#0c120f] border border-black/10 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-black text-lg text-black dark:text-[#F0EDE4]">
                        {currentSubject.name} High-Yield Notes
                      </h3>
                      <p className="text-xs text-black/60 dark:text-[#F0EDE4]/60">
                        Synthesized textbook definitions, key formulas, and exam scoring patterns.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleLaunchAskAI(
                          undefined,
                          `Generate comprehensive revision study notes for ${currentSubject.name} (${currentSubject.code}) covering all key definitions and high-weightage topics.`
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-[#003833] transition shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Full Subject Notes</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {currentSubject.units.map((unit) => (
                      <div
                        key={`note-card-${unit.unitNumber}`}
                        className="p-4 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#004741] dark:text-[#6ee7b7]">
                            Unit {unit.unitNumber}
                          </span>
                          <span className="text-[10px] text-black/40 dark:text-[#F0EDE4]/40">
                            Weightage: {unit.weightage || '25%'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-black dark:text-[#F0EDE4]">
                          {unit.unitName}
                        </h4>
                        <ul className="text-xs text-black/70 dark:text-[#F0EDE4]/70 space-y-1 list-disc list-inside">
                          {unit.topics.slice(0, 3).map((t) => (
                            <li key={t.id} className="truncate">
                              {t.title}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() =>
                            handleLaunchAskAI(
                              unit.unitName,
                              `Summarize Unit ${unit.unitNumber}: ${unit.unitName} of ${currentSubject.name} with key exam points and formulas.`
                            )
                          }
                          className="pt-2 text-xs font-bold text-[#004741] dark:text-[#6ee7b7] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Review Unit Summary</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
