import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  BookOpen,
  FileText,
  Sparkles,
  Search,
  ChevronRight,
  ChevronDown,
  Award,
  Layers,
  Bookmark,
  ArrowRight,
  Download,
  HelpCircle,
  Eye,
  Compass,
  FileCheck2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  GTU_BCA_CURRICULUM,
} from '../data/gtuBcaCurriculum';
import { paperService } from '../services/paperService';
import { api } from '../services/api';
import { PDFViewerModal } from '../components/PDFViewerModal';
import {
  AppLanguage,
  CanonicalSubjectPaperRecord,
  GTUSemesterCurriculum,
  GTUSubject,
  GTUQuestionPaper,
  NavigationTab,
  SavedItem,
} from '../types';
import { soundManager } from '../services/soundManager';

interface GTUBcaViewProps {
  language: AppLanguage;
  onNavigate: (tab: NavigationTab, initialQuery?: string, initialSubject?: string) => void;
  onSaveAnswer: (item: Omit<SavedItem, 'id' | 'timestamp'>) => void;
  initialSubjectName?: string;
  initialSubTab?: string;
  workspaceMode?: 'curriculum' | 'materials';
}

type SubjectSubTab = 'overview' | 'syllabus' | 'materials' | 'papers' | 'practice';

export const GTUBcaView: React.FC<GTUBcaViewProps> = ({
  language,
  onNavigate,
  onSaveAnswer,
  initialSubjectName,
  initialSubTab,
  workspaceMode = 'curriculum',
}) => {
  const isHi = language === 'hi';
  const [selectedSem, setSelectedSem] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<GTUSubject | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<SubjectSubTab>(
    workspaceMode === 'materials' ? 'materials' : 'overview'
  );
  const [expandedUnit, setExpandedUnit] = useState<number | null>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarksFilter, setSelectedMarksFilter] = useState<number | 'all'>('all');
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gtu_bca_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Live SQLite Curriculum & Study Materials state
  const [liveSemesters, setLiveSemesters] = useState<GTUSemesterCurriculum[]>(GTU_BCA_CURRICULUM);
  const [sqliteMaterials, setSqliteMaterials] = useState<any[]>([]);
  const [selectedMaterialPreview, setSelectedMaterialPreview] = useState<any | null>(null);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<number | 'all'>('all');
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState<boolean>(false);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(false);
  const [materialsError, setMaterialsError] = useState<string | null>(null);

  // Canonical SQLite Papers state
  const [canonicalSubjectPapers, setCanonicalSubjectPapers] = useState<CanonicalSubjectPaperRecord[]>([]);
  const [previewPaper, setPreviewPaper] = useState<GTUQuestionPaper | null>(null);

  const fetchLiveCurriculum = useCallback(async () => {
    setIsLoadingCurriculum(true);
    setCurriculumError(null);
    try {
      const res = await api.getCurriculum();
      if (Array.isArray(res?.semesters) && res.semesters.length > 0) {
        const dynamicSemesters: GTUSemesterCurriculum[] = res.semesters.map((dbSem: any) => {
          const staticSem = GTU_BCA_CURRICULUM.find(
            (s) => s.semester === Number(dbSem.semester)
          );
          const subjects: GTUSubject[] = (dbSem.subjects || []).map((dbSubj: any) => {
            const staticSubj = staticSem?.subjects?.find(
              (s) => s.code.toUpperCase() === String(dbSubj.code).toUpperCase()
            );
            const units = (dbSubj.units || []).map((u: any, uIdx: number) => {
              const staticUnit =
                staticSubj?.units?.find((su) => su.unitNumber === u.unitNumber) ||
                staticSubj?.units?.[uIdx];
              const topics = (u.topics || []).map((t: any, tIdx: number) => {
                const staticTopic =
                  staticUnit?.topics?.find(
                    (st) => st.title.toLowerCase() === String(t.title).toLowerCase()
                  ) || staticUnit?.topics?.[tIdx];
                return {
                  id: t.id || `${dbSubj.code}-u${u.unitNumber}-t${tIdx + 1}`,
                  title: t.title,
                  summary: t.summary || staticTopic?.summary || '',
                  importantMarks:
                    Array.isArray(t.importantMarks) && t.importantMarks.length > 0
                      ? t.importantMarks
                      : staticTopic?.importantMarks || [3, 5, 7],
                  examQuestions: staticTopic?.examQuestions || [],
                  notes: staticTopic?.notes,
                };
              });
              return {
                id: u.id,
                unitNumber: u.unitNumber,
                unitName: u.unitName,
                weightage: u.weightage || staticUnit?.weightage || '25%',
                topics,
              };
            });
            return {
              id: dbSubj.id,
              code: dbSubj.code,
              name: dbSubj.name,
              shortName: dbSubj.shortName || dbSubj.name,
              category: dbSubj.category || staticSubj?.category || 'Core',
              credits: dbSubj.credits ?? staticSubj?.credits ?? 4,
              description: dbSubj.description || staticSubj?.description || '',
              units,
            };
          });
          return {
            semester: Number(dbSem.semester),
            title: dbSem.title || staticSem?.title || `Semester ${dbSem.semester}`,
            description: staticSem?.description || `GTU BCA Semester ${dbSem.semester} Curriculum`,
            subjects,
          };
        });
        setLiveSemesters(dynamicSemesters);
      }
    } catch {
      setCurriculumError(
        isHi
          ? 'लाइव पाठ्यक्रम लोड करने में असमर्थ। ऑफ़लाइन डेटा प्रदर्शित हो रहा है।'
          : 'Unable to sync live curriculum. Displaying offline syllabus.'
      );
    } finally {
      setIsLoadingCurriculum(false);
    }
  }, [isHi]);

  const fetchLiveMaterials = useCallback(async () => {
    setIsLoadingMaterials(true);
    setMaterialsError(null);
    try {
      const res = await api.getStudyMaterials();
      if (Array.isArray(res?.materials)) {
        setSqliteMaterials(res.materials);
      }
    } catch {
      setMaterialsError(
        isHi
          ? 'सत्यापित अध्ययन सामग्री लोड करने में समस्या आई।'
          : 'Failed to fetch verified study materials.'
      );
    } finally {
      setIsLoadingMaterials(false);
    }
  }, [isHi]);

  useEffect(() => {
    let mounted = true;
    paperService
      .fetchCanonicalPapers()
      .then((groups) => {
        if (!mounted) return;
        setCanonicalSubjectPapers(groups.flatMap((g) => g.subjects));
      })
      .catch(() => {});

    fetchLiveMaterials();
    fetchLiveCurriculum();

    return () => {
      mounted = false;
    };
  }, [fetchLiveCurriculum, fetchLiveMaterials]);

  useEffect(() => {
    if (
      initialSubTab === 'overview' ||
      initialSubTab === 'syllabus' ||
      initialSubTab === 'materials' ||
      initialSubTab === 'papers' ||
      initialSubTab === 'practice'
    ) {
      setActiveSubTab(initialSubTab);
    } else if (workspaceMode === 'materials') {
      setActiveSubTab('materials');
    }
  }, [initialSubTab, workspaceMode]);

  useEffect(() => {
    if (initialSubjectName) {
      const target = initialSubjectName.toLowerCase();
      for (const sem of liveSemesters) {
        const match = sem.subjects.find(
          (s) =>
            s.name.toLowerCase() === target ||
            (s.shortName && s.shortName.toLowerCase() === target) ||
            s.code.toLowerCase() === target ||
            (s.shortName && target.includes(s.shortName.toLowerCase()))
        );
        if (match) {
          setSelectedSem(sem.semester);
          setSelectedSubject(match);
          if (
            initialSubTab === 'overview' ||
            initialSubTab === 'syllabus' ||
            initialSubTab === 'materials' ||
            initialSubTab === 'papers' ||
            initialSubTab === 'practice'
          ) {
            setActiveSubTab(initialSubTab);
          } else if (workspaceMode === 'materials') {
            setActiveSubTab('materials');
          } else {
            setActiveSubTab('overview');
          }
          break;
        }
      }
    } else if (workspaceMode === 'materials' && !selectedSubject) {
      const firstSubj = liveSemesters.find((s) => s.semester === selectedSem)?.subjects?.[0];
      if (firstSubj) {
        setSelectedSubject(firstSubj);
        setActiveSubTab('materials');
      }
    }
  }, [initialSubjectName, initialSubTab, workspaceMode, liveSemesters]);

  const currentSemData = useMemo(
    () => liveSemesters.find((s) => s.semester === selectedSem) || liveSemesters[0],
    [selectedSem, liveSemesters]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.trim().toLowerCase();
    const results: Array<{
      semester: number;
      subjectCode: string;
      subjectName: string;
      unitNumber?: number;
      unitName?: string;
      topicId?: string;
      topicTitle?: string;
      type: 'subject' | 'unit' | 'topic';
      matchText: string;
    }> = [];

    for (const sem of liveSemesters) {
      for (const subj of sem.subjects) {
        if (
          subj.name.toLowerCase().includes(q) ||
          subj.code.toLowerCase().includes(q) ||
          (subj.shortName && subj.shortName.toLowerCase().includes(q))
        ) {
          results.push({
            semester: sem.semester,
            subjectCode: subj.code,
            subjectName: subj.name,
            type: 'subject',
            matchText: `${subj.code}: ${subj.name}`,
          });
        }
        for (const unit of subj.units) {
          if (unit.unitName.toLowerCase().includes(q)) {
            results.push({
              semester: sem.semester,
              subjectCode: subj.code,
              subjectName: subj.name,
              unitNumber: unit.unitNumber,
              unitName: unit.unitName,
              type: 'unit',
              matchText: `Unit ${unit.unitNumber}: ${unit.unitName}`,
            });
          }
          for (const topic of unit.topics) {
            if (
              topic.title.toLowerCase().includes(q) ||
              topic.summary.toLowerCase().includes(q) ||
              topic.examQuestions?.some((eq) => eq.question.toLowerCase().includes(q))
            ) {
              results.push({
                semester: sem.semester,
                subjectCode: subj.code,
                subjectName: subj.name,
                unitNumber: unit.unitNumber,
                unitName: unit.unitName,
                topicId: topic.id,
                topicTitle: topic.title,
                type: 'topic',
                matchText: topic.title,
              });
            }
          }
        }
      }
    }
    return results.slice(0, 20);
  }, [searchQuery, liveSemesters]);

  const handleSelectSubject = (subj: GTUSubject, defaultTab?: SubjectSubTab) => {
    soundManager.play('card_open');
    setSelectedSubject(subj);
    setActiveSubTab(defaultTab || (workspaceMode === 'materials' ? 'materials' : 'overview'));
    setExpandedUnit(1);
    setSelectedMaterialPreview(null);
    setSelectedUnitFilter('all');
  };

  const handleToggleQuestionBookmark = (q: string, subj: GTUSubject, marks: number) => {
    soundManager.play('save');
    const exists = bookmarkedQuestions.includes(q);
    const updated = exists
      ? bookmarkedQuestions.filter((item) => item !== q)
      : [...bookmarkedQuestions, q];
    setBookmarkedQuestions(updated);
    localStorage.setItem('gtu_bca_bookmarks', JSON.stringify(updated));

    if (!exists) {
      onSaveAnswer({
        title: `[GTU ${marks}M Important] ${q}`,
        type: 'exam_answer',
        content: `**Subject:** ${subj.name} (${subj.code})\n**Expected Weightage:** ${marks} Marks\n\nClick "Generate Exam Answer" to get a complete GTU scoring solution for this question.`,
        subject: subj.name,
        marks,
      });
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('core')) return 'bg-emerald-950 text-emerald-300 border-emerald-500/30';
    if (lower.includes('program')) return 'bg-indigo-950 text-indigo-300 border-indigo-500/30';
    if (lower.includes('system')) return 'bg-amber-950 text-amber-300 border-amber-500/30';
    if (lower.includes('math')) return 'bg-purple-950 text-purple-300 border-purple-500/30';
    if (lower.includes('web')) return 'bg-cyan-950 text-cyan-300 border-cyan-500/30';
    return 'bg-slate-900 text-slate-300 border-slate-500/30';
  };

  const subjectSqliteMaterials = useMemo(() => {
    if (!selectedSubject) return [];
    const subjCodeUpper = selectedSubject.code.trim().toUpperCase();
    return sqliteMaterials.filter((m) => {
      const codeMatch =
        m.subjectCode && String(m.subjectCode).trim().toUpperCase() === subjCodeUpper;
      const idMatch =
        m.subjectId && selectedSubject.id && m.subjectId === selectedSubject.id;
      if (!codeMatch && !idMatch) return false;
      if (selectedUnitFilter !== 'all') {
        return m.unitNumber === selectedUnitFilter;
      }
      return true;
    });
  }, [sqliteMaterials, selectedSubject, selectedUnitFilter]);

  // Extract all important questions across units of the selected subject
  const subjectImportantQuestions = useMemo(() => {
    if (!selectedSubject) return [];
    const list: Array<{ question: string; marks: number; unit: number; topicTitle: string }> = [];
    for (const unit of selectedSubject.units) {
      for (const topic of unit.topics) {
        if (Array.isArray(topic.examQuestions) && topic.examQuestions.length > 0) {
          for (const eq of topic.examQuestions) {
            list.push({
              question: eq.question,
              marks: eq.marks,
              unit: unit.unitNumber,
              topicTitle: topic.title,
            });
          }
        } else {
          list.push({
            question: `Explain ${topic.title} in detail with suitable examples.`,
            marks: topic.importantMarks?.[0] || 7,
            unit: unit.unitNumber,
            topicTitle: topic.title,
          });
        }
      }
    }
    return list;
  }, [selectedSubject]);

  const workspaceTabs: Array<{
    id: SubjectSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'overview',
      label: isHi ? 'अवलोकन' : 'Overview',
      icon: Compass,
    },
    {
      id: 'syllabus',
      label: isHi ? 'पाठ्यक्रम' : 'Syllabus',
      icon: BookOpen,
    },
    {
      id: 'materials',
      label: isHi ? 'अध्ययन सामग्री' : 'Materials',
      icon: Layers,
    },
    {
      id: 'papers',
      label: isHi ? 'प्रश्न पत्र' : 'Papers',
      icon: FileText,
    },
    {
      id: 'practice',
      label: isHi ? 'अभ्यास' : 'Practice',
      icon: Award,
    },
  ];

  return (
    <div id="gtu-bca-view" className="space-y-5 pb-24 md:pb-10 w-full max-w-full overflow-hidden">
      {/* Error Feedback Banners */}
      {curriculumError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
          <span>{curriculumError}</span>
          <button
            type="button"
            onClick={fetchLiveCurriculum}
            className="font-bold underline hover:no-underline"
          >
            {isHi ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      )}
      {materialsError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
          <span>{materialsError}</span>
          <button
            type="button"
            onClick={fetchLiveMaterials}
            className="font-bold underline hover:no-underline"
          >
            {isHi ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      )}

      {/* =====================================================================
          PAGE HEADER + HIERARCHY BREADCRUMB (GTU BCA -> Semester -> Subject -> Workspace)
         ===================================================================== */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs space-y-4">
        {/* Academic Hierarchy Breadcrumb */}
        <nav
          aria-label="Academic Hierarchy"
          className="flex flex-wrap items-center gap-1.5 text-xs text-black/60 dark:text-[#94A3B8]"
        >
          <button
            type="button"
            onClick={() => setSelectedSubject(null)}
            className="font-semibold text-[#004741] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>
              {workspaceMode === 'materials'
                ? isHi
                  ? 'अध्ययन सामग्री'
                  : 'Study Materials'
                : 'GTU BCA'}
            </span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <button
            type="button"
            onClick={() => setSelectedSubject(null)}
            className={`font-semibold hover:underline ${
              !selectedSubject
                ? 'text-black dark:text-[#F1F5F9]'
                : 'text-black/65 dark:text-[#94A3B8]'
            }`}
          >
            {isHi ? `सेमेस्टर ${selectedSem}` : `Semester ${selectedSem}`}
          </button>
          {selectedSubject && (
            <>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              <span className="font-semibold text-black dark:text-[#F1F5F9] truncate max-w-[240px]">
                {selectedSubject.name} ({selectedSubject.code})
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              <span className="px-2 py-0.5 rounded-md bg-[#004741]/10 dark:bg-[#004741]/30 text-[#004741] dark:text-[#38BDF8] font-bold capitalize">
                {activeSubTab}
              </span>
            </>
          )}
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black tracking-tight text-black dark:text-[#F1F5F9]">
              {workspaceMode === 'materials'
                ? isHi
                  ? 'अध्ययन सामग्री, नोट्स और महत्वपूर्ण प्रश्न'
                  : 'Study Materials'
                : isHi
                ? 'GTU BCA पाठ्यक्रम और विषय कार्यक्षेत्र'
                : 'GTU BCA Curriculum'}
            </h1>
            <p className="text-xs sm:text-sm text-black/70 dark:text-[#94A3B8] leading-relaxed">
              {workspaceMode === 'materials'
                ? isHi
                  ? 'विषय-वार अध्ययन नोट्स, इकाई सारांश और उच्च प्राथमिकता वाले GTU परीक्षा प्रश्न।'
                  : 'Browse subject-isolated study notes, unit summaries, and high-weightage GTU examination questions.'
                : isHi
                ? 'सेमेस्टर 1 से 6 के विषयों का अवलोकन, पाठ्यक्रम, अध्ययन सामग्री, प्रश्न पत्र और अभ्यास।'
                : 'Navigate Semester 1–6 subjects to access syllabus units, study materials, verified GTU papers, and practice tools.'}
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-[#004741] dark:text-[#38BDF8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="gtu-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isHi
                    ? 'विषय, कोड या टॉपिक खोजें (जैसे DBMS, Java)...'
                    : 'Search subject, code or topic (e.g., DBMS, Java)...'
                }
                className="w-full pl-10 pr-14 py-2.5 rounded-xl bg-[#F0EDE4]/70 dark:bg-[#111827] border border-black/15 dark:border-[#263449] text-black dark:text-[#F1F5F9] placeholder-black/45 dark:placeholder-[#F0EDE4]/45 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004741]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#004741] dark:text-[#38BDF8] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          INSTANT SEARCH RESULTS OVERLAY
         ===================================================================== */}
      {searchQuery.trim().length > 0 && (
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-[#172033] border-2 border-[#004741] shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#004741] dark:text-emerald-400">
              {isHi
                ? `"${searchQuery}" के लिए खोज परिणाम (${searchResults.length})`
                : `Search Results for "${searchQuery}" (${searchResults.length})`}
            </h3>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-rose-500 hover:underline"
            >
              {isHi ? 'बंद करें' : 'Close Search'}
            </button>
          </div>

          {searchResults.length === 0 ? (
            <p className="text-xs text-black/60 dark:text-white/60 py-4 text-center">
              {isHi
                ? 'कोई विषय या टॉपिक नहीं मिला।'
                : 'No matching GTU BCA subject or topic found.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {searchResults.map((res, i) => (
                <div
                  key={`${res.subjectCode}-${i}`}
                  onClick={() => {
                    const targetSem = liveSemesters.find((s) => s.semester === res.semester);
                    const targetSubj = targetSem?.subjects.find(
                      (subj) => subj.code === res.subjectCode
                    );
                    if (targetSubj) {
                      setSelectedSem(res.semester);
                      handleSelectSubject(targetSubj);
                    }
                    setSearchQuery('');
                  }}
                  className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-[#004741] hover:text-white cursor-pointer transition-all group border border-black/10 dark:border-[#263449] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider opacity-75">
                      <span>Sem {res.semester}</span>
                      <span>•</span>
                      <span>{res.subjectCode}</span>
                      <span>•</span>
                      <span>{res.type}</span>
                    </div>
                    <h4 className="text-sm font-bold truncate mt-0.5">{res.subjectName}</h4>
                    <p className="text-xs opacity-75 truncate">{res.matchText}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SEMESTER SELECTOR TABS (SEM 1 TO SEM 6)
         ===================================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-black/60 dark:text-[#94A3B8]">
            {isHi ? 'सेमेस्टर चुनें (Semester 1–6)' : 'Select Academic Semester'}
          </span>
          {selectedSubject && (
            <button
              onClick={() => setSelectedSubject(null)}
              className="text-xs font-bold text-[#004741] dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>← {isHi ? 'सभी विषय देखें' : 'Back to Semester Subjects'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {liveSemesters.map((sem) => {
            const isSelected = selectedSem === sem.semester;
            const totalCredits = sem.subjects.reduce((acc, s) => acc + (s.credits || 4), 0);
            return (
              <button
                key={sem.semester}
                id={`gtu-sem-tab-${sem.semester}`}
                onClick={() => {
                  soundManager.play('nav_tap');
                  setSelectedSem(sem.semester);
                  if (workspaceMode === 'materials') {
                    const firstSubj = sem.subjects[0] || null;
                    setSelectedSubject(firstSubj);
                    setActiveSubTab('materials');
                  } else {
                    setSelectedSubject(null);
                  }
                }}
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#004741] text-[#F0EDE4] border-black dark:border-emerald-400 shadow-md scale-[1.02]'
                    : 'bg-white/85 dark:bg-[#172033]/90 text-black dark:text-[#F1F5F9] border-black/10 dark:border-[#263449] hover:border-[#004741]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-75">
                    SEM 0{sem.semester}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-emerald-300' : 'bg-black/20 dark:bg-white/20'
                    }`}
                  />
                </div>
                <div className="mt-1.5">
                  <div className="text-xs sm:text-sm font-display font-black truncate">
                    {isHi ? `सेमेस्टर ${sem.semester}` : `Semester ${sem.semester}`}
                  </div>
                  <div className="text-[10px] opacity-75 font-medium">
                    {sem.subjects.length} {isHi ? 'विषय' : 'Subjects'} • {totalCredits} Cr
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          MAIN CONTENT: EITHER SEMESTER SUBJECTS GRID OR SUBJECT WORKSPACE
         ===================================================================== */}
      {!selectedSubject ? (
        <div className="space-y-5">
          {/* Semester Overview Card */}
          <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/15 dark:border-[#263449] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#004741] dark:text-emerald-400">
                {currentSemData.title}
              </span>
              <h2 className="text-lg sm:text-xl font-display font-black text-black dark:text-[#F1F5F9] mt-0.5">
                {currentSemData.description}
              </h2>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-[#004741]/10 dark:bg-emerald-950/60 border border-[#004741]/20 dark:border-emerald-500/30 text-center">
                <div className="text-sm font-black text-[#004741] dark:text-emerald-300">
                  {currentSemData.subjects.length}
                </div>
                <div className="text-[10px] font-bold text-black/60 dark:text-white/60 uppercase">
                  Subjects
                </div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                <div className="text-sm font-black text-amber-700 dark:text-amber-300">
                  {currentSemData.subjects.reduce((acc, s) => acc + (s.credits || 4), 0)}
                </div>
                <div className="text-[10px] font-bold text-black/60 dark:text-white/60 uppercase">
                  Credits
                </div>
              </div>
            </div>
          </div>

          {/* Subjects Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSemData.subjects.map((subj) => (
              <div
                key={subj.code}
                id={`gtu-subject-card-${subj.code}`}
                onClick={() => handleSelectSubject(subj)}
                className="p-5 rounded-3xl bg-white/90 dark:bg-[#172033]/95 border border-black/15 dark:border-[#263449] hover:border-[#004741] dark:hover:border-emerald-400 transition-all cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-[11px] font-mono font-bold text-black/80 dark:text-white/90">
                      GTU #{subj.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getCategoryBadgeColor(
                        subj.category
                      )}`}
                    >
                      {subj.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-display font-black text-black dark:text-[#F1F5F9] group-hover:text-[#004741] dark:group-hover:text-emerald-300 transition-colors">
                      {subj.name}
                    </h3>
                    <p className="text-xs text-black/65 dark:text-[#94A3B8] line-clamp-2 mt-1 leading-relaxed">
                      {subj.description}
                    </p>
                  </div>

                  {/* Units Preview Pills */}
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {subj.units.map((u) => (
                      <span
                        key={u.unitNumber}
                        className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[10px] font-semibold text-black/70 dark:text-[#F1F5F9]/80"
                      >
                        U{u.unitNumber}: {u.unitName.split(' ')[0]}...
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Entry Footer */}
                <div className="mt-5 pt-3 border-t border-black/10 dark:border-[#263449] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/60 dark:text-[#94A3B8]">
                    <Layers className="w-3.5 h-3.5 text-[#004741] dark:text-emerald-400" />
                    <span>{subj.units.length} Units</span>
                    <span>•</span>
                    <span>{subj.credits} Cr</span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-black text-[#004741] dark:text-emerald-300 group-hover:translate-x-1 transition-transform">
                    <span>{isHi ? 'विषय खोलें' : 'Open Workspace'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ===================================================================
           SELECTED SUBJECT WORKSPACE (Overview | Syllabus | Materials | Papers | Practice)
           =================================================================== */
        <div className="space-y-5">
          {/* Quick Subject Switcher Bar for the Current Semester */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {currentSemData.subjects.map((subj) => {
              const active = subj.code === selectedSubject.code;
              return (
                <button
                  key={subj.code}
                  type="button"
                  onClick={() => handleSelectSubject(subj, activeSubTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                    active
                      ? 'bg-[#004741] text-[#F0EDE4] border-[#004741] shadow-xs'
                      : 'bg-white/80 dark:bg-[#172033] text-black/75 dark:text-[#F1F5F9]/80 border-black/10 dark:border-[#263449] hover:border-[#004741]'
                  }`}
                >
                  {subj.shortName || subj.name} ({subj.code})
                </button>
              );
            })}
          </div>

          {/* Subject Header Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#172033] border-2 border-[#004741] shadow-md space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#004741] text-white text-[11px] font-mono font-bold">
                    GTU Code: {selectedSubject.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-xs font-bold text-black dark:text-white">
                    Semester {selectedSem}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    {selectedSubject.credits} Credits
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${getCategoryBadgeColor(
                      selectedSubject.category
                    )}`}
                  >
                    {selectedSubject.category}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-black dark:text-[#F1F5F9]">
                  {selectedSubject.name}
                </h2>
                <p className="text-xs sm:text-sm text-black/70 dark:text-[#F1F5F9]/80 max-w-3xl">
                  {selectedSubject.description}
                </p>
              </div>

              {/* Action Buttons to AI Tutor & Exam Answer */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    soundManager.play('button_click');
                    onNavigate(
                      'ask_ai',
                      `Give me a complete overview and unit-wise revision strategy for GTU BCA subject ${selectedSubject.name} (${selectedSubject.code}).`,
                      selectedSubject.name
                    );
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#004741] hover:bg-[#003530] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isHi ? 'AI ट्यूटर से पूछें' : 'Ask AI Tutor'}</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.play('button_click');
                    onNavigate('exam_mode', '', selectedSubject.name);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white text-xs font-bold flex items-center gap-1.5 border border-black/15 dark:border-[#263449] transition-all"
                >
                  <FileText className="w-4 h-4 text-[#004741] dark:text-emerald-400" />
                  <span>{isHi ? 'परीक्षा उत्तर जनरेटर' : 'Exam Answer Mode'}</span>
                </button>
              </div>
            </div>

            {/* 5 Clean Sub-Navigation Tabs: Overview | Syllabus | Materials | Papers | Practice */}
            <div className="flex items-center gap-2 pt-3 border-t border-black/10 dark:border-[#263449] overflow-x-auto">
              {workspaceTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`gtu-subtab-${tab.id}`}
                    onClick={() => {
                      soundManager.play('nav_tap');
                      setActiveSubTab(tab.id);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                      active
                        ? 'bg-[#004741] text-white shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#94A3B8] hover:bg-black/10 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =================================================================
             TAB 1: OVERVIEW
             ================================================================= */}
          {activeSubTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-2">
                  <div className="text-xs font-bold text-black/55 dark:text-white/55 uppercase">
                    {isHi ? 'इकाइयाँ और पाठ्यक्रम' : 'Syllabus Structure'}
                  </div>
                  <div className="text-2xl font-display font-black text-black dark:text-[#F1F5F9]">
                    {selectedSubject.units.length} Units
                  </div>
                  <p className="text-xs text-black/65 dark:text-white/65">
                    {selectedSubject.units.reduce((acc, u) => acc + u.topics.length, 0)} core GTU
                    topics mapped with exam weightage.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('syllabus')}
                    className="text-xs font-bold text-[#004741] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    <span>{isHi ? 'पाठ्यक्रम देखें' : 'Explore Syllabus'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-2">
                  <div className="text-xs font-bold text-black/55 dark:text-white/55 uppercase">
                    {isHi ? 'अध्ययन सामग्री और महत्वपूर्ण प्रश्न' : 'Study Materials & Questions'}
                  </div>
                  <div className="text-2xl font-display font-black text-black dark:text-[#F1F5F9]">
                    {subjectSqliteMaterials.length + selectedSubject.units.length} Notes ·{' '}
                    {subjectImportantQuestions.length} Qs
                  </div>
                  <p className="text-xs text-black/65 dark:text-white/65">
                    Unit study notes, topic summaries, and GTU exam questions.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('materials')}
                    className="text-xs font-bold text-[#004741] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    <span>{isHi ? 'सामग्री खोलें' : 'Open Materials'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-2">
                  <div className="text-xs font-bold text-black/55 dark:text-white/55 uppercase">
                    {isHi ? 'प्रश्न पत्र और अभ्यास' : 'GTU Papers & Practice'}
                  </div>
                  <div className="text-2xl font-display font-black text-black dark:text-[#F1F5F9]">
                    70 Marks GTU Pattern
                  </div>
                  <p className="text-xs text-black/65 dark:text-white/65">
                    Official university question papers and subject-isolated MCQ practice.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('papers')}
                      className="text-xs font-bold text-[#004741] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isHi ? 'पेपर्स' : 'View Papers'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('practice')}
                      className="text-xs font-bold text-[#004741] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isHi ? 'अभ्यास' : 'Start Practice'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Unit Weightage Breakdown Table */}
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] space-y-3">
                <h3 className="text-sm font-bold text-black dark:text-[#F1F5F9]">
                  {isHi ? 'इकाई-वार परीक्षा भार और अवलोकन' : 'Unit-Wise Syllabus & Weightage Breakdown'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSubject.units.map((unit) => (
                    <button
                      key={unit.unitNumber}
                      type="button"
                      onClick={() => {
                        setExpandedUnit(unit.unitNumber);
                        setActiveSubTab('syllabus');
                      }}
                      className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-[#172033] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] border border-black/8 dark:border-[#263449] text-left flex items-center justify-between gap-3 transition"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono font-bold text-[#004741] dark:text-emerald-400">
                          Unit 0{unit.unitNumber} · {unit.weightage || '25%'} Weightage
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-black dark:text-[#F1F5F9] truncate mt-0.5">
                          {unit.unitName}
                        </div>
                        <div className="text-[11px] text-black/55 dark:text-white/55">
                          {unit.topics.length} {isHi ? 'टॉपिक्स' : 'topics'}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-black/40 dark:text-white/40 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
             TAB 2: SYLLABUS
             ================================================================= */}
          {activeSubTab === 'syllabus' && (
            <div className="space-y-3">
              {selectedSubject.units.map((unit) => {
                const isExpanded = expandedUnit === unit.unitNumber;
                return (
                  <div
                    key={unit.unitNumber}
                    className="rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/15 dark:border-[#263449] overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => {
                        soundManager.play('button_click');
                        setExpandedUnit(isExpanded ? null : unit.unitNumber);
                      }}
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-black/5 dark:hover:bg-[#1E293B] transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-[#004741] text-white flex flex-col items-center justify-center shrink-0 font-display font-black">
                          <span className="text-[9px] uppercase opacity-75 leading-none">UNIT</span>
                          <span className="text-sm leading-tight">0{unit.unitNumber}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-display font-black text-black dark:text-[#F1F5F9] truncate">
                            {unit.unitName}
                          </h3>
                          <p className="text-[11px] font-bold text-[#004741] dark:text-emerald-400">
                            {unit.topics.length} Core Topics • GTU Exam Weightage: {unit.weightage || '25%'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-[11px] font-bold text-black/70 dark:text-white/70">
                          {unit.weightage || '25%'}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-black/60 dark:text-white/60" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-black/60 dark:text-white/60" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-black/10 dark:border-[#263449] space-y-3 bg-black/[0.02] dark:bg-[#172033]">
                        <div className="grid grid-cols-1 gap-3 pt-3">
                          {unit.topics.map((topic, idx) => (
                            <div
                              key={topic.id || idx}
                              className="p-4 rounded-2xl bg-white dark:bg-[#172033] border border-black/10 dark:border-[#263449] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#004741] transition-all"
                            >
                              <div className="space-y-1 max-w-2xl">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-black text-[#004741] dark:text-emerald-400">
                                    {unit.unitNumber}.{idx + 1}
                                  </span>
                                  <h4 className="text-sm font-bold text-black dark:text-[#F1F5F9]">
                                    {topic.title}
                                  </h4>
                                  <div className="flex items-center gap-1">
                                    {topic.importantMarks.map((m) => (
                                      <span
                                        key={m}
                                        className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-black"
                                      >
                                        {m}M
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-black/70 dark:text-[#94A3B8] leading-relaxed">
                                  {topic.summary}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <button
                                  onClick={() => {
                                    soundManager.play('button_click');
                                    onNavigate(
                                      'ask_ai',
                                      `Explain the topic "${topic.title}" from Unit ${unit.unitNumber} (${unit.unitName}) of GTU BCA subject ${selectedSubject.name} (${selectedSubject.code}) with definition, diagram/example, and key exam points.`,
                                      selectedSubject.name
                                    );
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-[#004741] text-white text-[11px] font-bold hover:bg-[#003530] transition-colors flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-300" />
                                  <span>{isHi ? 'AI नोट्स' : 'Explain with AI'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    soundManager.play('button_click');
                                    onNavigate(
                                      'exam_mode',
                                      `Explain ${topic.title} in detail with suitable examples and architecture/diagram.`,
                                      selectedSubject.name
                                    );
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white text-[11px] font-bold transition-colors"
                                >
                                  {isHi ? '7M उत्तर' : '7M Exam Answer'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* =================================================================
             TAB 3: MATERIALS (SQLite Study Materials + Unit Notes + Important Questions)
             ================================================================= */}
          {activeSubTab === 'materials' && (
            <div className="space-y-6">
              {/* Section A: Published SQLite Study Materials (backed by SQLite database) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-black dark:text-[#F1F5F9]">
                      {isHi
                        ? 'सत्यापित विषय अध्ययन नोट्स (Study Materials)'
                        : 'Verified Subject Notes & Study Materials'}
                    </h3>
                    <p className="text-xs text-black/60 dark:text-[#94A3B8]">
                      {isHi
                        ? 'विश्वविद्यालय पाठ्यक्रम और प्रशासनिक समीक्षा के आधार पर सत्यापित अध्ययन सामग्री।'
                        : 'Curriculum-aligned notes, summaries, formula sheets, and study resources.'}
                    </p>
                  </div>

                  {/* Unit Filter Selector */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setSelectedUnitFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        selectedUnitFilter === 'all'
                          ? 'bg-[#004741] text-white shadow-xs'
                          : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70 hover:bg-black/10'
                      }`}
                    >
                      {isHi ? 'सभी इकाइयाँ' : 'All Units'}
                    </button>
                    {selectedSubject.units.map((u) => (
                      <button
                        key={u.unitNumber}
                        type="button"
                        onClick={() => setSelectedUnitFilter(u.unitNumber)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          selectedUnitFilter === u.unitNumber
                            ? 'bg-[#004741] text-white shadow-xs'
                            : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70 hover:bg-black/10'
                        }`}
                      >
                        Unit {u.unitNumber}
                      </button>
                    ))}
                  </div>
                </div>

                {isLoadingMaterials ? (
                  <div className="p-8 rounded-2xl bg-white/60 dark:bg-[#172033]/60 border border-black/10 dark:border-[#263449] text-center space-y-2">
                    <div className="inline-block w-6 h-6 border-2 border-[#004741] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-black/60 dark:text-[#94A3B8]">
                      {isHi ? 'अध्ययन सामग्री लोड हो रही है...' : 'Loading verified study materials...'}
                    </p>
                  </div>
                ) : subjectSqliteMaterials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjectSqliteMaterials.map((mat) => (
                      <div
                        key={mat.id}
                        className="p-5 rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/15 dark:border-[#263449] flex flex-col justify-between gap-4 shadow-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#004741]/10 dark:bg-emerald-950 text-[#004741] dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                              {mat.materialType || 'notes'}
                            </span>
                            {mat.unitNumber && (
                              <span className="text-[11px] font-mono text-black/55 dark:text-white/55">
                                Unit {mat.unitNumber}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-display font-black text-black dark:text-[#F1F5F9]">
                            {mat.title}
                          </h4>
                          {mat.summary && (
                            <p className="text-xs text-black/70 dark:text-[#94A3B8] leading-relaxed">
                              {mat.summary}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/10 dark:border-[#263449]">
                          {mat.contentMarkdown && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedMaterialPreview(
                                  selectedMaterialPreview?.id === mat.id ? null : mat
                                )
                              }
                              className="px-3.5 py-2 rounded-xl bg-[#004741] text-white text-xs font-bold hover:bg-[#003530] transition-colors flex items-center gap-1.5"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>
                                {selectedMaterialPreview?.id === mat.id
                                  ? isHi
                                    ? 'नोट्स छुपाएं'
                                    : 'Hide Notes'
                                  : isHi
                                  ? 'नोट्स पढ़ें'
                                  : 'Read Notes'}
                              </span>
                            </button>
                          )}
                          {(mat.fileUrl || mat.externalUrl) && (
                            <a
                              href={mat.fileUrl || mat.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-[#004741] hover:text-white text-black dark:text-[#F1F5F9] text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{isHi ? 'संसाधन खोलें' : 'Open Resource'}</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              onSaveAnswer({
                                title: `[Study Material] ${mat.title}`,
                                type: 'note',
                                content: mat.contentMarkdown || mat.summary || mat.title,
                                subject: selectedSubject.name,
                              });
                            }}
                            className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-black dark:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>{isHi ? 'सहेजें' : 'Save to Library'}</span>
                          </button>
                        </div>

                        {selectedMaterialPreview?.id === mat.id && mat.contentMarkdown && (
                          <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-[#172033] border border-black/10 dark:border-[#263449] text-xs text-black dark:text-[#F1F5F9] whitespace-pre-wrap leading-relaxed">
                            {mat.contentMarkdown}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#172033]/70 border border-dashed border-black/15 dark:border-[#263449] text-center space-y-1.5">
                    <p className="text-xs font-bold text-black/70 dark:text-[#94A3B8]">
                      {selectedUnitFilter !== 'all'
                        ? isHi
                          ? `इकाई ${selectedUnitFilter} के लिए अभी कोई अध्ययन सामग्री उपलब्ध नहीं है।`
                          : `No study materials available for Unit ${selectedUnitFilter} yet.`
                        : isHi
                        ? 'इस विषय के लिए अभी कोई अध्ययन सामग्री उपलब्ध नहीं है।'
                        : 'No study materials available for this subject yet.'}
                    </p>
                    <p className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                      {isHi
                        ? 'नीचे दी गई इकाई अध्ययन नोट्स और महत्वपूर्ण GTU परीक्षा प्रश्नों से तैयारी करें।'
                        : 'You can explore unit concept summaries below or practice high-weightage GTU exam questions.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Section B: Unit-Wise Revision Notes & Study Summaries */}
              <div className="space-y-3">
                <h3 className="text-sm sm:text-base font-bold text-black dark:text-[#F1F5F9]">
                  {isHi
                    ? 'इकाई-वार संशोधन नोट्स और सारांश'
                    : 'Unit-Wise Study Notes & Concept Summaries'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSubject.units.map((unit) => (
                    <div
                      key={unit.unitNumber}
                      className="p-5 rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/15 dark:border-[#263449] flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#004741]/10 dark:bg-emerald-950 text-[#004741] dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                            Unit 0{unit.unitNumber} Notes
                          </span>
                          <span className="text-[11px] font-semibold text-black/60 dark:text-white/60">
                            Weightage: {unit.weightage || '25%'}
                          </span>
                        </div>
                        <h4 className="text-base font-display font-black text-black dark:text-[#F1F5F9]">
                          {unit.unitName}
                        </h4>
                        <ul className="space-y-1 text-xs text-black/70 dark:text-[#94A3B8]">
                          {unit.topics.map((t) => (
                            <li key={t.id} className="line-clamp-1">
                              • <span className="font-semibold">{t.title}:</span> {t.summary}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/10 dark:border-[#263449]">
                        <button
                          onClick={() => {
                            soundManager.play('button_click');
                            onNavigate(
                              'ask_ai',
                              `Provide comprehensive unit revision notes, important definitions, formulas/syntax, and exam cheatsheet for Unit ${unit.unitNumber}: "${unit.unitName}" in GTU BCA subject ${selectedSubject.name} (${selectedSubject.code}).`,
                              selectedSubject.name
                            );
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#004741] text-white text-xs font-bold hover:bg-[#003530] transition-colors flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>{isHi ? 'AI संशोधन नोट्स जनरेट करें' : 'Generate Unit Notes'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section C: High-Priority GTU Important Questions */}
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#004741] dark:text-emerald-400" />
                    <span className="text-xs sm:text-sm font-bold text-black dark:text-[#F1F5F9]">
                      {isHi
                        ? 'उच्च प्राथमिकता वाले GTU परीक्षा प्रश्न:'
                        : 'High-Priority GTU Exam Questions (Filter by Marks):'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(['all', 3, 5, 7, 10] as const).map((m) => (
                      <button
                        key={String(m)}
                        onClick={() => setSelectedMarksFilter(m)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          selectedMarksFilter === m
                            ? 'bg-[#004741] text-white'
                            : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70'
                        }`}
                      >
                        {m === 'all' ? (isHi ? 'सभी (All)' : 'All Marks') : `${m} Marks`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {subjectImportantQuestions
                    .filter(
                      (iq) => selectedMarksFilter === 'all' || iq.marks === selectedMarksFilter
                    )
                    .map((iq, idx) => {
                      const isBookmarked = bookmarkedQuestions.includes(iq.question);
                      return (
                        <div
                          key={idx}
                          className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/15 dark:border-[#263449] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#004741] transition-all"
                        >
                          <div className="space-y-1.5 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-[#004741] text-white text-[10px] font-black uppercase">
                                {iq.marks} Marks
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[11px] font-bold text-black/70 dark:text-white/70">
                                Unit {iq.unit}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-black">
                                {iq.topicTitle}
                              </span>
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-black dark:text-[#F1F5F9]">
                              {iq.question}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() =>
                                handleToggleQuestionBookmark(
                                  iq.question,
                                  selectedSubject,
                                  iq.marks
                                )
                              }
                              title="Bookmark Question"
                              className={`p-2.5 rounded-xl border transition-colors ${
                                isBookmarked
                                  ? 'bg-amber-500 text-black border-amber-600'
                                  : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border-black/10 dark:border-[#263449]'
                              }`}
                            >
                              <Bookmark className="w-4 h-4 fill-current" />
                            </button>

                            <button
                              onClick={() => {
                                soundManager.play('button_click');
                                onNavigate('exam_mode', iq.question, selectedSubject.name);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-[#004741] hover:bg-[#003530] text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>{isHi ? 'पूरा उत्तर लिखें' : 'Generate Answer'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
             TAB 4: PAPERS (Verified GTU Previous Year Question Papers)
             ================================================================= */}
          {activeSubTab === 'papers' && (
            <div className="space-y-4">
              {(() => {
                const canonicalRecord = canonicalSubjectPapers.find(
                  (r) => r.subjectCode.toUpperCase() === selectedSubject.code.toUpperCase()
                );
                const isVerifiedAvailable = Boolean(
                  canonicalRecord?.isAvailable && canonicalRecord?.paper
                );
                const activePaper = canonicalRecord?.paper || null;

                return (
                  <>
                    <div className="p-4 sm:p-5 rounded-3xl bg-[#004741]/10 dark:bg-emerald-950/40 border border-[#004741]/25 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#004741] dark:text-emerald-300">
                          {isHi
                            ? 'आधिकारिक GTU प्रश्न पत्र स्थिति'
                            : 'Official GTU Question Paper Status'}
                        </span>
                        <h3 className="text-base font-display font-black text-black dark:text-white">
                          {selectedSubject.name} (GTU Code: {selectedSubject.code})
                        </h3>
                        <p className="text-xs text-black/65 dark:text-white/65">
                          {isVerifiedAvailable
                            ? isHi
                              ? 'इस विषय के लिए सत्यापित GTU प्रश्न पत्र PDF देखने और डाउनलोड करने के लिए उपलब्ध है।'
                              : 'Verified GTU examination paper is available for in-app preview and PDF download.'
                            : isHi
                            ? 'इस विषय के लिए आधिकारिक GTU PDF अभी उपलब्ध नहीं है।'
                            : 'Official GTU question paper PDF is not available for this subject yet.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            soundManager.play('card_open');
                            onNavigate(
                              'question_papers',
                              undefined,
                              selectedSubject.code || selectedSubject.name
                            );
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#004741] hover:bg-[#003530] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                        >
                          <FileText className="w-4 h-4 text-emerald-300" />
                          <span>
                            {isHi ? 'सभी GTU पेपर्स ब्राउज़ करें' : 'Open Question Papers Hub'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {isVerifiedAvailable && activePaper ? (
                      <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#172033] border border-black/15 dark:border-[#263449] flex flex-col justify-between gap-4 shadow-sm">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase">
                              {activePaper.exam} {activePaper.year} • PDF Available
                            </span>
                            <span className="text-xs font-mono font-bold text-black/60 dark:text-white/60">
                              70 Marks • 2.5 Hours
                            </span>
                          </div>
                          <h4 className="text-base font-display font-black text-black dark:text-[#F1F5F9]">
                            GTU {activePaper.exam} {activePaper.year} Official Question Paper —{' '}
                            {selectedSubject.shortName || selectedSubject.name} ({selectedSubject.code})
                          </h4>
                          <p className="text-xs text-black/65 dark:text-white/65">
                            {activePaper.paperContent?.sections?.length || 5} Structured GTU
                            Sections (Q.1 to Q.5) • Subject Code Verified: {activePaper.subjectCode}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/10 dark:border-[#263449]">
                          <button
                            onClick={() => {
                              soundManager.play('card_open');
                              setPreviewPaper(activePaper);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-[#004741] text-white text-xs font-bold hover:bg-[#003530] transition-colors flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isHi ? 'पेपर देखें (View PDF)' : 'View Official Paper'}</span>
                          </button>

                          <button
                            onClick={() => {
                              soundManager.play('button_click');
                              paperService.downloadPaperPDF(activePaper);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isHi ? 'PDF डाउनलोड करें' : 'Download PDF'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#172033]/80 border border-dashed border-black/20 dark:border-[#263449] text-center space-y-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider">
                          PDF not available
                        </span>
                        <h4 className="text-sm font-bold text-black dark:text-[#F1F5F9]">
                          {selectedSubject.name} ({selectedSubject.code})
                        </h4>
                        <p className="text-xs text-black/60 dark:text-white/60 max-w-md mx-auto">
                          {isHi
                            ? 'इस विषय के लिए सत्यापित GTU प्रश्न पत्र अभी उपलब्ध नहीं है। आप महत्वपूर्ण प्रश्नों और मॉडल उत्तरों का अभ्यास कर सकते हैं।'
                            : 'No verified GTU paper PDF is mapped to this subject code yet. Use the Materials or Practice tab to prepare with important GTU questions.'}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* =================================================================
             TAB 5: PRACTICE (Dedicated Subject Practice & Exam Hub -> Launches QuizView / ExamAnswerView)
             ================================================================= */}
          {activeSubTab === 'practice' && (
            <div className="space-y-4">
              <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#172033] border border-black/15 dark:border-[#263449] space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#004741] dark:text-emerald-400">
                      {isHi ? 'विषय-वार अभ्यास और मूल्यांकन' : 'Subject-Isolated Practice & Exam Preparation'}
                    </span>
                    <h3 className="text-lg sm:text-xl font-display font-black text-black dark:text-[#F1F5F9]">
                      {isHi
                        ? `${selectedSubject.name} (${selectedSubject.code}) का अभ्यास करें`
                        : `Practice ${selectedSubject.name} (${selectedSubject.code})`}
                    </h3>
                    <p className="text-xs sm:text-sm text-black/70 dark:text-[#94A3B8]">
                      {isHi
                        ? 'सत्यापित MCQ प्रश्नोत्तरी शुरू करें या विश्वविद्यालय अंकों (2M-15M) के अनुसार परीक्षा उत्तर तैयार करें।'
                        : 'Launch the full MCQ Practice arena pre-configured for this subject or generate structured GTU examination answers.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.play('button_click');
                        const initialTopic =
                          selectedSubject.units?.[0]?.topics?.[0]?.title ||
                          selectedSubject.units?.[0]?.unitName ||
                          'Core Concepts & Syllabus';
                        onNavigate('quiz', initialTopic, selectedSubject.name);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#004741] hover:bg-[#003530] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Award className="w-4 h-4 text-emerald-300" />
                      <span>{isHi ? 'MCQ क्विज़ शुरू करें' : 'Launch MCQ Practice'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.play('button_click');
                        const firstExamQ =
                          selectedSubject.units?.[0]?.topics?.[0]?.examQuestions?.[0]?.question ||
                          `Explain the core architecture and fundamental principles of ${selectedSubject.name}.`;
                        onNavigate('exam_mode', firstExamQ, selectedSubject.name);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-black dark:text-white text-xs font-bold flex items-center gap-2 border border-black/10 dark:border-[#263449] transition-all"
                    >
                      <FileCheck2 className="w-4 h-4 text-[#004741] dark:text-emerald-400" />
                      <span>{isHi ? 'परीक्षा उत्तर जनरेटर' : 'Exam Answer Generator'}</span>
                    </button>
                  </div>
                </div>

                {/* Unit-by-Unit MCQ & Exam Practice Launchers */}
                <div className="pt-3 border-t border-black/10 dark:border-[#263449] space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black/55 dark:text-white/55">
                    {isHi ? 'इकाई-वार अभ्यास चुनें' : 'Practice by Unit'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedSubject.units.map((unit) => (
                      <div
                        key={unit.unitNumber}
                        className="p-4 rounded-2xl bg-black/[0.02] dark:bg-[#172033] border border-black/8 dark:border-[#263449] flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="text-[11px] font-mono font-bold text-[#004741] dark:text-emerald-400">
                            Unit 0{unit.unitNumber} · {unit.weightage || '25%'}
                          </div>
                          <div className="text-sm font-bold text-black dark:text-[#F1F5F9] mt-0.5">
                            {unit.unitName}
                          </div>
                          <div className="text-[11px] text-black/55 dark:text-white/55 mt-0.5">
                            {unit.topics.map((t) => t.title).slice(0, 3).join(' • ')}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.play('button_click');
                              onNavigate('quiz', unit.unitName, selectedSubject.name);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#004741] text-white text-[11px] font-bold hover:bg-[#003530] transition-colors"
                          >
                            {isHi ? `Unit ${unit.unitNumber} MCQ अभ्यास` : `Practice Unit ${unit.unitNumber} MCQs`}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.play('button_click');
                              const unitExamQ =
                                unit.topics?.[0]?.examQuestions?.[0]?.question ||
                                `Explain ${unit.topics?.[0]?.title || unit.unitName} in detail with suitable examples.`;
                              onNavigate('exam_mode', unitExamQ, selectedSubject.name);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-black dark:text-white text-[11px] font-bold hover:bg-black/10 transition-colors"
                          >
                            {isHi ? 'मॉडल उत्तर' : 'Practice 7M Answer'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* In-App GTU Paper PDF Preview Modal */}
      <PDFViewerModal
        paper={previewPaper}
        isOpen={Boolean(previewPaper)}
        onClose={() => setPreviewPaper(null)}
        language={language}
      />
    </div>
  );
};
