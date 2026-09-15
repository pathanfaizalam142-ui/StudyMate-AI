import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Calendar,
  Layers,
  GraduationCap,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  RotateCcw,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { GTUQuestionPaper, AppLanguage, AppTheme, GTUExamSession } from '../types';
import { paperService } from '../services/paperService';
import { soundManager } from '../services/soundManager';
import { PDFViewerModal } from '../components/PDFViewerModal';

interface QuestionPapersViewProps {
  language: AppLanguage;
  theme: AppTheme;
  onNavigateToAskAI?: (query: string, subject: string) => void;
  onNavigateToCurriculum?: (semester: number, subjectCode?: string) => void;
}

export const QuestionPapersView: React.FC<QuestionPapersViewProps> = ({
  language,
  theme,
  onNavigateToAskAI,
}) => {
  // Filter States
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedExam, setSelectedExam] = useState<GTUExamSession | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'subject'>('newest');

  // PDF Viewer Modal State
  const [viewingPaper, setViewingPaper] = useState<GTUQuestionPaper | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  // Downloading State tracker
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filtered Papers
  const papers = useMemo(() => {
    return paperService.filterPapers({
      semester: selectedSemester,
      year: selectedYear,
      exam: selectedExam,
      searchQuery,
      sortBy,
    });
  }, [selectedSemester, selectedYear, selectedExam, searchQuery, sortBy]);

  const availableCount = papers.filter((p) => p.isAvailable).length;
  const totalCount = papers.length;

  const handleOpenViewer = (paper: GTUQuestionPaper) => {
    soundManager.play('nav_tap');
    if (!paper.isAvailable) {
      setActionError(
        language === 'hi'
          ? `${paper.subject} (${paper.year}) का आधिकारिक प्रश्न पत्र GTU पोर्टल पर अभी अपलोड नहीं हुआ है।`
          : `Official GTU question paper for ${paper.subject} (${paper.year}) has not been released or uploaded yet.`
      );
      setTimeout(() => setActionError(null), 4000);
      return;
    }
    setViewingPaper(paper);
    setIsViewerOpen(true);
  };

  const handleDownloadPaper = async (paper: GTUQuestionPaper, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!paper.isAvailable) {
      soundManager.play('error');
      setActionError(
        language === 'hi'
          ? 'यह पेपर अभी उपलब्ध नहीं है (PDF not available yet)।'
          : 'This paper has not been uploaded yet (PDF not available yet).'
      );
      setTimeout(() => setActionError(null), 4000);
      return;
    }

    soundManager.play('save');
    setDownloadingId(paper.id);
    setActionError(null);

    try {
      await paperService.downloadPaperPDF(paper);
      setDownloadSuccessId(paper.id);
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
    setSelectedYear('all');
    setSelectedExam('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div id="gtu-question-papers-portal" className="space-y-5 sm:space-y-6 pb-20 animate-fade-in w-full min-w-0">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#004741] to-[#002b27] text-[#F0EDE4] p-4 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[#6ee7b7] text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>GTU BCA Previous Year Question Papers</span>
          </div>

          <h1 className="font-display font-black text-xl sm:text-3xl lg:text-4xl tracking-tight text-white leading-tight">
            {language === 'hi'
              ? 'GTU BCA पिछले वर्ष के प्रश्न पत्र (2025 व 2026)'
              : 'GTU BCA Previous Year Question Papers (2025 & 2026)'}
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-[#F0EDE4]/80 leading-relaxed max-w-2xl">
            {language === 'hi'
              ? 'सेमेस्टर 1 से 6 तक के आधिकारिक GTU विश्वविद्यालय परीक्षा प्रश्न पत्र। प्रामाणिक PDF देखें, डाउनलोड करें और AI के साथ तैयारी करें।'
              : 'Official Gujarat Technological University BCA examination papers for Semester 1 to 6. View authentic university question papers, download genuine PDFs, or solve them directly with AI.'}
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-semibold text-white/90">
            <span className="px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
              📅 {language === 'hi' ? 'परीक्षा वर्ष: 2025 और 2026' : 'Exam Years: 2025 & 2026'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
              🏛️ {language === 'hi' ? 'सेमेस्टर: 1 से 6' : 'Semesters: 1 to 6'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✓ {availableCount} {language === 'hi' ? 'सत्यापित PDF उपलब्ध' : 'Authentic Papers Available'}
            </span>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <FileText className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Global Notification Banner */}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-[11px] font-bold underline hover:opacity-80 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search and Filter Panel */}
      <div className="bg-white dark:bg-[#0c120f] border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Top: Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-[#F0EDE4]/40" />
          <input
            id="paper-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'विषय या कोड द्वारा पेपर खोजें (उदा: Java, BCA302, C Programming, OS)...'
                : 'Search papers by subject name or code (e.g. Java, BCA302, C Programming, OS)...'
            }
            className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 rounded-xl bg-[#F0EDE4]/40 dark:bg-[#070b09] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-black dark:text-[#F0EDE4] placeholder:text-black/40 dark:placeholder:text-[#F0EDE4]/40 focus:outline-none focus:ring-2 focus:ring-[#004741]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-black/40 dark:text-[#F0EDE4]/40 hover:text-black dark:hover:text-[#F0EDE4]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="space-y-3">
          {/* Semester Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-[#F0EDE4]/60">
                {language === 'hi' ? '1. सेमेस्टर चुनें' : '1. Select Semester'}
              </span>
              <span className="text-[10px] text-black/40 dark:text-[#F0EDE4]/40">
                {selectedSemester === 'all' ? 'All Semesters' : `Semester ${selectedSemester}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => {
                  soundManager.play('nav_tap');
                  setSelectedSemester('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedSemester === 'all'
                    ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#F0EDE4]/70 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {language === 'hi' ? 'सभी सेमेस्टर' : 'All Semesters'}
              </button>
              {[1, 2, 3, 4, 5, 6].map((sem) => (
                <button
                  key={sem}
                  onClick={() => {
                    soundManager.play('nav_tap');
                    setSelectedSemester(sem);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedSemester === sem
                      ? 'bg-[#004741] text-[#F0EDE4] shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#F0EDE4]/70 hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                >
                  Sem {sem}
                </button>
              ))}
            </div>
          </div>

          {/* Year & Exam Type Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Year Selector (2026, 2025) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-[#F0EDE4]/60">
                {language === 'hi' ? '2. परीक्षा वर्ष' : '2. Exam Year'}
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
                        : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#F0EDE4]/70 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    {yr === 'all' ? (language === 'hi' ? 'सभी वर्ष' : 'All Years') : yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Exam Session (Summer, Winter) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-[#F0EDE4]/60">
                {language === 'hi' ? '3. सत्र (Session)' : '3. Exam Session'}
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
                        : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#F0EDE4]/70 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    {ex === 'all' ? (language === 'hi' ? 'सभी' : 'All') : ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort & Reset */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-[#F0EDE4]/60">
                {language === 'hi' ? '4. क्रमबद्ध करें (Sort)' : '4. Sort Order'}
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-black dark:text-[#F0EDE4] focus:outline-none focus:ring-2 focus:ring-[#004741]"
                >
                  <option value="newest">Newest (2026 First)</option>
                  <option value="oldest">Oldest (2025 First)</option>
                  <option value="subject">Subject Name (A-Z)</option>
                </select>

                {(selectedSemester !== 'all' ||
                  selectedYear !== 'all' ||
                  selectedExam !== 'all' ||
                  searchQuery) && (
                  <button
                    onClick={resetFilters}
                    className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-black/70 dark:text-[#F0EDE4]/70 transition-all shrink-0"
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
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-bold text-black dark:text-[#F0EDE4]">
            {language === 'hi' ? 'प्रश्न पत्र सूची' : 'Examination Papers'}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-[#004741]/10 dark:bg-[#004741]/40 text-[#004741] dark:text-[#6ee7b7] text-xs font-bold">
            {papers.length} {papers.length === 1 ? 'Paper' : 'Papers'}
          </span>
        </div>

        <div className="text-[11px] text-black/50 dark:text-[#F0EDE4]/50">
          Showing {availableCount} ready for view/download
        </div>
      </div>

      {/* Papers Grid */}
      {papers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {papers.map((paper) => {
            const isDownloadingThis = downloadingId === paper.id;
            const isDownloadedThis = downloadSuccessId === paper.id;

            return (
              <div
                key={paper.id}
                id={`paper-card-${paper.id}`}
                onClick={() => handleOpenViewer(paper)}
                className="group relative bg-white dark:bg-[#0c120f] border border-black/10 dark:border-white/10 hover:border-[#004741] dark:hover:border-[#6ee7b7] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer space-y-4"
              >
                {/* Card Top: Badges & Year */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Semester Badge */}
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#004741] text-[#F0EDE4] text-[10px] font-bold uppercase tracking-wider">
                        Sem {paper.semester}
                      </span>

                      {/* Year Badge */}
                      <span className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] font-mono font-bold">
                        {paper.year}
                      </span>

                      {/* Exam Session Badge */}
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                        {paper.exam} Exam
                      </span>
                    </div>

                    {/* Availability Status Badge */}
                    {paper.isAvailable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>PDF Available</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                        <Clock className="w-3 h-3" />
                        <span>PDF not available yet</span>
                      </span>
                    )}
                  </div>

                  {/* Subject Title & Code */}
                  <div className="pt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs font-bold text-[#004741] dark:text-[#6ee7b7]">
                        {paper.subjectCode}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-black dark:text-[#F0EDE4] group-hover:text-[#004741] dark:group-hover:text-[#6ee7b7] transition-colors leading-snug">
                        {paper.subject}
                      </h3>
                    </div>

                    <p className="text-[11px] text-black/60 dark:text-[#F0EDE4]/60 mt-1">
                      {paper.fileName}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: File Details & Action Buttons */}
                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[10px] text-black/50 dark:text-[#F0EDE4]/50">
                    {paper.isAvailable ? (
                      <span>
                        {paper.fileSize || '150 KB'} • {paper.totalPages || 2} Pages • 70 Marks
                      </span>
                    ) : (
                      <span>Scheduled for GTU portal release</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenViewer(paper);
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        paper.isAvailable
                          ? 'border border-black/15 dark:border-white/15 bg-white dark:bg-[#070b09] text-black dark:text-[#F0EDE4] hover:border-[#004741] active:scale-95'
                          : 'opacity-50 border border-black/10 dark:border-white/10 bg-black/5 cursor-not-allowed'
                      }`}
                      title={paper.isAvailable ? 'View Question Paper' : 'Paper not uploaded yet'}
                    >
                      <Eye className="w-3.5 h-3.5 text-[#004741] dark:text-[#6ee7b7]" />
                      <span>{language === 'hi' ? 'देखें' : 'View'}</span>
                    </button>

                    {/* Download PDF Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDownloadPaper(paper, e)}
                      disabled={!paper.isAvailable || isDownloadingThis}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                        !paper.isAvailable
                          ? 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed'
                          : isDownloadedThis
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#004741] hover:bg-[#003833] text-[#F0EDE4]'
                      }`}
                      title={
                        paper.isAvailable
                          ? `Download ${paper.fileName}`
                          : 'PDF not available yet'
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
        <div className="bg-white dark:bg-[#0c120f] border border-black/10 dark:border-white/10 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-black/40 dark:text-[#F0EDE4]/40">
            <FileText className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-black dark:text-[#F0EDE4]">
              {language === 'hi' ? 'कोई प्रश्न पत्र नहीं मिला' : 'No Question Papers Match Your Criteria'}
            </h3>
            <p className="text-xs text-black/60 dark:text-[#F0EDE4]/60 leading-relaxed">
              {language === 'hi'
                ? 'कृपया अपने खोज शब्द या फिल्टर बदलें (जैसे सेमेस्टर, वर्ष या सत्र)।'
                : 'Try adjusting your search keywords, semester, year, or session filters.'}
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
