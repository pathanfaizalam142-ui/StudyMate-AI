import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import {
  GTUQuestionPaper,
  AppLanguage,
  AppTheme,
  GTUExamSession,
  CanonicalSemesterPapersGroup,
  CanonicalSubjectPaperRecord,
} from '../types';
import { paperService } from '../services/paperService';
import { soundManager } from '../services/soundManager';
import { PDFViewerModal } from '../components/PDFViewerModal';

interface QuestionPapersViewProps {
  language: AppLanguage;
  theme: AppTheme;
  initialSubject?: string;
  onNavigateToAskAI?: (query: string, subject: string) => void;
  onNavigateToCurriculum?: (semester: number, subjectCode?: string) => void;
}

export const QuestionPapersView: React.FC<QuestionPapersViewProps> = ({
  language,
  theme,
  initialSubject,
  onNavigateToAskAI,
  onNavigateToCurriculum,
}) => {
  // Canonical SQLite data state
  const [semesterGroups, setSemesterGroups] = useState<CanonicalSemesterPapersGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter States
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedExam, setSelectedExam] = useState<GTUExamSession | 'all'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'canonical' | 'newest' | 'oldest' | 'subject'>('canonical');

  // PDF Viewer Modal State
  const [viewingPaper, setViewingPaper] = useState<GTUQuestionPaper | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  // Downloading State tracker
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadPapersFromSqliteApi = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const groups = await paperService.fetchCanonicalPapers();
      setSemesterGroups(groups);
    } catch (err: any) {
      setLoadError(
        err?.message || 'Unable to load canonical GTU BCA examination papers from database.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPapersFromSqliteApi();
  }, [loadPapersFromSqliteApi]);

  // All 35 canonical subject records flattened from SQLite response
  const allSubjectRecords = useMemo(() => {
    return semesterGroups.flatMap((g) => g.subjects);
  }, [semesterGroups]);

  // Synchronize filter when initialSubject prop is provided from Dashboard or GTU BCA workspace
  useEffect(() => {
    if (!initialSubject || allSubjectRecords.length === 0) return;
    const target = initialSubject.trim().toLowerCase();
    const matched = allSubjectRecords.find(
      (r) =>
        r.subjectCode.toLowerCase() === target ||
        r.subjectName.toLowerCase() === target ||
        r.subjectName.toLowerCase().includes(target)
    );
    if (matched) {
      setSelectedSemester(matched.semester);
      setSelectedSubjectCode(matched.subjectCode);
    }
  }, [initialSubject, allSubjectRecords]);

  // Subjects available for the Subject Selector dropdown (scoped to selectedSemester)
  const semesterScopedSubjects = useMemo(() => {
    if (selectedSemester === 'all') {
      return allSubjectRecords;
    }
    return allSubjectRecords.filter((s) => s.semester === selectedSemester);
  }, [allSubjectRecords, selectedSemester]);

  // Handle Semester change: reset subject filter if it doesn't belong to the newly selected semester
  const handleSelectSemester = (sem: number | 'all') => {
    soundManager.play('nav_tap');
    setSelectedSemester(sem);
    setSelectedSubjectCode('all');
    setViewingPaper(null);
    setIsViewerOpen(false);
    setActionError(null);
  };

  // Handle Subject change: clear any open viewer or stale error
  const handleSelectSubject = (code: string | 'all') => {
    soundManager.play('nav_tap');
    setSelectedSubjectCode(code);
    setViewingPaper(null);
    setIsViewerOpen(false);
    setActionError(null);
  };

  // Filtered Canonical Subject Records
  const filteredRecords = useMemo(() => {
    return paperService.filterSubjectRecords(allSubjectRecords, {
      semester: selectedSemester,
      subjectCode: selectedSubjectCode,
      year: selectedYear,
      exam: selectedExam,
      availability: availabilityFilter,
      searchQuery,
      sortBy,
    });
  }, [
    allSubjectRecords,
    selectedSemester,
    selectedSubjectCode,
    selectedYear,
    selectedExam,
    availabilityFilter,
    searchQuery,
    sortBy,
  ]);

  const totalSubjectsCount = allSubjectRecords.length;
  const totalAvailableCount = allSubjectRecords.filter((r) => r.isAvailable).length;
  const filteredAvailableCount = filteredRecords.filter((r) => r.isAvailable).length;

  const handleOpenViewer = async (record: CanonicalSubjectPaperRecord) => {
    soundManager.play('nav_tap');
    if (!record.isAvailable || !record.paper) {
      setActionError(
        language === 'hi'
          ? `${record.subjectName} (${record.subjectCode}) का आधिकारिक प्रश्न पत्र अभी उपलब्ध नहीं है (PDF not available)।`
          : `Official GTU question paper for ${record.subjectName} (${record.subjectCode}) is not available yet.`
      );
      setTimeout(() => setActionError(null), 4000);
      return;
    }

    try {
      // Verify and fetch latest paper directly against SQLite endpoint /api/papers/:id
      let verifiedPaper = record.paper;
      try {
        verifiedPaper = await paperService.fetchVerifiedPaperById(record.paper.id);
      } catch {
        if (!record.paper.paperContent || !record.paper.paperContent.sections?.length) {
          throw new Error(`Verified GTU paper not available for ${record.subjectCode}`);
        }
      }

      if (verifiedPaper.subjectCode.toUpperCase() !== record.subjectCode.toUpperCase()) {
        throw new Error(
          `Subject isolation guard triggered: expected ${record.subjectCode}, received ${verifiedPaper.subjectCode}`
        );
      }

      setViewingPaper(verifiedPaper);
      setIsViewerOpen(true);
    } catch (err: any) {
      setActionError(err?.message || 'Unable to open verified question paper.');
    }
  };

  const handleDownloadPaper = async (
    record: CanonicalSubjectPaperRecord,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!record.isAvailable || !record.paper) {
      soundManager.play('error');
      setActionError(
        language === 'hi'
          ? 'यह पेपर अभी उपलब्ध नहीं है (PDF not available)।'
          : 'This paper is not available yet (PDF not available).'
      );
      setTimeout(() => setActionError(null), 4000);
      return;
    }

    soundManager.play('save');
    setDownloadingId(record.subjectCode);
    setActionError(null);

    try {
      await paperService.downloadPaperPDF(record.paper);
      setDownloadSuccessId(record.subjectCode);
      setTimeout(() => setDownloadSuccessId(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to download paper PDF.');
      soundManager.play('error');
    } finally {
      setDownloadingId(null);
    }
  };

  const resetFilters = () => {
    soundManager.play('button_click');
    setSelectedSemester('all');
    setSelectedSubjectCode('all');
    setSelectedYear('all');
    setSelectedExam('all');
    setAvailabilityFilter('all');
    setSearchQuery('');
    setSortBy('canonical');
  };

  return (
    <div
      id="gtu-question-papers-portal"
      className="space-y-5 sm:space-y-6 pb-20 animate-fade-in w-full min-w-0"
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#004741] to-[#002b27] text-[#F0EDE4] p-4 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[#6ee7b7] text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>GTU BCA Previous Year Question Papers</span>
          </div>

          <h1 className="font-display font-black text-xl sm:text-3xl lg:text-4xl tracking-tight text-white leading-tight">
            {language === 'hi'
              ? 'GTU BCA पिछले वर्ष के प्रश्न पत्र (सेमेस्टर 1 से 6)'
              : 'GTU BCA Previous Year Question Papers (Sem 1 to 6)'}
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-[#F0EDE4]/80 leading-relaxed max-w-2xl">
            {language === 'hi'
              ? 'सेमेस्टर 1 से 6 तक के सभी 35 आधिकारिक GTU BCA विषयों की सूची। सत्यापित प्रश्न पत्र देखें, PDF डाउनलोड करें और AI के साथ अभ्यास करें।'
              : 'Complete semester-wise directory of all 35 canonical GTU BCA curriculum subjects across Semesters 1 to 6. View verified university papers, download authentic PDFs, or solve questions with AI.'}
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-semibold text-white/90">
            <span className="px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
              🏛️ {language === 'hi' ? 'सेमेस्टर 1 से 6' : 'Semesters: 1 to 6'} ({totalSubjectsCount || 35}{' '}
              {language === 'hi' ? 'विषय' : 'Canonical Subjects'})
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✓ {totalAvailableCount} {language === 'hi' ? 'सत्यापित PDF उपलब्ध' : 'Verified Papers Available'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
              {language === 'hi' ? 'सत्र: 2025 व 2026' : 'Exam Sessions: 2025 & 2026'}
            </span>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {(actionError || loadError) && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{actionError || loadError}</span>
          </div>
          <button
            onClick={() => {
              setActionError(null);
              if (loadError) loadPapersFromSqliteApi();
            }}
            className="text-[11px] font-bold underline hover:opacity-80 shrink-0"
          >
            {loadError ? 'Retry' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Search and Filter Panel */}
      <div className="bg-white dark:bg-[#172033] border border-black/10 dark:border-[#263449] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Top: Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#94A3B8]/70" />
          <input
            id="paper-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'विषय या कोड द्वारा खोजें (उदा: BCA101, Data Structure, BCA301, Operating System, Python)...'
                : 'Search by canonical subject name or code (e.g. BCA101, Data Structure, BCA301, Operating System, Python)...'
            }
            className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 rounded-xl bg-[#F0EDE4]/40 dark:bg-[#0B1120] border border-black/10 dark:border-[#263449] text-xs sm:text-sm text-black dark:text-[#F1F5F9] placeholder:text-black/40 dark:placeholder:text-[#F0EDE4]/40 focus:outline-none focus:ring-2 focus:ring-[#004741]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-black/40 dark:text-[#94A3B8]/70 hover:text-black dark:hover:text-[#F1F5F9]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="space-y-3">
          {/* 1. Semester Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-[#94A3B8]">
                {language === 'hi' ? '1. सेमेस्टर चुनें' : '1. Select Semester'}
              </span>
              <span className="text-[10px] text-black/40 dark:text-[#94A3B8]/70">
                {selectedSemester === 'all'
                  ? `All Semesters (${totalSubjectsCount} Subjects)`
                  : `Semester ${selectedSemester} (${semesterScopedSubjects.length} Subjects)`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                id="paper-sem-filter-all"
                onClick={() => handleSelectSemester('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedSemester === 'all'
                    ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#94A3B8] hover:bg-black/10 dark:hover:bg-[#1E293B]'
                }`}
              >
                {language === 'hi' ? 'सभी सेमेस्टर' : 'All Semesters'}
              </button>
              {[1, 2, 3, 4, 5, 6].map((sem) => {
                const semGroup = semesterGroups.find((g) => g.semester === sem);
                return (
                  <button
                    key={sem}
                    id={`paper-sem-filter-${sem}`}
                    onClick={() => handleSelectSemester(sem)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedSemester === sem
                        ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#94A3B8] hover:bg-black/10 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    Sem {sem}
                    {semGroup ? ` (${semGroup.totalSubjects})` : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Subject, Year, Session & Status Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Subject Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-[#94A3B8]">
                {language === 'hi' ? '2. विषय चुनें (Subject)' : '2. Select Subject'}
              </span>
              <select
                id="paper-subject-select"
                value={selectedSubjectCode}
                onChange={(e) => handleSelectSubject(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-[#263449] text-xs font-bold text-black dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#004741]"
              >
                <option value="all">
                  {selectedSemester === 'all'
                    ? `All 35 GTU BCA Subjects`
                    : `All Sem ${selectedSemester} Subjects (${semesterScopedSubjects.length})`}
                </option>
                {semesterScopedSubjects.map((subj) => (
                  <option key={subj.subjectCode} value={subj.subjectCode}>
                    {subj.subjectCode} — {subj.subjectName}
                    {subj.isAvailable ? ' (PDF Available)' : ' (PDF not available)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-[#94A3B8]">
                {language === 'hi' ? '3. परीक्षा वर्ष' : '3. Exam Year'}
              </span>
              <div className="flex items-center gap-1.5">
                {(['all', 2026, 2025] as const).map((yr) => (
                  <button
                    key={yr}
                    onClick={() => {
                      soundManager.play('nav_tap');
                      setSelectedYear(yr);
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                      selectedYear === yr
                        ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#94A3B8] hover:bg-black/10 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    {yr === 'all' ? (language === 'hi' ? 'सभी' : 'All') : yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Exam Session */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-[#94A3B8]">
                {language === 'hi' ? '4. सत्र (Session)' : '4. Exam Session'}
              </span>
              <div className="flex items-center gap-1.5">
                {(['all', 'Summer', 'Winter'] as const).map((ex) => (
                  <button
                    key={ex}
                    onClick={() => {
                      soundManager.play('nav_tap');
                      setSelectedExam(ex);
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                      selectedExam === ex
                        ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#94A3B8] hover:bg-black/10 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    {ex === 'all' ? (language === 'hi' ? 'सभी' : 'All') : ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort & Reset */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-[#94A3B8]">
                {language === 'hi' ? '5. क्रमबद्ध करें (Sort)' : '5. Sort Order'}
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-[#263449] text-xs font-bold text-black dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#004741]"
                >
                  <option value="canonical">Canonical Order (Sem 1–6)</option>
                  <option value="newest">Available & Newest First</option>
                  <option value="oldest">Available & Oldest First</option>
                  <option value="subject">Subject Name (A–Z)</option>
                </select>

                {(selectedSemester !== 'all' ||
                  selectedSubjectCode !== 'all' ||
                  selectedYear !== 'all' ||
                  selectedExam !== 'all' ||
                  availabilityFilter !== 'all' ||
                  searchQuery) && (
                  <button
                    onClick={resetFilters}
                    className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-black/70 dark:text-[#94A3B8] transition-all shrink-0"
                    title="Reset All Filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-bold text-black dark:text-[#F1F5F9]">
            {selectedSemester === 'all'
              ? language === 'hi'
                ? 'सेमेस्टर 1–6 के सभी विषय एवं प्रश्न पत्र'
                : 'All Canonical GTU BCA Subjects & Papers (Sem 1–6)'
              : language === 'hi'
              ? `सेमेस्टर ${selectedSemester} के विषय एवं प्रश्न पत्र`
              : `Semester ${selectedSemester} Subjects & Examination Papers`}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-[#004741]/10 dark:bg-[#004741]/40 text-[#004741] dark:text-[#38BDF8] text-xs font-bold">
            {filteredRecords.length} {filteredRecords.length === 1 ? 'Subject' : 'Subjects'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-black/60 dark:text-[#94A3B8]">
          <span>
            {filteredAvailableCount} PDF Available •{' '}
            {filteredRecords.length - filteredAvailableCount} PDF not available
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-40 rounded-2xl bg-white/60 dark:bg-[#172033]/60 border border-black/10 dark:border-[#263449] p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="h-4 w-1/3 bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-5 w-2/3 bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-8 w-full bg-black/5 dark:bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((record) => {
            const isDownloadingThis = downloadingId === record.subjectCode;
            const isDownloadedThis = downloadSuccessId === record.subjectCode;
            const paper = record.paper;

            return (
              <div
                key={`subject-paper-card-${record.subjectCode}`}
                id={`paper-card-${record.subjectCode}`}
                onClick={() => handleOpenViewer(record)}
                className={`group relative bg-white dark:bg-[#172033] border rounded-2xl p-4 sm:p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                  record.isAvailable
                    ? 'border-black/10 dark:border-[#263449] hover:border-[#004741] dark:hover:border-[#6ee7b7] hover:shadow-md cursor-pointer'
                    : 'border-black/10 dark:border-[#263449] opacity-90 cursor-default'
                }`}
              >
                {/* Card Top: Badges & Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Semester Badge */}
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#004741] text-[#F0EDE4] text-[10px] font-bold uppercase tracking-wider">
                        Sem {record.semester}
                      </span>

                      {/* Exam Year & Session Badges (only when an authentic paper exists) */}
                      {record.isAvailable && record.examYear && (
                        <span className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-[#263449] text-[10px] font-mono font-bold">
                          {record.examYear}
                        </span>
                      )}

                      {record.isAvailable && record.examSession && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                          {record.examSession} Exam
                        </span>
                      )}

                      {!record.isAvailable && (
                        <span className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 text-black/50 dark:text-[#94A3B8] text-[10px] font-medium">
                          {record.category}
                        </span>
                      )}
                    </div>

                    {/* Availability Status Badge */}
                    {record.isAvailable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>PDF Available</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                        <Clock className="w-3 h-3" />
                        <span>PDF not available</span>
                      </span>
                    )}
                  </div>

                  {/* Subject Code & Exact Canonical Subject Name */}
                  <div className="pt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs font-bold text-[#004741] dark:text-[#38BDF8]">
                        {record.subjectCode}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-black dark:text-[#F1F5F9] group-hover:text-[#004741] dark:group-hover:text-[#38BDF8] transition-colors leading-snug">
                        {record.subjectName}
                      </h3>
                    </div>

                    <p className="text-[11px] text-black/60 dark:text-[#94A3B8] mt-1">
                      {record.isAvailable && paper
                        ? paper.fileName
                        : `${record.category} • ${record.credits} Credits • Official GTU PDF not available`}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: File Details & Action Buttons */}
                <div className="pt-3 border-t border-black/5 dark:border-[#263449]/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[10px] text-black/50 dark:text-[#94A3B8]">
                    {record.isAvailable && paper ? (
                      <span>
                        {paper.fileSize || '150 KB'} • {paper.totalPages || 2} Pages • 70 Marks
                      </span>
                    ) : (
                      <span>PDF not available</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Open Subject Workspace Button */}
                    {onNavigateToCurriculum && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.play('nav_tap');
                          onNavigateToCurriculum(record.semester, record.subjectCode);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-black/10 dark:border-[#263449] bg-black/5 dark:bg-white/5 text-black/80 dark:text-[#F1F5F9]/90 hover:border-[#004741] transition-all"
                        title={`Open ${record.subjectName} Workspace`}
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-[#004741] dark:text-[#38BDF8]" />
                        <span>{language === 'hi' ? 'विषय' : 'Workspace'}</span>
                      </button>
                    )}

                    {/* View Button */}
                    <button
                      type="button"
                      disabled={!record.isAvailable}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenViewer(record);
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        record.isAvailable
                          ? 'border border-black/15 dark:border-[#263449] bg-white dark:bg-[#0B1120] text-black dark:text-[#F1F5F9] hover:border-[#004741] active:scale-95'
                          : 'opacity-50 border border-black/10 dark:border-[#263449] bg-black/5 cursor-not-allowed'
                      }`}
                      title={
                        record.isAvailable
                          ? `View ${record.subjectCode} — ${record.subjectName}`
                          : 'PDF not available'
                      }
                    >
                      <Eye className="w-3.5 h-3.5 text-[#004741] dark:text-[#38BDF8]" />
                      <span>{language === 'hi' ? 'देखें' : 'View'}</span>
                    </button>

                    {/* Download PDF Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDownloadPaper(record, e)}
                      disabled={!record.isAvailable || isDownloadingThis}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                        !record.isAvailable
                          ? 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed'
                          : isDownloadedThis
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#004741] hover:bg-[#003833] text-[#F0EDE4]'
                      }`}
                      title={
                        record.isAvailable && paper
                          ? `Download ${paper.fileName}`
                          : 'PDF not available'
                      }
                    >
                      {isDownloadedThis ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'सहेज लिया' : 'Saved'}</span>
                        </>
                      ) : isDownloadingThis ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'PDF डाउनलोड' : 'Download PDF'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-[#172033] border border-black/10 dark:border-[#263449] rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-black/40 dark:text-[#94A3B8]/70">
            <BookOpen className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-black dark:text-[#F1F5F9]">
              {language === 'hi'
                ? 'कोई विषय या प्रश्न पत्र नहीं मिला'
                : 'No Subjects or Papers Match Your Criteria'}
            </h3>
            <p className="text-xs text-black/60 dark:text-[#94A3B8] leading-relaxed">
              {language === 'hi'
                ? 'कृपया अपने खोज शब्द या फिल्टर बदलें (जैसे सेमेस्टर, विषय, वर्ष या सत्र)।'
                : 'Try adjusting your search keywords, semester, subject, year, or session filters.'}
            </p>
          </div>

          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-[#003833] transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'फ़िल्टर रीसेट करें' : 'Reset All Filters'}</span>
          </button>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        paper={viewingPaper}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewingPaper(null);
        }}
        language={language}
        theme={theme}
        onAskAI={onNavigateToAskAI}
      />
    </div>
  );
};
