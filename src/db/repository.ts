import { AppDatabase } from "./connection";
import { computeQuestionHash } from "./hash";
import { QuizQuestion } from "../../serverQuizBank";

export class HierarchyResolutionError extends Error {
  public readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "HierarchyResolutionError";
  }
}

export interface ResolvedAcademicHierarchy {
  semesterId: number;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  unitId: string | null;
  unitNumber: number | null;
  unitTitle: string | null;
  topicId: string | null;
  topicTitle: string | null;
}

export interface HierarchyLookupInput {
  semester?: number;
  subjectId?: string;
  subjectCode?: string;
  subjectName?: string;
  unitId?: string;
  unitNumber?: number;
  unitName?: string;
  topicId?: string;
  topicName?: string;
}

/**
 * Phase 1.1 Section 4 — Server-Side Canonical Subject/Unit/Topic Resolution Contract.
 * Resolves and validates the academic hierarchy strictly against canonical SQLite rows.
 */
export function resolveAcademicHierarchy(
  db: AppDatabase,
  input: HierarchyLookupInput
): ResolvedAcademicHierarchy {
  let subjectRow:
    | { id: string; semester_id: number; code: string; name: string; short_name: string | null }
    | undefined;

  if (input.subjectId) {
    subjectRow = db
      .prepare(
        "SELECT id, semester_id, code, name, short_name FROM subjects WHERE id = ? AND is_active = 1"
      )
      .get(input.subjectId.trim()) as typeof subjectRow;
  }

  if (!subjectRow && input.subjectCode) {
    subjectRow = db
      .prepare(
        "SELECT id, semester_id, code, name, short_name FROM subjects WHERE UPPER(code) = UPPER(?) AND is_active = 1"
      )
      .get(input.subjectCode.trim()) as typeof subjectRow;
  }

  if (!subjectRow && input.subjectName) {
    const cleanName = input.subjectName.trim();
    // 1. Exact case-insensitive match on name, short_name, or code
    subjectRow = db
      .prepare(
        `SELECT id, semester_id, code, name, short_name
         FROM subjects
         WHERE is_active = 1
           AND (LOWER(name) = LOWER(?) OR LOWER(short_name) = LOWER(?) OR LOWER(code) = LOWER(?))
         LIMIT 1`
      )
      .get(cleanName, cleanName, cleanName) as typeof subjectRow;

    // 2. Substring match on canonical name or short_name if unambiguous
    if (!subjectRow) {
      const candidates = db
        .prepare(
          `SELECT id, semester_id, code, name, short_name
           FROM subjects
           WHERE is_active = 1
             AND (LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(?) LIKE '%' || LOWER(name) || '%'
               OR LOWER(short_name) LIKE '%' || LOWER(?) || '%')`
        )
        .all(cleanName, cleanName, cleanName) as Array<NonNullable<typeof subjectRow>>;

      if (candidates.length === 1) {
        subjectRow = candidates[0];
      } else if (candidates.length > 1 && input.semester) {
        const semFiltered = candidates.filter((c) => c.semester_id === Number(input.semester));
        if (semFiltered.length === 1) {
          subjectRow = semFiltered[0];
        }
      }
    }
  }

  if (!subjectRow) {
    throw new HierarchyResolutionError(
      `Cannot resolve canonical GTU BCA subject from input: ${JSON.stringify({
        subjectId: input.subjectId,
        subjectCode: input.subjectCode,
        subjectName: input.subjectName,
      })}`
    );
  }

  let unitRow:
    | { id: string; subject_id: string; unit_number: number; title: string }
    | undefined;

  if (input.unitId) {
    unitRow = db
      .prepare(
        "SELECT id, subject_id, unit_number, title FROM units WHERE id = ? AND is_active = 1"
      )
      .get(input.unitId.trim()) as typeof unitRow;

    if (!unitRow || unitRow.subject_id !== subjectRow.id) {
      throw new HierarchyResolutionError(
        `Hierarchy mismatch: unitId '${input.unitId}' does not belong to subject '${subjectRow.code}' (${subjectRow.id})`
      );
    }
  } else if (input.unitNumber) {
    unitRow = db
      .prepare(
        "SELECT id, subject_id, unit_number, title FROM units WHERE subject_id = ? AND unit_number = ? AND is_active = 1"
      )
      .get(subjectRow.id, Number(input.unitNumber)) as typeof unitRow;
  } else if (input.unitName) {
    const cleanUnit = input.unitName.trim();
    const unitNumMatch = cleanUnit.match(/unit\s*(\d+)/i);
    if (unitNumMatch) {
      unitRow = db
        .prepare(
          "SELECT id, subject_id, unit_number, title FROM units WHERE subject_id = ? AND unit_number = ? AND is_active = 1"
        )
        .get(subjectRow.id, Number(unitNumMatch[1])) as typeof unitRow;
    }
    if (!unitRow) {
      unitRow = db
        .prepare(
          "SELECT id, subject_id, unit_number, title FROM units WHERE subject_id = ? AND LOWER(title) LIKE '%' || LOWER(?) || '%' AND is_active = 1 LIMIT 1"
        )
        .get(subjectRow.id, cleanUnit) as typeof unitRow;
    }
  }

  let topicRow:
    | { id: string; subject_id: string; unit_id: string; title: string }
    | undefined;

  if (input.topicId) {
    topicRow = db
      .prepare(
        "SELECT id, subject_id, unit_id, title FROM topics WHERE id = ? AND is_active = 1"
      )
      .get(input.topicId.trim()) as typeof topicRow;

    if (!topicRow || topicRow.subject_id !== subjectRow.id) {
      throw new HierarchyResolutionError(
        `Hierarchy mismatch: topicId '${input.topicId}' does not belong to subject '${subjectRow.code}' (${subjectRow.id})`
      );
    }
    if (unitRow && topicRow.unit_id !== unitRow.id) {
      throw new HierarchyResolutionError(
        `Hierarchy mismatch: topicId '${input.topicId}' does not belong to unit '${unitRow.id}'`
      );
    }
    if (!unitRow) {
      unitRow = db
        .prepare(
          "SELECT id, subject_id, unit_number, title FROM units WHERE id = ?"
        )
        .get(topicRow.unit_id) as typeof unitRow;
    }
  } else if (input.topicName) {
    const cleanTopic = input.topicName.trim();
    if (unitRow) {
      topicRow = db
        .prepare(
          "SELECT id, subject_id, unit_id, title FROM topics WHERE subject_id = ? AND unit_id = ? AND LOWER(title) LIKE '%' || LOWER(?) || '%' AND is_active = 1 LIMIT 1"
        )
        .get(subjectRow.id, unitRow.id, cleanTopic) as typeof topicRow;
    } else {
      topicRow = db
        .prepare(
          "SELECT id, subject_id, unit_id, title FROM topics WHERE subject_id = ? AND LOWER(title) LIKE '%' || LOWER(?) || '%' AND is_active = 1 LIMIT 1"
        )
        .get(subjectRow.id, cleanTopic) as typeof topicRow;
      if (topicRow) {
        unitRow = db
          .prepare("SELECT id, subject_id, unit_number, title FROM units WHERE id = ?")
          .get(topicRow.unit_id) as typeof unitRow;
      }
    }
  }

  return {
    semesterId: subjectRow.semester_id,
    subjectId: subjectRow.id,
    subjectCode: subjectRow.code,
    subjectName: subjectRow.name,
    unitId: unitRow ? unitRow.id : null,
    unitNumber: unitRow ? unitRow.unit_number : null,
    unitTitle: unitRow ? unitRow.title : null,
    topicId: topicRow ? topicRow.id : null,
    topicTitle: topicRow ? topicRow.title : null,
  };
}

/**
 * Fetches active MCQs from SQLite strictly isolated to a single canonical subject.
 */
export function getQuestionsForCanonicalSubject(
  db: AppDatabase,
  hierarchy: ResolvedAcademicHierarchy,
  options: {
    language?: string;
    difficulty?: string;
    count?: number;
  } = {}
): QuizQuestion[] {
  const lang = options.language === "hi" ? "hi" : "en";
  const limit = Math.max(1, Math.min(50, options.count || 10));

  const rows = db
    .prepare(
      `SELECT id, unit_id, topic_id, question_text, language, options_json, correct_index, explanation, difficulty
       FROM questions
       WHERE subject_id = ?
         AND is_active = 1
       ORDER BY
         CASE WHEN language = ? THEN 0 ELSE 1 END,
         CASE WHEN (? IS NOT NULL AND topic_id = ?) THEN 0
              WHEN (? IS NOT NULL AND unit_id = ?) THEN 1
              ELSE 2 END,
         verified DESC,
         created_at ASC
       LIMIT ?`
    )
    .all(
      hierarchy.subjectId,
      lang,
      hierarchy.topicId,
      hierarchy.topicId,
      hierarchy.unitId,
      hierarchy.unitId,
      limit
    ) as Array<{
    id: string;
    question_text: string;
    options_json: string;
    correct_index: number;
    explanation: string;
  }>;

  return rows.map((r) => {
    const parsedOptions = JSON.parse(r.options_json) as string[];
    return {
      question: r.question_text,
      options: parsedOptions,
      correctAnswer: r.correct_index,
      correctAnswerIndex: r.correct_index,
      explanation: r.explanation,
    };
  });
}

/**
 * Validates and persists AI-generated MCQs into `questions` (`source = 'ai'`, `verified = 0`, `ai_generated = 1`)
 * strictly bound to the resolved canonical subject/unit/topic hierarchy.
 */
export function persistValidatedAiQuestions(
  db: AppDatabase,
  hierarchy: ResolvedAcademicHierarchy,
  questions: QuizQuestion[],
  language: string = "en",
  difficulty: string = "medium"
): number {
  const validLang = language === "hi" ? "hi" : "en";
  const validDiff =
    difficulty === "easy" || difficulty === "hard" ? difficulty : "medium";

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO questions (
      id, subject_id, unit_id, topic_id,
      question_text, question_hash, language, options_json,
      correct_index, explanation, difficulty, marks,
      source, ai_generated, verified, is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'ai', 1, 0, 1)
  `);

  let insertedCount = 0;
  const persistTx = db.transaction(() => {
    for (const q of questions) {
      if (!q || typeof q.question !== "string" || q.question.trim().length < 10) continue;
      if (!Array.isArray(q.options) || q.options.length !== 4) continue;
      const cleanOpts = q.options.map((o) => String(o || "").trim());
      if (cleanOpts.some((o) => !o)) continue;
      if (new Set(cleanOpts.map((o) => o.toLowerCase())).size < 4) continue;

      const cIdx = Number(q.correctAnswerIndex ?? q.correctAnswer);
      if (!Number.isInteger(cIdx) || cIdx < 0 || cIdx > 3) continue;

      const explanation =
        typeof q.explanation === "string" && q.explanation.trim().length >= 5
          ? q.explanation.trim()
          : `Option ${String.fromCharCode(65 + cIdx)} is the correct answer.`;

      const qHash = computeQuestionHash(q.question);
      if (!qHash) continue;

      const qId = `q_ai_${hierarchy.subjectCode}_${qHash.slice(0, 16)}`;
      const res = insertStmt.run(
        qId,
        hierarchy.subjectId,
        hierarchy.unitId,
        hierarchy.topicId,
        q.question.trim(),
        qHash,
        validLang,
        JSON.stringify(cleanOpts),
        cIdx,
        explanation,
        validDiff
      );
      if (Number(res.changes) > 0) {
        insertedCount++;
      }
    }
  });

  persistTx();
  return insertedCount;
}

/**
 * Returns the complete canonical curriculum from SQLite grouped by semester.
 */
export function getCanonicalCurriculumFromDb(db: AppDatabase, semester?: number) {
  const semesters = db
    .prepare(
      semester
        ? "SELECT id, number, title FROM semesters WHERE number = ? AND is_active = 1 ORDER BY number ASC"
        : "SELECT id, number, title FROM semesters WHERE is_active = 1 ORDER BY number ASC"
    )
    .all(...(semester ? [semester] : [])) as Array<{
    id: number;
    number: number;
    title: string;
  }>;

  const subjects = db
    .prepare(
      "SELECT id, semester_id, code, name, short_name, category, credits, description FROM subjects WHERE is_active = 1 ORDER BY semester_id ASC, code ASC"
    )
    .all() as Array<{
    id: string;
    semester_id: number;
    code: string;
    name: string;
    short_name: string | null;
    category: string;
    credits: number;
    description: string | null;
  }>;

  const units = db
    .prepare(
      "SELECT id, subject_id, unit_number, title, description, weightage, order_index FROM units WHERE is_active = 1 ORDER BY subject_id ASC, unit_number ASC"
    )
    .all() as Array<{
    id: string;
    subject_id: string;
    unit_number: number;
    title: string;
    description: string | null;
    weightage: string | null;
    order_index: number;
  }>;

  const topics = db
    .prepare(
      "SELECT id, subject_id, unit_id, title, summary, important_marks_json, order_index FROM topics WHERE is_active = 1 ORDER BY unit_id ASC, order_index ASC"
    )
    .all() as Array<{
    id: string;
    subject_id: string;
    unit_id: string;
    title: string;
    summary: string | null;
    important_marks_json: string | null;
    order_index: number;
  }>;

  return semesters.map((sem) => {
    const semSubjects = subjects
      .filter((s) => s.semester_id === sem.id)
      .map((s) => {
        const subjUnits = units
          .filter((u) => u.subject_id === s.id)
          .map((u) => {
            const unitTopics = topics
              .filter((t) => t.unit_id === u.id)
              .map((t) => ({
                id: t.id,
                title: t.title,
                summary: t.summary || "",
                importantMarks: t.important_marks_json
                  ? (() => {
                      try {
                        const parsed = JSON.parse(t.important_marks_json);
                        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [3, 5, 7];
                      } catch {
                        return [3, 5, 7];
                      }
                    })()
                  : [3, 5, 7],
              }));
            return {
              id: u.id,
              unitNumber: u.unit_number,
              unitName: u.title,
              weightage: u.weightage || "25%",
              topics: unitTopics,
            };
          });

        return {
          id: s.id,
          semester: s.semester_id,
          code: s.code,
          name: s.name,
          shortName: s.short_name || s.name,
          category: s.category,
          credits: s.credits,
          description: s.description || "",
          units: subjUnits,
        };
      });

    return {
      semester: sem.number,
      title: sem.title,
      subjects: semSubjects,
    };
  });
}

/**
 * Returns the 4-State GTU Examination Papers view model per semester directly from canonical SQLite tables.
 */
export function getSemesterPapersFromDb(db: AppDatabase, semester?: number) {
  const semesters = db
    .prepare(
      semester
        ? "SELECT id, number, title FROM semesters WHERE number = ? AND is_active = 1 ORDER BY number ASC"
        : "SELECT id, number, title FROM semesters WHERE is_active = 1 ORDER BY number ASC"
    )
    .all(...(semester ? [semester] : [])) as Array<{
    id: number;
    number: number;
    title: string;
  }>;

  const subjects = db
    .prepare(
      "SELECT id, semester_id, code, name, short_name, category, credits FROM subjects WHERE is_active = 1 ORDER BY semester_id ASC, code ASC"
    )
    .all() as Array<{
    id: string;
    semester_id: number;
    code: string;
    name: string;
    short_name: string | null;
    category: string;
    credits: number;
  }>;

  const papers = db
    .prepare(
      `SELECT id, semester_id, subject_id, subject_code_snapshot, subject_name_snapshot,
              exam_year, exam_session, title, availability_status, source_type,
              file_url, external_url, file_name, file_size, total_pages,
              total_marks, duration_minutes, instructions_json, exam_date, exam_time,
              published, verified
       FROM papers
       ORDER BY exam_year DESC`
    )
    .all() as Array<{
    id: string;
    semester_id: number;
    subject_id: string;
    subject_code_snapshot: string;
    subject_name_snapshot: string;
    exam_year: number;
    exam_session: "Summer" | "Winter";
    title: string;
    availability_status: "available" | "unavailable" | "pending_verification" | "archived";
    source_type: string;
    file_url: string | null;
    external_url: string | null;
    file_name: string | null;
    file_size: string | null;
    total_pages: number | null;
    total_marks: number;
    duration_minutes: number;
    instructions_json: string | null;
    exam_date: string | null;
    exam_time: string | null;
    published: number;
    verified: number;
  }>;

  const paperQuestions = db
    .prepare(
      `SELECT id, paper_id, subject_id, unit_id, topic_id,
              section_number, section_title, question_number, sub_question_label,
              choice_group_label, is_alternative, question_text, marks, display_order
       FROM paper_questions
       ORDER BY paper_id ASC, display_order ASC`
    )
    .all() as Array<{
    id: string;
    paper_id: string;
    subject_id: string;
    unit_id: string | null;
    topic_id: string | null;
    section_number: number;
    section_title: string;
    question_number: string;
    sub_question_label: string | null;
    choice_group_label: string | null;
    is_alternative: number;
    question_text: string;
    marks: number;
    display_order: number;
  }>;

  return semesters.map((sem) => {
    const semSubjects = subjects.filter((s) => s.semester_id === sem.id);
    const items = semSubjects.map((subj) => {
      const matchedPaper =
        papers.find(
          (p) =>
            p.subject_id === subj.id &&
            p.availability_status === "available" &&
            p.published === 1 &&
            p.verified === 1
        ) || papers.find((p) => p.subject_id === subj.id);
      const isAvailable = Boolean(
        matchedPaper &&
          matchedPaper.availability_status === "available" &&
          matchedPaper.published === 1 &&
          matchedPaper.verified === 1
      );

      let structuredPaper: any = null;
      if (isAvailable && matchedPaper) {
        const pQuestions = paperQuestions.filter(
          (pq) => pq.paper_id === matchedPaper.id && pq.subject_id === subj.id
        );
        const sectionsMap = new Map<
          number,
          {
            title: string;
            questions: Array<{
              qNumber: string;
              text: string;
              marks: number;
              orQuestion?: { qNumber: string; text: string; marks: number };
            }>;
          }
        >();

        for (const pq of pQuestions) {
          let sec = sectionsMap.get(pq.section_number);
          if (!sec) {
            sec = { title: pq.section_title, questions: [] };
            sectionsMap.set(pq.section_number, sec);
          }
          if (pq.is_alternative === 1 && sec.questions.length > 0) {
            const prevPrimary = sec.questions[sec.questions.length - 1];
            prevPrimary.orQuestion = {
              qNumber: pq.question_number,
              text: pq.question_text,
              marks: pq.marks,
            };
          } else {
            sec.questions.push({
              qNumber: pq.question_number,
              text: pq.question_text,
              marks: pq.marks,
            });
          }
        }

        const canonicalFileName = `GTU_BCA_Sem${sem.number}_${subj.code}_${matchedPaper.exam_year}_${matchedPaper.exam_session}.pdf`;

        structuredPaper = {
          id: matchedPaper.id,
          semester: sem.number,
          year: matchedPaper.exam_year,
          exam: matchedPaper.exam_session,
          subject: subj.name,
          subjectCode: subj.code,
          fileName: canonicalFileName,
          pdfUrl: matchedPaper.file_url || matchedPaper.external_url || undefined,
          isAvailable: true,
          totalPages: matchedPaper.total_pages || 2,
          fileSize: matchedPaper.file_size || undefined,
          published: true,
          paperContent: {
            university: "GUJARAT TECHNOLOGICAL UNIVERSITY",
            degree: `BCA - SEMESTER-${sem.number} • EXAMINATION - ${matchedPaper.exam_session.toUpperCase()} ${matchedPaper.exam_year}`,
            semester: sem.number,
            examSession: `${matchedPaper.exam_session} ${matchedPaper.exam_year} Examination`,
            subjectCode: subj.code,
            subjectName: subj.name,
            date: matchedPaper.exam_date || "GTU Examination",
            time: matchedPaper.exam_time || "10:30 AM to 01:00 PM",
            totalMarks: matchedPaper.total_marks,
            instructions: matchedPaper.instructions_json
              ? (JSON.parse(matchedPaper.instructions_json) as string[])
              : ["Attempt all questions.", "Figures to the right indicate full marks."],
            sections: Array.from(sectionsMap.entries())
              .sort((a, b) => a[0] - b[0])
              .map(([, v]) => v),
          },
        };
      }

      return {
        semester: sem.number,
        subjectId: subj.id,
        subjectCode: subj.code,
        subjectName: subj.name,
        shortName: subj.short_name || subj.name,
        category: subj.category,
        credits: subj.credits,
        examYear: isAvailable && matchedPaper ? matchedPaper.exam_year : null,
        examSession: isAvailable && matchedPaper ? matchedPaper.exam_session : null,
        availabilityStatus: matchedPaper ? matchedPaper.availability_status : "unavailable",
        pdfStatus: isAvailable ? "PDF Available" : "PDF not available",
        isAvailable,
        verifiedPdfUrl:
          isAvailable && matchedPaper
            ? matchedPaper.file_url || matchedPaper.external_url || null
            : null,
        paper: structuredPaper,
        validation: {
          isValid: isAvailable,
          canView: isAvailable,
          canDownload: isAvailable,
          statusLabel: isAvailable ? "PDF Available" : "PDF not available",
        },
      };
    });

    return {
      semester: sem.number,
      title: sem.title,
      totalSubjects: items.length,
      availableCount: items.filter((i) => i.isAvailable).length,
      unavailableCount: items.filter((i) => !i.isAvailable).length,
      subjects: items,
    };
  });
}
