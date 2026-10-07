import { jsPDF } from 'jspdf';
import {
  CanonicalSemesterPapersGroup,
  CanonicalSubjectPaperRecord,
  GTUExamSession,
  GTUQuestionPaper,
} from '../types';
import { api } from './api';

/**
 * Service to manage GTU Previous Year Question Papers backed strictly by the canonical SQLite API (/api/papers).
 * Zero fallback to legacy static gtuPapersData.ts is permitted.
 */
class PaperService {
  private semesterGroups: CanonicalSemesterPapersGroup[] = [];
  private subjectRecords: CanonicalSubjectPaperRecord[] = [];
  private loaded = false;

  /**
   * Fetches all canonical semesters and 35 subjects with their verified SQLite paper state from GET /api/papers.
   */
  public async fetchCanonicalPapers(semester?: number): Promise<CanonicalSemesterPapersGroup[]> {
    const response = await api.getPapers(semester ? { semester } : undefined);
    const groups = Array.isArray(response?.semesters) ? response.semesters : [];
    if (!semester) {
      this.semesterGroups = groups;
      this.subjectRecords = groups.flatMap((g) => g.subjects);
      this.loaded = true;
    }
    return groups;
  }

  /**
   * Fetches a single verified paper by paper ID or canonical subjectCode from GET /api/papers/:id.
   */
  public async fetchVerifiedPaperById(idOrSubjectCode: string): Promise<GTUQuestionPaper> {
    const response = await api.getPaperById(idOrSubjectCode);
    if (!response?.paper || !response.paper.isAvailable) {
      throw new Error(`Verified GTU paper not available for ${idOrSubjectCode}`);
    }
    return response.paper;
  }

  public isLoaded(): boolean {
    return this.loaded;
  }

  public getSemesterGroups(): CanonicalSemesterPapersGroup[] {
    return [...this.semesterGroups];
  }

  public getAllSubjectRecords(): CanonicalSubjectPaperRecord[] {
    return [...this.subjectRecords];
  }

  public getAllPapers(): GTUQuestionPaper[] {
    return this.subjectRecords
      .filter((r) => r.isAvailable && r.paper !== null)
      .map((r) => r.paper!);
  }

  public getPaperById(id: string): GTUQuestionPaper | undefined {
    for (const r of this.subjectRecords) {
      if (r.paper && r.paper.id === id) {
        return r.paper;
      }
    }
    return undefined;
  }

  /**
   * Filters canonical subject-paper records across all 35 GTU BCA subjects (Sem 1-6).
   */
  public filterSubjectRecords(
    records: CanonicalSubjectPaperRecord[],
    params: {
      semester?: number | 'all';
      subjectCode?: string | 'all';
      year?: number | 'all';
      exam?: GTUExamSession | 'all';
      availability?: 'all' | 'available' | 'unavailable';
      searchQuery?: string;
      sortBy?: 'canonical' | 'newest' | 'oldest' | 'subject';
    }
  ): CanonicalSubjectPaperRecord[] {
    let filtered = [...records];

    if (params.semester && params.semester !== 'all') {
      filtered = filtered.filter((r) => r.semester === Number(params.semester));
    }

    if (params.subjectCode && params.subjectCode !== 'all') {
      const targetCode = params.subjectCode.toUpperCase().trim();
      filtered = filtered.filter((r) => r.subjectCode.toUpperCase() === targetCode);
    }

    if (params.availability === 'available') {
      filtered = filtered.filter((r) => r.isAvailable);
    } else if (params.availability === 'unavailable') {
      filtered = filtered.filter((r) => !r.isAvailable);
    }

    if (params.year && params.year !== 'all') {
      filtered = filtered.filter((r) => r.examYear === Number(params.year));
    }

    if (params.exam && params.exam !== 'all') {
      filtered = filtered.filter((r) => r.examSession === params.exam);
    }

    if (params.searchQuery && params.searchQuery.trim()) {
      const q = params.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.subjectName.toLowerCase().includes(q) ||
          r.subjectCode.toLowerCase().includes(q) ||
          r.shortName.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.examSession && r.examSession.toLowerCase().includes(q)) ||
          (r.examYear && r.examYear.toString().includes(q)) ||
          `sem ${r.semester}`.includes(q) ||
          `semester ${r.semester}`.includes(q)
      );
    }

    if (params.sortBy === 'newest') {
      filtered.sort(
        (a, b) =>
          (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0) ||
          (b.examYear || 0) - (a.examYear || 0) ||
          a.semester - b.semester ||
          a.subjectCode.localeCompare(b.subjectCode)
      );
    } else if (params.sortBy === 'oldest') {
      filtered.sort(
        (a, b) =>
          (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0) ||
          (a.examYear || 9999) - (b.examYear || 9999) ||
          a.semester - b.semester ||
          a.subjectCode.localeCompare(b.subjectCode)
      );
    } else if (params.sortBy === 'subject') {
      filtered.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
    } else {
      // default: canonical semester & subjectCode order
      filtered.sort(
        (a, b) => a.semester - b.semester || a.subjectCode.localeCompare(b.subjectCode)
      );
    }

    return filtered;
  }

  /**
   * Generates an authentic, formatted GTU examination PDF file strictly from verified SQLite paperContent.
   */
  public generatePaperPDF(paper: GTUQuestionPaper): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = margin;

    const content = paper.paperContent;

    // Header border
    doc.setDrawColor(0, 71, 65);
    doc.setLineWidth(0.6);
    doc.rect(margin - 2, margin - 2, pageWidth - margin * 2 + 4, pageHeight - margin * 2 + 4);

    // University Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 71, 65);
    doc.text(
      content?.university || 'GUJARAT TECHNOLOGICAL UNIVERSITY',
      pageWidth / 2,
      y + 4,
      { align: 'center' }
    );
    y += 9;

    // Degree & Session
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(
      content?.degree ||
        `BCA - SEMESTER ${paper.semester} • EXAMINATION - ${paper.exam.toUpperCase()} ${paper.year}`,
      pageWidth / 2,
      y,
      { align: 'center' }
    );
    y += 6;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // Exam Meta Table
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Subject Code: ${paper.subjectCode}`, margin, y);
    doc.text(`Total Marks: ${content?.totalMarks || 70}`, pageWidth - margin - 26, y);
    y += 4.5;

    doc.text(`Subject Name: ${paper.subject}`, margin, y);
    doc.text(`Time: ${content?.time || '10:30 AM to 01:00 PM'}`, pageWidth - margin - 42, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.text(
      `Date of Exam: ${content?.date || `Session ${paper.exam} ${paper.year}`}`,
      margin,
      y
    );
    doc.text(`Seat No: [ _______________ ]`, pageWidth - margin - 42, y);
    y += 6;

    // Instructions Box
    doc.setFillColor(245, 243, 238);
    doc.rect(margin, y, pageWidth - margin * 2, 16, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 71, 65);
    doc.text('INSTRUCTIONS FOR CANDIDATES:', margin + 2, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const instructions = content?.instructions || [
      '1. Attempt all questions.',
      '2. Make suitable assumptions wherever necessary.',
      '3. Figures to the right indicate full marks.',
    ];
    let instY = y + 7;
    instructions.slice(0, 3).forEach((inst) => {
      doc.text(inst, margin + 4, instY);
      instY += 3.5;
    });
    y += 19;

    // Questions Rendering
    if (content?.sections && content.sections.length > 0) {
      content.sections.forEach((section) => {
        if (y > pageHeight - 35) {
          doc.addPage();
          doc.setDrawColor(0, 71, 65);
          doc.setLineWidth(0.6);
          doc.rect(
            margin - 2,
            margin - 2,
            pageWidth - margin * 2 + 4,
            pageHeight - margin * 2 + 4
          );
          y = margin + 4;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(0, 71, 65);
        doc.text(`--- ${section.title} ---`, pageWidth / 2, y, { align: 'center' });
        y += 5;

        section.questions.forEach((q) => {
          if (y > pageHeight - 32) {
            doc.addPage();
            doc.setDrawColor(0, 71, 65);
            doc.setLineWidth(0.6);
            doc.rect(
              margin - 2,
              margin - 2,
              pageWidth - margin * 2 + 4,
              pageHeight - margin * 2 + 4
            );
            y = margin + 4;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(20, 20, 20);
          doc.text(q.qNumber, margin, y);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 71, 65);
          doc.text(`[${q.marks} Marks]`, pageWidth - margin, y, { align: 'right' });

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          const maxTextWidth = pageWidth - margin * 2 - 36;
          const lines = doc.splitTextToSize(q.text, maxTextWidth);
          doc.text(lines, margin + 18, y);
          y += Math.max(lines.length * 4.2, 5.5);

          if (q.orQuestion) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 100, 100);
            doc.text('OR', margin + 18, y);
            y += 4;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(20, 20, 20);
            doc.text(q.orQuestion.qNumber, margin, y);

            doc.setTextColor(0, 71, 65);
            doc.text(`[${q.orQuestion.marks} Marks]`, pageWidth - margin, y, { align: 'right' });

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            const orLines = doc.splitTextToSize(q.orQuestion.text, maxTextWidth);
            doc.text(orLines, margin + 18, y);
            y += Math.max(orLines.length * 4.2, 5.5);
          }

          y += 2.5;
        });

        y += 3;
      });
    }

    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Gujarat Technological University • Verified BCA Examination Paper (${paper.subjectCode}) • StudyMate AI`,
      pageWidth / 2,
      pageHeight - margin + 1,
      { align: 'center' }
    );

    return doc;
  }

  /**
   * Downloads the verified PDF file directly to the user's device with canonical filename.
   */
  public async downloadPaperPDF(paper: GTUQuestionPaper): Promise<void> {
    if (!paper.isAvailable) {
      throw new Error(`PDF for ${paper.subject} (${paper.subjectCode}) is not available yet.`);
    }

    let verifiedPaper = paper;
    try {
      const fetched = await this.fetchVerifiedPaperById(paper.id);
      if (fetched.subjectCode.toUpperCase() !== paper.subjectCode.toUpperCase()) {
        throw new Error(
          `Integrity violation: Paper subject mismatch (${fetched.subjectCode} !== ${paper.subjectCode})`
        );
      }
      verifiedPaper = fetched;
    } catch (fetchErr: any) {
      if (fetchErr?.message?.includes('Integrity violation')) {
        throw fetchErr;
      }
      if (
        !verifiedPaper.paperContent ||
        !Array.isArray(verifiedPaper.paperContent.sections) ||
        verifiedPaper.paperContent.sections.length === 0
      ) {
        throw fetchErr;
      }
    }

    // Only use direct anchor download if pdfUrl is an actual static/external .pdf file
    if (verifiedPaper.pdfUrl && verifiedPaper.pdfUrl.toLowerCase().endsWith('.pdf')) {
      const link = document.createElement('a');
      link.href = verifiedPaper.pdfUrl;
      link.download =
        verifiedPaper.fileName ||
        `GTU_BCA_Sem${verifiedPaper.semester}_${verifiedPaper.subjectCode}_${verifiedPaper.year}_${verifiedPaper.exam}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const doc = this.generatePaperPDF(verifiedPaper);
    const fileName =
      verifiedPaper.fileName ||
      `GTU_BCA_Sem${verifiedPaper.semester}_${verifiedPaper.subjectCode}_${verifiedPaper.year}_${verifiedPaper.exam}.pdf`;
    doc.save(fileName);
  }
}

export const paperService = new PaperService();
