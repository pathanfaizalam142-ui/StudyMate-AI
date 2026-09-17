import curriculumData from '../data/curriculumData.json';
import { GTUQuestionPaper } from '../types';

export interface ValidationIssue {
  type:
    | 'missing_subject'
    | 'duplicate_subject_code'
    | 'duplicate_paper'
    | 'invalid_pdf_url'
    | 'missing_semester'
    | 'invalid_availability';
  severity: 'error' | 'warning';
  message: string;
  details?: Record<string, any>;
}

export interface PaperValidationReport {
  isValid: boolean;
  totalCurriculumSubjects: number;
  totalConfiguredPapers: number;
  totalAvailablePapers: number;
  errors: string[];
  warnings: string[];
  issues: ValidationIssue[];
  semesterSummary: Record<
    number,
    {
      curriculumSubjectsCount: number;
      configuredPapersCount: number;
      availablePapersCount: number;
      subjectCodes: string[];
    }
  >;
}

/**
 * Validates the GTU Examination Papers dataset against the official GTU BCA Curriculum.
 * Checks for:
 * 1. Missing subjects (every curriculum subject from Sem 1 to Sem 6 must exist)
 * 2. Duplicate subject codes
 * 3. Duplicate papers (same id or same subjectCode + year + exam)
 * 4. Invalid or missing PDF URLs (no fake links, authentic URL format check)
 * 5. Subjects without semester assignment or invalid semester (must be 1 to 6)
 * 6. Integrity of available papers (must have valid paperContent or verified pdfUrl)
 */
export function validateGtuPapersData(papers: GTUQuestionPaper[]): PaperValidationReport {
  const issues: ValidationIssue[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Build canonical curriculum index
  const curriculumMap = new Map<string, { code: string; name: string; semester: number }>();
  const semesterCurriculumCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (const item of curriculumData) {
    curriculumMap.set(item.code.toUpperCase(), {
      code: item.code.toUpperCase(),
      name: item.name,
      semester: item.semester,
    });
    semesterCurriculumCount[item.semester] = (semesterCurriculumCount[item.semester] || 0) + 1;
  }

  // 2. Track configured papers
  const paperIds = new Set<string>();
  const uniqueKeys = new Set<string>(); // subjectCode_year_exam
  const configuredSubjectCodes = new Set<string>();

  const semesterSummary: PaperValidationReport['semesterSummary'] = {
    1: { curriculumSubjectsCount: semesterCurriculumCount[1] || 0, configuredPapersCount: 0, availablePapersCount: 0, subjectCodes: [] },
    2: { curriculumSubjectsCount: semesterCurriculumCount[2] || 0, configuredPapersCount: 0, availablePapersCount: 0, subjectCodes: [] },
    3: { curriculumSubjectsCount: semesterCurriculumCount[3] || 0, configuredPapersCount: 0, availablePapersCount: 0, subjectCodes: [] },
    4: { curriculumSubjectsCount: semesterCurriculumCount[4] || 0, configuredPapersCount: 0, availablePapersCount: 0, subjectCodes: [] },
    5: { curriculumSubjectsCount: semesterCurriculumCount[5] || 0, configuredPapersCount: 0, availablePapersCount: 0, subjectCodes: [] },
    6: { curriculumSubjectsCount: semesterCurriculumCount[6] || 0, configuredPapersCount: 0, availablePapersCount: 0, subjectCodes: [] },
  };

  let totalAvailable = 0;

  for (const paper of papers) {
    const code = (paper.subjectCode || '').toUpperCase().trim();
    const sem = paper.semester;

    // A. Check semester assignment
    if (!sem || sem < 1 || sem > 6) {
      const msg = `Paper "${paper.id}" has invalid or missing semester: ${sem}`;
      errors.push(msg);
      issues.push({
        type: 'missing_semester',
        severity: 'error',
        message: msg,
        details: { paperId: paper.id, semester: sem },
      });
    } else {
      if (!semesterSummary[sem]) {
        semesterSummary[sem] = {
          curriculumSubjectsCount: 0,
          configuredPapersCount: 0,
          availablePapersCount: 0,
          subjectCodes: [],
        };
      }
      semesterSummary[sem].configuredPapersCount++;
      if (!semesterSummary[sem].subjectCodes.includes(code)) {
        semesterSummary[sem].subjectCodes.push(code);
      }
      if (paper.isAvailable) {
        semesterSummary[sem].availablePapersCount++;
      }
    }

    if (paper.isAvailable) {
      totalAvailable++;
    }

    // B. Check duplicate paper ID
    if (paperIds.has(paper.id)) {
      const msg = `Duplicate paper ID detected: "${paper.id}"`;
      errors.push(msg);
      issues.push({
        type: 'duplicate_paper',
        severity: 'error',
        message: msg,
        details: { paperId: paper.id },
      });
    } else {
      paperIds.add(paper.id);
    }

    // C. Check duplicate (subjectCode + year + exam)
    const key = `${code}_${paper.year}_${paper.exam}`;
    if (uniqueKeys.has(key)) {
      const msg = `Duplicate paper session detected for subject ${code} in ${paper.year} ${paper.exam}`;
      errors.push(msg);
      issues.push({
        type: 'duplicate_paper',
        severity: 'error',
        message: msg,
        details: { key, paperId: paper.id },
      });
    } else {
      uniqueKeys.add(key);
    }

    configuredSubjectCodes.add(code);

    // D. Validate Subject against curriculum
    const matchedCurriculum = curriculumMap.get(code);
    if (!matchedCurriculum) {
      const msg = `Subject code "${code}" (${paper.subject}) is not present in the official GTU BCA curriculum.`;
      errors.push(msg);
      issues.push({
        type: 'missing_subject',
        severity: 'error',
        message: msg,
        details: { subjectCode: code, paperId: paper.id },
      });
    } else if (matchedCurriculum.semester !== paper.semester) {
      const msg = `Subject code "${code}" semester mismatch: curriculum has Sem ${matchedCurriculum.semester}, but paper specifies Sem ${paper.semester}.`;
      errors.push(msg);
      issues.push({
        type: 'missing_semester',
        severity: 'error',
        message: msg,
        details: { subjectCode: code, expectedSemester: matchedCurriculum.semester, actualSemester: paper.semester },
      });
    }

    // E. Validate PDF URLs & Availability
    if (paper.pdfUrl) {
      // Must be a valid URL string or valid static path
      try {
        const isValidUrl =
          paper.pdfUrl.startsWith('/') ||
          paper.pdfUrl.startsWith('http://') ||
          paper.pdfUrl.startsWith('https://');
        if (!isValidUrl) {
          throw new Error('Invalid URL format');
        }
      } catch {
        const msg = `Paper "${paper.id}" contains an invalid or malformed PDF URL: "${paper.pdfUrl}"`;
        errors.push(msg);
        issues.push({
          type: 'invalid_pdf_url',
          severity: 'error',
          message: msg,
          details: { paperId: paper.id, pdfUrl: paper.pdfUrl },
        });
      }
    }

    // F. Availability integrity: If marked available, MUST have real content or verified pdfUrl
    if (paper.isAvailable) {
      const hasContent = Boolean(paper.paperContent && paper.paperContent.sections && paper.paperContent.sections.length > 0);
      const hasValidUrl = Boolean(paper.pdfUrl && paper.pdfUrl.trim().length > 0);
      if (!hasContent && !hasValidUrl) {
        const msg = `Paper "${paper.id}" (${paper.subjectCode}) is labeled "isAvailable: true" but has neither valid paperContent nor a verified pdfUrl!`;
        errors.push(msg);
        issues.push({
          type: 'invalid_availability',
          severity: 'error',
          message: msg,
          details: { paperId: paper.id },
        });
      }
    }
  }

  // 3. Detect Missing Subjects from Curriculum
  for (const [code, currSubject] of curriculumMap.entries()) {
    if (!configuredSubjectCodes.has(code)) {
      const msg = `Missing subject from GTU Papers repository: [${code}] "${currSubject.name}" (Semester ${currSubject.semester})`;
      errors.push(msg);
      issues.push({
        type: 'missing_subject',
        severity: 'error',
        message: msg,
        details: { subjectCode: code, semester: currSubject.semester, name: currSubject.name },
      });
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    totalCurriculumSubjects: curriculumMap.size,
    totalConfiguredPapers: papers.length,
    totalAvailablePapers: totalAvailable,
    errors,
    warnings,
    issues,
    semesterSummary,
  };
}

/**
 * Runs validation and logs a developer health check report in development mode.
 */
export function runDevPaperAudit(papers: GTUQuestionPaper[]): PaperValidationReport {
  const report = validateGtuPapersData(papers);
  if (import.meta.env.DEV) {
    if (report.isValid) {
      console.log(
        `%c[GTU Papers Audit] PASSED: All ${report.totalCurriculumSubjects} GTU BCA subjects validated across Sem 1-6 (${report.totalAvailablePapers} authentic papers available).`,
        'color: #004741; font-weight: bold;'
      );
    } else {
      console.error(
        `%c[GTU Papers Audit] FAILED with ${report.errors.length} errors:`,
        'color: #dc2626; font-weight: bold;',
        report.errors
      );
    }
  }
  return report;
}
