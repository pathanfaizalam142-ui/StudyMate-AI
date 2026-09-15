import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Printer,
  FileText,
  Calendar,
  Clock,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GTUQuestionPaper, AppLanguage, AppTheme } from '../types';
import { paperService } from '../services/paperService';
import { soundManager } from '../services/soundManager';

interface PDFViewerModalProps {
  paper: GTUQuestionPaper | null;
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
  theme: AppTheme;
  onAskAI?: (query: string, subject: string) => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  paper,
  isOpen,
  onClose,
  language,
  onAskAI,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state on paper open
    if (isOpen) {
      setZoomLevel(100);
      setCurrentPage(1);
      setDownloadSuccess(false);
      setErrorMsg(null);
    }
  }, [isOpen, paper]);

  if (!isOpen || !paper) return null;

  const content = paper.paperContent;
  const totalPages = paper.totalPages || 2;

  const handleZoomIn = () => {
    soundManager.play('button_click');
    setZoomLevel((prev) => Math.min(prev + 15, 180));
  };

  const handleZoomOut = () => {
    soundManager.play('button_click');
    setZoomLevel((prev) => Math.max(prev - 15, 70));
  };

  const handleResetZoom = () => {
    soundManager.play('button_click');
    setZoomLevel(100);
  };

  const toggleFullscreen = () => {
    soundManager.play('button_click');
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleDownload = async () => {
    soundManager.play('save');
    setIsDownloading(true);
    setErrorMsg(null);
    try {
      await paperService.downloadPaperPDF(paper);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate and download PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    soundManager.play('button_click');
    window.print();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col overflow-hidden animate-fade-in text-black dark:text-[#F0EDE4]"
    >
      {/* Top Header & Toolbar */}
      <header className="shrink-0 bg-[#F0EDE4] dark:bg-[#070c0a] border-b border-black/10 dark:border-white/10 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 shadow-sm z-10">
        {/* Left: Paper info & Back Button */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => {
              soundManager.play('button_click');
              onClose();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#0c120f] hover:border-[#004741] text-xs font-bold transition-all shrink-0 active:scale-95"
            title="Back to Papers"
          >
            <ChevronLeft className="w-4 h-4 text-[#004741] dark:text-[#6ee7b7]" />
            <span className="hidden sm:inline">{language === 'hi' ? 'वापस' : 'Back'}</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#004741] text-[#F0EDE4] text-[10px] sm:text-xs font-mono font-bold tracking-wider shrink-0">
                {paper.subjectCode}
              </span>
              <h2 className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-md">
                {paper.subject}
              </h2>
            </div>
            <p className="text-[10px] sm:text-[11px] text-black/60 dark:text-[#F0EDE4]/60 truncate">
              GTU BCA • Sem {paper.semester} • {paper.exam} {paper.year} Examination
            </p>
          </div>
        </div>

        {/* Center: Zoom & Navigation Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 70}
            className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c120f] disabled:opacity-40 hover:border-[#004741] transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Zoom percentage & reset */}
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c120f] text-[10px] sm:text-xs font-mono font-semibold hover:border-[#004741] transition-all"
            title="Reset Zoom (100%)"
          >
            {zoomLevel}%
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 180}
            className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c120f] disabled:opacity-40 hover:border-[#004741] transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <span className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5 hidden sm:block" />

          {/* Page navigation */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => {
                soundManager.play('button_click');
                setCurrentPage((p) => Math.max(p - 1, 1));
              }}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c120f] disabled:opacity-40"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-medium px-1.5">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => {
                soundManager.play('button_click');
                setCurrentPage((p) => Math.min(p + 1, totalPages));
              }}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c120f] disabled:opacity-40"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#0c120f] hover:border-[#004741] text-xs font-semibold active:scale-95 transition-all"
            title="Print Paper"
          >
            <Printer className="w-3.5 h-3.5 text-[#004741] dark:text-[#6ee7b7]" />
            <span>{language === 'hi' ? 'प्रिंट' : 'Print'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#0c120f] hover:border-[#004741] text-xs font-semibold active:scale-95 transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-[#004741] hover:bg-[#003833] text-[#F0EDE4]'
            }`}
            title="Download Official GTU PDF"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'डाउनलोड हुआ!' : 'Downloaded!'}</span>
              </>
            ) : isDownloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{language === 'hi' ? 'तैयार हो रहा...' : 'Generating...'}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'PDF डाउनलोड' : 'Download PDF'}</span>
              </>
            )}
          </button>

          {/* Close modal */}
          <button
            onClick={() => {
              soundManager.play('button_click');
              onClose();
            }}
            className="p-1.5 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#0c120f] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all ml-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error Banner if any */}
      {errorMsg && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PDF Document Canvas View */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-8 bg-[#232826] flex justify-center items-start">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-full max-w-4xl bg-white text-black p-6 sm:p-12 rounded-lg shadow-2xl border border-black/20 my-4"
        >
          {/* Authentic GTU Examination Paper Header */}
          <div className="border-b-2 border-black pb-4 mb-4 text-center space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-black/70 border-b border-black/20 pb-2 mb-2">
              <span className="font-bold text-[#004741]">GUJARAT TECHNOLOGICAL UNIVERSITY</span>
              <span>AHMEDABAD, GUJARAT</span>
            </div>

            <h1 className="font-serif font-black text-lg sm:text-2xl tracking-wide uppercase text-[#004741]">
              GUJARAT TECHNOLOGICAL UNIVERSITY
            </h1>

            <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-black/80">
              {content?.degree || `BCA - SEMESTER-${paper.semester} • EXAMINATION - ${paper.exam.toUpperCase()} ${paper.year}`}
            </p>

            {/* Exam Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-left text-xs border-t border-black/15">
              <div>
                <span className="block text-[10px] uppercase text-black/60 font-bold">Subject Code</span>
                <span className="font-mono font-black text-[#004741]">{paper.subjectCode}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-black/60 font-bold">Subject Name</span>
                <span className="font-bold truncate block" title={paper.subject}>{paper.subject}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-black/60 font-bold">Date & Time</span>
                <span className="font-semibold text-black/80">{content?.date || 'Regular Session'}</span>
              </div>
              <div className="text-right sm:text-left">
                <span className="block text-[10px] uppercase text-black/60 font-bold">Total Marks</span>
                <span className="font-mono font-black text-base text-[#004741]">{content?.totalMarks || 70}</span>
              </div>
            </div>

            {/* Seat Number Box */}
            <div className="flex items-center justify-between pt-2 border-t border-dashed border-black/20 text-xs">
              <span className="text-[11px] text-black/60">Time: {content?.time || '02:30 PM to 05:00 PM'} (2.5 Hours)</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[11px]">Seat No:</span>
                <div className="border border-black px-4 py-0.5 font-mono text-xs tracking-widest bg-black/5">
                  ____________
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="bg-[#F0EDE4]/60 border border-black/20 rounded-lg p-3 mb-6 text-xs text-black/80 space-y-1 font-sans">
            <p className="font-bold uppercase tracking-wider text-[10px] text-[#004741]">
              Instructions for Candidates:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] leading-relaxed">
              {(content?.instructions || [
                'Attempt all questions.',
                'Make suitable assumptions wherever necessary.',
                'Figures to the right indicate full marks.',
              ]).map((inst, idx) => (
                <li key={idx}>{inst}</li>
              ))}
            </ol>
          </div>

          {/* Questions Content */}
          <div className="space-y-6 font-serif">
            {content?.sections && content.sections.length > 0 ? (
              content.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-4 border-b border-black/10 pb-6 last:border-b-0">
                  <div className="flex items-center justify-between bg-black/5 px-3 py-1.5 rounded font-sans">
                    <span className="font-bold text-xs text-[#004741] uppercase tracking-wider">
                      {section.title}
                    </span>
                    <span className="text-[10px] text-black/60 font-semibold">Max 14 Marks</span>
                  </div>

                  <div className="space-y-4">
                    {section.questions.map((q, qIdx) => (
                      <div key={qIdx} className="space-y-2 group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="font-bold text-xs text-black min-w-[55px] shrink-0 font-sans">
                              {q.qNumber}
                            </span>
                            <p className="text-xs sm:text-sm text-black leading-relaxed font-sans">
                              {q.text}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-bold text-xs text-[#004741] px-2 py-0.5 bg-[#004741]/10 rounded">
                              [{q.marks}M]
                            </span>
                            {onAskAI && (
                              <button
                                onClick={() => {
                                  soundManager.play('nav_tap');
                                  onAskAI(q.text, paper.subject);
                                }}
                                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-sans font-bold text-[#004741] hover:underline px-1.5 py-0.5 rounded border border-[#004741]/20 hover:bg-[#004741]/5 transition-all"
                                title="Ask StudyMate AI to solve this question with 10M/7M marking tips"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Solve with AI</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* OR alternative question */}
                        {q.orQuestion && (
                          <div className="pl-14 pt-1 space-y-1">
                            <div className="text-[10px] font-bold text-black/50 tracking-wider uppercase font-sans">
                              --- OR ---
                            </div>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-2 flex-1">
                                <span className="font-bold text-xs text-black min-w-[55px] shrink-0 font-sans">
                                  {q.orQuestion.qNumber}
                                </span>
                                <p className="text-xs sm:text-sm text-black leading-relaxed font-sans">
                                  {q.orQuestion.text}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-xs text-[#004741] px-2 py-0.5 bg-[#004741]/10 rounded">
                                  [{q.orQuestion.marks}M]
                                </span>
                                {onAskAI && (
                                  <button
                                    onClick={() => {
                                      soundManager.play('nav_tap');
                                      onAskAI(q.orQuestion!.text, paper.subject);
                                    }}
                                    className="hidden sm:inline-flex items-center gap-1 text-[10px] font-sans font-bold text-[#004741] hover:underline px-1.5 py-0.5 rounded border border-[#004741]/20 hover:bg-[#004741]/5 transition-all"
                                  >
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>Solve with AI</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 space-y-3">
                <FileText className="w-12 h-12 mx-auto text-black/30" />
                <p className="text-sm font-semibold text-black/70">
                  Paper metadata is registered in GTU database.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold shadow-sm"
                >
                  Download Complete PDF File
                </button>
              </div>
            )}
          </div>

          {/* Official Document Footer */}
          <div className="mt-12 pt-4 border-t border-black/30 flex flex-col sm:flex-row items-center justify-between text-[10px] text-black/60 font-sans gap-2">
            <span>Verified Gujarat Technological University Archive</span>
            <span className="font-semibold text-black/80">Page {currentPage} of {totalPages}</span>
            <span>StudyMate AI Academic Document Viewer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
