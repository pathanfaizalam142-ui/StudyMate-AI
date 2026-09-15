import { jsPDF } from 'jspdf';
import { GTUQuestionPaper, GTUExamSession } from '../types';
import { GTU_QUESTION_PAPERS } from '../data/gtuPapersData';

/**
 * Service to manage GTU Previous Year Question Papers.
 * Supports filtering, searching, dynamic authentic PDF generation,
 * direct browser downloads, and future Admin panel operations.
 */

class PaperService {
  private papers: GTUQuestionPaper[] = [...GTU_QUESTION_PAPERS];

  public getAllPapers(): GTUQuestionPaper[] {
    return [...this.papers];
  }

  public getPaperById(id: string): GTUQuestionPaper | undefined {
    return this.papers.find((p) => p.id === id);
  }

  public filterPapers(params: {
    semester?: number | 'all';
    year?: number | 'all';
    exam?: GTUExamSession | 'all';
    searchQuery?: string;
    sortBy?: 'newest' | 'oldest' | 'subject';
  }): GTUQuestionPaper[] {
    let filtered = [...this.papers];

    if (params.semester && params.semester !== 'all') {
      filtered = filtered.filter((p) => p.semester === Number(params.semester));
    }

    if (params.year && params.year !== 'all') {
      filtered = filtered.filter((p) => p.year === Number(params.year));
    }

    if (params.exam && params.exam !== 'all') {
      filtered = filtered.filter((p) => p.exam === params.exam);
    }

    if (params.searchQuery && params.searchQuery.trim()) {
      const q = params.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.subject.toLowerCase().includes(q) ||
          p.subjectCode.toLowerCase().includes(q) ||
          p.exam.toLowerCase().includes(q) ||
          p.year.toString().includes(q) ||
          `sem ${p.semester}`.includes(q) ||
          `semester ${p.semester}`.includes(q)
      );
    }

    if (params.sortBy === 'oldest') {
      filtered.sort((a, b) => a.year - b.year || a.semester - b.semester);
    } else if (params.sortBy === 'subject') {
      filtered.sort((a, b) => a.subject.localeCompare(b.subject));
    } else {
      // default: newest
      filtered.sort((a, b) => b.year - a.year || a.semester - b.semester);
    }

    return filtered;
  }

  /**
   * Generates an authentic, beautifully formatted GTU examination PDF file.
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
    doc.setDrawColor(0, 71, 65); // Cyprus green
    doc.setLineWidth(0.6);
    doc.rect(margin - 2, margin - 2, pageWidth - (margin * 2) + 4, pageHeight - (margin * 2) + 4);

    // University Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 71, 65);
    doc.text(content?.university || 'GUJARAT TECHNOLOGICAL UNIVERSITY', pageWidth / 2, y + 4, { align: 'center' });
    y += 9;

    // Degree & Session
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(
      content?.degree || `BCA - SEMESTER ${paper.semester} • EXAMINATION - ${paper.exam.toUpperCase()} ${paper.year}`,
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
    doc.text(`Time: ${content?.time || '02:30 PM to 05:00 PM'}`, pageWidth - margin - 42, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.text(`Date of Exam: ${content?.date || `Session ${paper.exam} ${paper.year}`}`, margin, y);
    doc.text(`Seat No: [ _______________ ]`, pageWidth - margin - 42, y);
    y += 6;

    // Instructions Box
    doc.setFillColor(245, 243, 238); // Warm Sand
    doc.rect(margin, y, pageWidth - (margin * 2), 16, 'F');
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
        // Check for page break
        if (y > pageHeight - 35) {
          doc.addPage();
          doc.setDrawColor(0, 71, 65);
          doc.setLineWidth(0.6);
          doc.rect(margin - 2, margin - 2, pageWidth - (margin * 2) + 4, pageHeight - (margin * 2) + 4);
          y = margin + 4;
        }

        // Section Title
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
            doc.rect(margin - 2, margin - 2, pageWidth - (margin * 2) + 4, pageHeight - (margin * 2) + 4);
            y = margin + 4;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(20, 20, 20);
          doc.text(q.qNumber, margin, y);

          // Right-aligned marks
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 71, 65);
          doc.text(`[${q.marks} Marks]`, pageWidth - margin, y, { align: 'right' });

          // Question text with word wrapping
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          const maxTextWidth = pageWidth - (margin * 2) - 36;
          const lines = doc.splitTextToSize(q.text, maxTextWidth);
          doc.text(lines, margin + 18, y);
          y += Math.max(lines.length * 4.2, 5.5);

          // OR Question if present
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

          y += 2.5; // spacing between questions
        });

        y += 3;
      });
    }

    // Page footer note
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text('Gujarat Technological University • Verified BCA Examination Paper Archive • StudyMate AI', pageWidth / 2, pageHeight - margin + 1, { align: 'center' });

    return doc;
  }

  /**
   * Downloads the actual PDF file directly to the user's device with meaningful filename.
   */
  public async downloadPaperPDF(paper: GTUQuestionPaper): Promise<void> {
    if (!paper.isAvailable) {
      throw new Error(`PDF for ${paper.subject} (${paper.year}) has not been uploaded yet.`);
    }

    if (paper.pdfUrl) {
      // Download remote/static file directly
      const link = document.createElement('a');
      link.href = paper.pdfUrl;
      link.download = paper.fileName || `GTU_BCA_Sem${paper.semester}_${paper.subjectCode}_${paper.year}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Generate genuine PDF via jsPDF
    const doc = this.generatePaperPDF(paper);
    const fileName = paper.fileName || `GTU_BCA_Sem${paper.semester}_${paper.subject.replace(/\s+/g, '_')}_${paper.year}.pdf`;
    doc.save(fileName);
  }

  /**
   * Future Admin Scalability: Upload/Add new paper.
   */
  public addPaper(paper: Omit<GTUQuestionPaper, 'id'>): GTUQuestionPaper {
    const newPaper: GTUQuestionPaper = {
      ...paper,
      id: `gtu-paper-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      published: true,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    this.papers.unshift(newPaper);
    return newPaper;
  }

  /**
   * Future Admin Scalability: Delete paper.
   */
  public deletePaper(id: string): boolean {
    const initialLen = this.papers.length;
    this.papers = this.papers.filter((p) => p.id !== id);
    return this.papers.length !== initialLen;
  }
}

export const paperService = new PaperService();
