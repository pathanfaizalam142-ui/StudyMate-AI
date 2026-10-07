import crypto from "node:crypto";
import { AppDatabase } from "./connection";
import { computeQuestionHash, computeSha256Hex, hashPasswordScrypt, verifyPasswordScrypt } from "./hash";

export interface AdminDashboardStats {
  totalSemesters: number;
  totalCanonicalSubjects: number;
  totalUnits: number;
  totalTopics: number;
  totalStudyMaterials: number;
  totalPapers: number;
  availablePapers: number;
  unavailablePaperRows: number;
  unavailableSubjects: number;
  totalPaperQuestions: number;
  totalMcqs: number;
  totalQuizzes: number;
  totalQuizQuestions: number;
  totalQuarantinedRecords: number;
  semesterBreakdown: Array<{
    semester: number;
    title: string;
    subjectCount: number;
    unitCount: number;
    topicCount: number;
    availablePaperCount: number;
    unavailableSubjectCount: number;
    paperQuestionCount: number;
    mcqCount: number;
  }>;
  quarantinedRecords: Array<{
    id: string;
    sourceTable: string;
    legacyId: string;
    reason: string;
    quarantinedAt: string;
  }>;
}

export interface AdminSubjectRecord {
  id: string;
  semester: number;
  code: string;
  name: string;
  shortName: string;
  category: string;
  credits: number;
  description: string;
  isActive: boolean;
  availabilityStatus: "available" | "unavailable";
  paperStatus: "PDF Available" | "PDF not available";
  paperId: string | null;
  examYear: number | null;
  examSession: "Summer" | "Winter" | null;
  unitCount: number;
  topicCount: number;
  paperQuestionCount: number;
  mcqCount: number;
  totalQuestionCount: number;
}

export interface AdminSubjectDetail extends AdminSubjectRecord {
  units: Array<{
    id: string;
    unitNumber: number;
    title: string;
    weightage: string | null;
    topicCount: number;
    topics: Array<{
      id: string;
      title: string;
      summary: string | null;
      importantMarks: number[];
    }>;
  }>;
}

export interface AdminPaperSlotRecord {
  paperId: string | null;
  semester: number;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  shortName: string;
  category: string;
  examYear: number | null;
  examSession: "Summer" | "Winter" | null;
  title: string | null;
  availabilityStatus: "available" | "unavailable" | "pending_verification" | "archived";
  pdfStatus: "PDF Available" | "PDF not available";
  isAvailable: boolean;
  published: boolean;
  verified: boolean;
  fileName: string | null;
  totalMarks: number | null;
  durationMinutes: number | null;
  questionCount: number;
  primaryQuestionCount: number;
  alternativeQuestionCount: number;
}

export interface AdminPaperQuestionRecord {
  id: string;
  paperId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  unitId: string | null;
  unitNumber: number | null;
  unitTitle: string | null;
  topicId: string | null;
  topicTitle: string | null;
  sectionNumber: number;
  sectionTitle: string;
  questionNumber: string;
  subQuestionLabel: string | null;
  choiceGroupLabel: string | null;
  isAlternative: boolean;
  relatedQuestionId: string | null;
  relatedQuestionNumber: string | null;
  questionText: string;
  marks: number;
  displayOrder: number;
}

export interface AdminMcqRecord {
  id: string;
  semester: number;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  unitId: string | null;
  unitNumber: number | null;
  unitTitle: string | null;
  topicId: string | null;
  topicTitle: string | null;
  questionText: string;
  language: "en" | "hi";
  options: string[];
  correctIndex: number;
  correctOptionLetter: string;
  correctOptionText: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  source: "seed" | "ai" | "admin";
  questionType: "MCQ";
  verified: boolean;
  aiGenerated: boolean;
}

/**
 * Validates that a semester parameter is an integer in [1, 6].
 */
export function parseValidSemester(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "" || raw === "all") {
    return null;
  }
  const num = Number(raw);
  if (!Number.isInteger(num) || num < 1 || num > 6) {
    throw new Error(`Invalid semester parameter: "${String(raw)}". Must be an integer between 1 and 6.`);
  }
  return num;
}

/**
 * 1. ADMIN DASHBOARD STATISTICS (100% SQLite-driven)
 */
export function getAdminDashboardStats(db: AppDatabase): AdminDashboardStats {
  const countQuery = (sql: string): number => {
    const row = db.prepare(sql).get() as { c: number } | undefined;
    return Number(row?.c ?? 0);
  };

  const totalSemesters = countQuery("SELECT COUNT(*) AS c FROM semesters WHERE is_active = 1");
  const totalCanonicalSubjects = countQuery("SELECT COUNT(*) AS c FROM subjects WHERE is_active = 1");
  const totalUnits = countQuery("SELECT COUNT(*) AS c FROM units WHERE is_active = 1");
  const totalTopics = countQuery("SELECT COUNT(*) AS c FROM topics WHERE is_active = 1");
  const totalStudyMaterials = countQuery("SELECT COUNT(*) AS c FROM study_materials");
  const totalPapers = countQuery("SELECT COUNT(*) AS c FROM papers");
  const availablePapers = countQuery(
    "SELECT COUNT(*) AS c FROM papers WHERE availability_status = 'available' AND published = 1 AND verified = 1"
  );
  const unavailablePaperRows = totalPapers - availablePapers;
  const unavailableSubjects = totalCanonicalSubjects - availablePapers;
  const totalPaperQuestions = countQuery("SELECT COUNT(*) AS c FROM paper_questions");
  const totalMcqs = countQuery("SELECT COUNT(*) AS c FROM questions WHERE is_active = 1");
  const totalQuizzes = countQuery("SELECT COUNT(*) AS c FROM quizzes");
  const totalQuizQuestions = countQuery("SELECT COUNT(*) AS c FROM quiz_questions");
  const totalQuarantinedRecords = countQuery("SELECT COUNT(*) AS c FROM quarantined_legacy_records");

  const semRows = db
    .prepare(
      `SELECT
         sem.number AS semester,
         sem.title AS title,
         (SELECT COUNT(*) FROM subjects s WHERE s.semester_id = sem.id AND s.is_active = 1) AS subject_count,
         (SELECT COUNT(*) FROM units u JOIN subjects s ON s.id = u.subject_id WHERE s.semester_id = sem.id AND u.is_active = 1) AS unit_count,
         (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE s.semester_id = sem.id AND t.is_active = 1) AS topic_count,
         (SELECT COUNT(*) FROM papers p WHERE p.semester_id = sem.id AND p.availability_status = 'available' AND p.published = 1 AND p.verified = 1) AS available_paper_count,
         (SELECT COUNT(*) FROM paper_questions pq JOIN papers p ON p.id = pq.paper_id WHERE p.semester_id = sem.id AND pq.subject_id = p.subject_id) AS paper_question_count,
         (SELECT COUNT(*) FROM questions q JOIN subjects s ON s.id = q.subject_id WHERE s.semester_id = sem.id AND q.is_active = 1) AS mcq_count
       FROM semesters sem
       WHERE sem.is_active = 1
       ORDER BY sem.number ASC`
    )
    .all() as Array<{
    semester: number;
    title: string;
    subject_count: number;
    unit_count: number;
    topic_count: number;
    available_paper_count: number;
    paper_question_count: number;
    mcq_count: number;
  }>;

  const semesterBreakdown = semRows.map((r) => {
    const subjCount = Number(r.subject_count);
    const availCount = Number(r.available_paper_count);
    return {
      semester: Number(r.semester),
      title: r.title,
      subjectCount: subjCount,
      unitCount: Number(r.unit_count),
      topicCount: Number(r.topic_count),
      availablePaperCount: availCount,
      unavailableSubjectCount: Math.max(0, subjCount - availCount),
      paperQuestionCount: Number(r.paper_question_count),
      mcqCount: Number(r.mcq_count),
    };
  });

  const quarantinedRows = db
    .prepare(
      `SELECT id, source_table, legacy_id, reason, quarantined_at
       FROM quarantined_legacy_records
       ORDER BY quarantined_at ASC, id ASC`
    )
    .all() as Array<{
    id: string;
    source_table: string;
    legacy_id: string;
    reason: string;
    quarantined_at: string;
  }>;

  return {
    totalSemesters,
    totalCanonicalSubjects,
    totalUnits,
    totalTopics,
    totalStudyMaterials,
    totalPapers,
    availablePapers,
    unavailablePaperRows,
    unavailableSubjects,
    totalPaperQuestions,
    totalMcqs,
    totalQuizzes,
    totalQuizQuestions,
    totalQuarantinedRecords,
    semesterBreakdown,
    quarantinedRecords: quarantinedRows.map((q) => ({
      id: q.id,
      sourceTable: q.source_table,
      legacyId: q.legacy_id,
      reason: q.reason,
      quarantinedAt: q.quarantined_at,
    })),
  };
}

/**
 * 2. ADMIN SUBJECT MANAGEMENT
 */
export function getAdminSubjects(
  db: AppDatabase,
  filters: {
    semester?: number | null;
    search?: string;
    availability?: "all" | "available" | "unavailable";
  } = {}
): AdminSubjectRecord[] {
  const params: Array<string | number> = [];
  let whereClause = "WHERE s.is_active = 1";

  if (filters.semester !== undefined && filters.semester !== null) {
    whereClause += " AND s.semester_id = ?";
    params.push(filters.semester);
  }

  if (filters.search && filters.search.trim()) {
    const q = `%${filters.search.trim().toLowerCase()}%`;
    whereClause +=
      " AND (LOWER(s.code) LIKE ? OR LOWER(s.name) LIKE ? OR LOWER(COALESCE(s.short_name, '')) LIKE ? OR LOWER(s.category) LIKE ?)";
    params.push(q, q, q, q);
  }

  const rows = db
    .prepare(
      `SELECT
         s.id,
         s.semester_id,
         s.code,
         s.name,
         s.short_name,
         s.category,
         s.credits,
         s.description,
         s.is_active,
         p.id AS paper_id,
         p.exam_year,
         p.exam_session,
         p.availability_status AS paper_availability_status,
         p.published AS paper_published,
         p.verified AS paper_verified,
         (SELECT COUNT(*) FROM units u WHERE u.subject_id = s.id AND u.is_active = 1) AS unit_count,
         (SELECT COUNT(*) FROM topics t WHERE t.subject_id = s.id AND t.is_active = 1) AS topic_count,
         (SELECT COUNT(*) FROM paper_questions pq WHERE pq.subject_id = s.id) AS paper_question_count,
         (SELECT COUNT(*) FROM questions q WHERE q.subject_id = s.id AND q.is_active = 1) AS mcq_count
       FROM subjects s
       LEFT JOIN papers p ON p.id = (
         SELECT p2.id FROM papers p2
         WHERE p2.subject_id = s.id AND p2.availability_status = 'available' AND p2.published = 1 AND p2.verified = 1
         ORDER BY p2.exam_year DESC, p2.updated_at DESC
         LIMIT 1
       )
       ${whereClause}
       ORDER BY s.semester_id ASC, s.code ASC`
    )
    .all(...params) as Array<{
    id: string;
    semester_id: number;
    code: string;
    name: string;
    short_name: string | null;
    category: string;
    credits: number;
    description: string | null;
    is_active: number;
    paper_id: string | null;
    exam_year: number | null;
    exam_session: "Summer" | "Winter" | null;
    paper_availability_status: string | null;
    paper_published: number | null;
    paper_verified: number | null;
    unit_count: number;
    topic_count: number;
    paper_question_count: number;
    mcq_count: number;
  }>;

  let mapped: AdminSubjectRecord[] = rows.map((r) => {
    const isPaperAvailable = Boolean(
      r.paper_id &&
        r.paper_availability_status === "available" &&
        r.paper_published === 1 &&
        r.paper_verified === 1
    );
    const pqCount = Number(r.paper_question_count);
    const mcqCount = Number(r.mcq_count);

    return {
      id: r.id,
      semester: Number(r.semester_id),
      code: r.code,
      name: r.name,
      shortName: r.short_name || r.name,
      category: r.category,
      credits: Number(r.credits),
      description: r.description || "",
      isActive: r.is_active === 1,
      availabilityStatus: isPaperAvailable ? "available" : "unavailable",
      paperStatus: isPaperAvailable ? "PDF Available" : "PDF not available",
      paperId: isPaperAvailable ? r.paper_id : null,
      examYear: isPaperAvailable ? r.exam_year : null,
      examSession: isPaperAvailable ? r.exam_session : null,
      unitCount: Number(r.unit_count),
      topicCount: Number(r.topic_count),
      paperQuestionCount: pqCount,
      mcqCount,
      totalQuestionCount: pqCount + mcqCount,
    };
  });

  if (filters.availability === "available") {
    mapped = mapped.filter((m) => m.availabilityStatus === "available");
  } else if (filters.availability === "unavailable") {
    mapped = mapped.filter((m) => m.availabilityStatus === "unavailable");
  }

  return mapped;
}

export function getAdminSubjectById(
  db: AppDatabase,
  idOrCode: string
): AdminSubjectDetail | null {
  const clean = (idOrCode || "").trim();
  if (!clean) return null;

  const subjectRow = db
    .prepare(
      `SELECT id, semester_id, code
       FROM subjects
       WHERE is_active = 1 AND (id = ? OR UPPER(code) = UPPER(?))
       LIMIT 1`
    )
    .get(clean, clean) as { id: string; semester_id: number; code: string } | undefined;

  if (!subjectRow) {
    return null;
  }

  const allMatching = getAdminSubjects(db, { semester: subjectRow.semester_id });
  const baseRecord = allMatching.find((s) => s.id === subjectRow.id);
  if (!baseRecord) {
    return null;
  }

  const unitRows = db
    .prepare(
      `SELECT id, subject_id, unit_number, title, weightage
       FROM units
       WHERE subject_id = ? AND is_active = 1
       ORDER BY unit_number ASC`
    )
    .all(subjectRow.id) as Array<{
    id: string;
    subject_id: string;
    unit_number: number;
    title: string;
    weightage: string | null;
  }>;

  const topicRows = db
    .prepare(
      `SELECT id, subject_id, unit_id, title, summary, important_marks_json
       FROM topics
       WHERE subject_id = ? AND is_active = 1
       ORDER BY unit_id ASC, order_index ASC`
    )
    .all(subjectRow.id) as Array<{
    id: string;
    subject_id: string;
    unit_id: string;
    title: string;
    summary: string | null;
    important_marks_json: string | null;
  }>;

  const units = unitRows.map((u) => {
    // Enforce t.unit_id === u.id && t.subject_id === subjectRow.id
    const uTopics = topicRows
      .filter((t) => t.unit_id === u.id && t.subject_id === subjectRow.id)
      .map((t) => ({
        id: t.id,
        title: t.title,
        summary: t.summary,
        importantMarks: t.important_marks_json
          ? (JSON.parse(t.important_marks_json) as number[])
          : [3, 5, 7],
      }));

    return {
      id: u.id,
      unitNumber: Number(u.unit_number),
      title: u.title,
      weightage: u.weightage,
      topicCount: uTopics.length,
      topics: uTopics,
    };
  });

  return {
    ...baseRecord,
    units,
  };
}

/**
 * 3. ADMIN PAPER MANAGEMENT
 * Returns all 35 canonical subject paper slots (9 available papers + 26 unavailable subjects)
 * without fabricating paper rows for unavailable subjects.
 */
export function getAdminPapers(
  db: AppDatabase,
  filters: {
    semester?: number | null;
    subjectCode?: string;
    subjectId?: string;
    year?: number | null;
    examSession?: string;
    availability?: "all" | "available" | "unavailable";
    search?: string;
  } = {}
): AdminPaperSlotRecord[] {
  const params: Array<string | number> = [];
  let whereClause = "WHERE s.is_active = 1";

  if (filters.semester !== undefined && filters.semester !== null) {
    whereClause += " AND s.semester_id = ?";
    params.push(filters.semester);
  }

  if (filters.subjectCode && filters.subjectCode.trim() && filters.subjectCode !== "all") {
    whereClause += " AND UPPER(s.code) = UPPER(?)";
    params.push(filters.subjectCode.trim());
  }

  if (filters.subjectId && filters.subjectId.trim() && filters.subjectId !== "all") {
    whereClause += " AND s.id = ?";
    params.push(filters.subjectId.trim());
  }

  const rows = db
    .prepare(
      `SELECT
         s.id AS subject_id,
         s.semester_id AS semester,
         s.code AS subject_code,
         s.name AS subject_name,
         s.short_name,
         s.category,
         p.id AS paper_id,
         p.exam_year,
         p.exam_session,
         p.title AS paper_title,
         p.availability_status,
         p.published,
         p.verified,
         p.total_marks,
         p.duration_minutes,
         (SELECT COUNT(*) FROM paper_questions pq WHERE pq.paper_id = p.id AND pq.subject_id = s.id) AS total_pq_count,
         (SELECT COUNT(*) FROM paper_questions pq WHERE pq.paper_id = p.id AND pq.subject_id = s.id AND pq.is_alternative = 0) AS primary_pq_count,
         (SELECT COUNT(*) FROM paper_questions pq WHERE pq.paper_id = p.id AND pq.subject_id = s.id AND pq.is_alternative = 1) AS alt_pq_count
       FROM subjects s
       LEFT JOIN papers p ON p.id = (
         SELECT p2.id FROM papers p2
         WHERE p2.subject_id = s.id
         ORDER BY
           CASE WHEN p2.availability_status = 'available' AND p2.published = 1 AND p2.verified = 1 THEN 0 ELSE 1 END ASC,
           p2.exam_year DESC,
           p2.updated_at DESC
         LIMIT 1
       )
       ${whereClause}
       ORDER BY s.semester_id ASC, s.code ASC`
    )
    .all(...params) as Array<{
    subject_id: string;
    semester: number;
    subject_code: string;
    subject_name: string;
    short_name: string | null;
    category: string;
    paper_id: string | null;
    exam_year: number | null;
    exam_session: "Summer" | "Winter" | null;
    paper_title: string | null;
    availability_status: "available" | "unavailable" | "pending_verification" | "archived" | null;
    published: number | null;
    verified: number | null;
    total_marks: number | null;
    duration_minutes: number | null;
    total_pq_count: number;
    primary_pq_count: number;
    alt_pq_count: number;
  }>;

  let records: AdminPaperSlotRecord[] = rows.map((r) => {
    const isAvailable = Boolean(
      r.paper_id &&
        r.availability_status === "available" &&
        r.published === 1 &&
        r.verified === 1
    );

    const canonicalFileName =
      isAvailable && r.exam_year && r.exam_session
        ? `GTU_BCA_Sem${r.semester}_${r.subject_code}_${r.exam_year}_${r.exam_session}.pdf`
        : null;

    return {
      paperId: isAvailable ? r.paper_id : null,
      semester: Number(r.semester),
      subjectId: r.subject_id,
      subjectCode: r.subject_code,
      subjectName: r.subject_name,
      shortName: r.short_name || r.subject_name,
      category: r.category,
      examYear: isAvailable ? r.exam_year : null,
      examSession: isAvailable ? r.exam_session : null,
      title: isAvailable ? r.paper_title : null,
      availabilityStatus: isAvailable ? "available" : "unavailable",
      pdfStatus: isAvailable ? "PDF Available" : "PDF not available",
      isAvailable,
      published: Boolean(r.published === 1),
      verified: Boolean(r.verified === 1),
      fileName: canonicalFileName,
      totalMarks: isAvailable ? Number(r.total_marks ?? 70) : null,
      durationMinutes: isAvailable ? Number(r.duration_minutes ?? 150) : null,
      questionCount: isAvailable ? Number(r.total_pq_count) : 0,
      primaryQuestionCount: isAvailable ? Number(r.primary_pq_count) : 0,
      alternativeQuestionCount: isAvailable ? Number(r.alt_pq_count) : 0,
    };
  });

  if (filters.availability === "available") {
    records = records.filter((r) => r.isAvailable);
  } else if (filters.availability === "unavailable") {
    records = records.filter((r) => !r.isAvailable);
  }

  if (filters.year !== undefined && filters.year !== null) {
    records = records.filter((r) => r.examYear === Number(filters.year));
  }

  if (
    filters.examSession &&
    filters.examSession.trim() &&
    filters.examSession !== "all"
  ) {
    const sess = filters.examSession.trim().toLowerCase();
    records = records.filter(
      (r) => r.examSession && r.examSession.toLowerCase() === sess
    );
  }

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    records = records.filter(
      (r) =>
        r.subjectCode.toLowerCase().includes(q) ||
        r.subjectName.toLowerCase().includes(q) ||
        r.shortName.toLowerCase().includes(q) ||
        (r.paperId && r.paperId.toLowerCase().includes(q)) ||
        (r.examSession && r.examSession.toLowerCase().includes(q)) ||
        (r.examYear && String(r.examYear).includes(q))
    );
  }

  return records;
}

/**
 * 4. ADMIN PAPER DETAIL & PAPER QUESTIONS INSPECTOR
 * Enforces strict verification:
 *   question.paper_id === requestedPaper.id
 *   AND
 *   question.subject_id === requestedPaper.subject_id
 */
export function getAdminPaperWithQuestions(
  db: AppDatabase,
  paperIdOrSubjectCode: string
): {
  paper: AdminPaperSlotRecord;
  questions: AdminPaperQuestionRecord[];
} | null {
  const clean = (paperIdOrSubjectCode || "").trim();
  if (!clean) return null;

  // Lookup strictly in `papers` joined with canonical `subjects`
  const paperRow = db
    .prepare(
      `SELECT
         p.id AS paper_id,
         p.semester_id AS semester,
         p.subject_id AS subject_id,
         s.code AS subject_code,
         s.name AS subject_name,
         s.short_name,
         s.category,
         p.exam_year,
         p.exam_session,
         p.title AS paper_title,
         p.availability_status,
         p.published,
         p.verified,
         p.total_marks,
         p.duration_minutes
       FROM papers p
       JOIN subjects s ON s.id = p.subject_id
       WHERE p.availability_status = 'available'
         AND p.published = 1
         AND p.verified = 1
         AND (p.id = ? OR UPPER(s.code) = UPPER(?) OR s.id = ?)
       LIMIT 1`
    )
    .get(clean, clean, clean) as
    | {
        paper_id: string;
        semester: number;
        subject_id: string;
        subject_code: string;
        subject_name: string;
        short_name: string | null;
        category: string;
        exam_year: number;
        exam_session: "Summer" | "Winter";
        paper_title: string;
        availability_status: "available";
        published: number;
        verified: number;
        total_marks: number;
        duration_minutes: number;
      }
    | undefined;

  if (!paperRow) {
    return null;
  }

  const pqRows = db
    .prepare(
      `SELECT
         pq.id,
         pq.paper_id,
         pq.subject_id,
         pq.unit_id,
         u.unit_number,
         u.title AS unit_title,
         pq.topic_id,
         t.title AS topic_title,
         pq.section_number,
         pq.section_title,
         pq.question_number,
         pq.sub_question_label,
         pq.choice_group_label,
         pq.is_alternative,
         pq.question_text,
         pq.marks,
         pq.display_order
       FROM paper_questions pq
       LEFT JOIN units u ON u.id = pq.unit_id AND u.subject_id = pq.subject_id
       LEFT JOIN topics t ON t.id = pq.topic_id AND t.subject_id = pq.subject_id
       WHERE pq.paper_id = ?
         AND pq.subject_id = ?
       ORDER BY pq.display_order ASC`
    )
    .all(paperRow.paper_id, paperRow.subject_id) as Array<{
    id: string;
    paper_id: string;
    subject_id: string;
    unit_id: string | null;
    unit_number: number | null;
    unit_title: string | null;
    topic_id: string | null;
    topic_title: string | null;
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

  // Map OR relationships within the same paper & section
  const questions: AdminPaperQuestionRecord[] = [];
  for (let i = 0; i < pqRows.length; i++) {
    const row = pqRows[i];

    // Defense-in-depth Security Rule verification:
    // question.paper_id === requestedPaper.id AND question.subject_id === requestedPaper.subject_id
    if (row.paper_id !== paperRow.paper_id || row.subject_id !== paperRow.subject_id) {
      throw new Error(
        `Security integrity violation: paper_question ${row.id} (${row.paper_id}, ${row.subject_id}) does not match requestedPaper (${paperRow.paper_id}, ${paperRow.subject_id})`
      );
    }

    let relatedQuestionId: string | null = null;
    let relatedQuestionNumber: string | null = null;

    if (row.is_alternative === 1) {
      for (let j = i - 1; j >= 0; j--) {
        const candidate = pqRows[j];
        if (candidate.section_number === row.section_number && candidate.is_alternative === 0) {
          relatedQuestionId = candidate.id;
          relatedQuestionNumber = candidate.question_number;
          break;
        }
      }
    } else if (row.is_alternative === 0) {
      for (let j = i + 1; j < pqRows.length; j++) {
        const candidate = pqRows[j];
        if (candidate.section_number === row.section_number && candidate.is_alternative === 1) {
          relatedQuestionId = candidate.id;
          relatedQuestionNumber = candidate.question_number;
          break;
        }
        if (candidate.section_number === row.section_number && candidate.is_alternative === 0) {
          break;
        }
      }
    }

    questions.push({
      id: row.id,
      paperId: row.paper_id,
      subjectId: row.subject_id,
      subjectCode: paperRow.subject_code,
      subjectName: paperRow.subject_name,
      semester: Number(paperRow.semester),
      unitId: row.unit_id,
      unitNumber: row.unit_number !== null ? Number(row.unit_number) : null,
      unitTitle: row.unit_title,
      topicId: row.topic_id,
      topicTitle: row.topic_title,
      sectionNumber: Number(row.section_number),
      sectionTitle: row.section_title,
      questionNumber: row.question_number,
      subQuestionLabel: row.sub_question_label,
      choiceGroupLabel: row.choice_group_label,
      isAlternative: row.is_alternative === 1,
      relatedQuestionId,
      relatedQuestionNumber,
      questionText: row.question_text,
      marks: Number(row.marks),
      displayOrder: Number(row.display_order),
    });
  }

  const primaryCount = questions.filter((q) => !q.isAlternative).length;
  const altCount = questions.filter((q) => q.isAlternative).length;

  const paper: AdminPaperSlotRecord = {
    paperId: paperRow.paper_id,
    semester: Number(paperRow.semester),
    subjectId: paperRow.subject_id,
    subjectCode: paperRow.subject_code,
    subjectName: paperRow.subject_name,
    shortName: paperRow.short_name || paperRow.subject_name,
    category: paperRow.category,
    examYear: Number(paperRow.exam_year),
    examSession: paperRow.exam_session,
    title: paperRow.paper_title,
    availabilityStatus: "available",
    pdfStatus: "PDF Available",
    isAvailable: true,
    published: true,
    verified: true,
    fileName: `GTU_BCA_Sem${paperRow.semester}_${paperRow.subject_code}_${paperRow.exam_year}_${paperRow.exam_session}.pdf`,
    totalMarks: Number(paperRow.total_marks),
    durationMinutes: Number(paperRow.duration_minutes),
    questionCount: questions.length,
    primaryQuestionCount: primaryCount,
    alternativeQuestionCount: altCount,
  };

  return { paper, questions };
}

/**
 * 5. ADMIN ALL PAPER QUESTIONS DIRECTORY (with strict parameter validation)
 */
export function getAdminAllPaperQuestions(
  db: AppDatabase,
  filters: {
    semester?: number | null;
    subjectCode?: string;
    subjectId?: string;
    paperId?: string;
    search?: string;
  } = {}
): AdminPaperQuestionRecord[] {
  // If paperId is specified, delegate directly to getAdminPaperWithQuestions for strict verification
  if (filters.paperId && filters.paperId.trim() && filters.paperId !== "all") {
    const res = getAdminPaperWithQuestions(db, filters.paperId.trim());
    if (!res) return [];
    let list = res.questions;
    if (filters.semester !== undefined && filters.semester !== null) {
      list = list.filter((q) => q.semester === filters.semester);
    }
    if (filters.subjectCode && filters.subjectCode.trim() && filters.subjectCode !== "all") {
      const sc = filters.subjectCode.trim().toUpperCase();
      list = list.filter((q) => q.subjectCode.toUpperCase() === sc);
    }
    if (filters.subjectId && filters.subjectId.trim() && filters.subjectId !== "all") {
      list = list.filter((q) => q.subjectId === filters.subjectId!.trim());
    }
    if (filters.search && filters.search.trim()) {
      const s = filters.search.trim().toLowerCase();
      list = list.filter(
        (q) =>
          q.questionText.toLowerCase().includes(s) ||
          q.questionNumber.toLowerCase().includes(s) ||
          q.subjectCode.toLowerCase().includes(s) ||
          q.subjectName.toLowerCase().includes(s)
      );
    }
    return list;
  }

  // Otherwise gather across all available verified papers
  const availablePapers = getAdminPapers(db, {
    semester: filters.semester,
    subjectCode: filters.subjectCode,
    subjectId: filters.subjectId,
    availability: "available",
  });

  const allQuestions: AdminPaperQuestionRecord[] = [];
  for (const p of availablePapers) {
    if (!p.paperId) continue;
    const detail = getAdminPaperWithQuestions(db, p.paperId);
    if (detail) {
      allQuestions.push(...detail.questions);
    }
  }

  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim().toLowerCase();
    return allQuestions.filter(
      (q) =>
        q.questionText.toLowerCase().includes(s) ||
        q.questionNumber.toLowerCase().includes(s) ||
        q.subjectCode.toLowerCase().includes(s) ||
        q.subjectName.toLowerCase().includes(s) ||
        q.id.toLowerCase().includes(s)
    );
  }

  return allQuestions;
}

/**
 * 6. ADMIN MCQ MANAGEMENT (Strictly from SQLite `questions` table, zero fabrication)
 */
export function getAdminMcqs(
  db: AppDatabase,
  filters: {
    semester?: number | null;
    subjectCode?: string;
    subjectId?: string;
    topicId?: string;
    topic?: string;
    language?: string;
    difficulty?: string;
    source?: string;
    questionType?: string;
    search?: string;
  } = {}
): AdminMcqRecord[] {
  const params: Array<string | number> = [];
  let whereClause = "WHERE q.is_active = 1 AND s.is_active = 1 AND q.subject_id = s.id";

  if (filters.semester !== undefined && filters.semester !== null) {
    whereClause += " AND s.semester_id = ?";
    params.push(filters.semester);
  }

  if (filters.subjectCode && filters.subjectCode.trim() && filters.subjectCode !== "all") {
    whereClause += " AND UPPER(s.code) = UPPER(?)";
    params.push(filters.subjectCode.trim());
  }

  if (filters.subjectId && filters.subjectId.trim() && filters.subjectId !== "all") {
    whereClause += " AND s.id = ?";
    params.push(filters.subjectId.trim());
  }

  if (filters.topicId && filters.topicId.trim() && filters.topicId !== "all") {
    whereClause += " AND q.topic_id = ?";
    params.push(filters.topicId.trim());
  }

  if (filters.topic && filters.topic.trim() && filters.topic !== "all") {
    const tQuery = `%${filters.topic.trim().toLowerCase()}%`;
    whereClause += " AND (LOWER(COALESCE(t.title, '')) LIKE ? OR LOWER(q.topic_id) = LOWER(?))";
    params.push(tQuery, filters.topic.trim());
  }

  if (filters.language && filters.language.trim() && filters.language !== "all") {
    whereClause += " AND q.language = ?";
    params.push(filters.language.trim().toLowerCase());
  }

  if (filters.difficulty && filters.difficulty.trim() && filters.difficulty !== "all") {
    whereClause += " AND q.difficulty = ?";
    params.push(filters.difficulty.trim().toLowerCase());
  }

  if (filters.source && filters.source.trim() && filters.source !== "all") {
    whereClause += " AND q.source = ?";
    params.push(filters.source.trim().toLowerCase());
  }

  if (filters.questionType && filters.questionType.trim() && filters.questionType !== "all") {
    const qt = filters.questionType.trim().toLowerCase();
    if (qt === "seed" || qt === "ai" || qt === "admin") {
      whereClause += " AND q.source = ?";
      params.push(qt);
    } else if (qt !== "mcq") {
      return [];
    }
  }

  if (filters.search && filters.search.trim()) {
    const sq = `%${filters.search.trim().toLowerCase()}%`;
    whereClause +=
      " AND (LOWER(q.question_text) LIKE ? OR LOWER(q.explanation) LIKE ? OR LOWER(s.code) LIKE ? OR LOWER(s.name) LIKE ? OR LOWER(COALESCE(t.title, '')) LIKE ?)";
    params.push(sq, sq, sq, sq, sq);
  }

  const rows = db
    .prepare(
      `SELECT
         q.id,
         s.semester_id AS semester,
         q.subject_id,
         s.code AS subject_code,
         s.name AS subject_name,
         q.unit_id,
         u.unit_number,
         u.title AS unit_title,
         q.topic_id,
         t.title AS topic_title,
         q.question_text,
         q.language,
         q.options_json,
         q.correct_index,
         q.explanation,
         q.difficulty,
         q.marks,
         q.source,
         q.verified,
         q.ai_generated
       FROM questions q
       JOIN subjects s ON s.id = q.subject_id
       LEFT JOIN units u ON u.id = q.unit_id AND u.subject_id = q.subject_id
       LEFT JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id
       ${whereClause}
       ORDER BY s.semester_id ASC, s.code ASC, q.language ASC, u.unit_number ASC, q.id ASC`
    )
    .all(...params) as Array<{
    id: string;
    semester: number;
    subject_id: string;
    subject_code: string;
    subject_name: string;
    unit_id: string | null;
    unit_number: number | null;
    unit_title: string | null;
    topic_id: string | null;
    topic_title: string | null;
    question_text: string;
    language: "en" | "hi";
    options_json: string;
    correct_index: number;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    marks: number;
    source: "seed" | "ai" | "admin";
    verified: number;
    ai_generated: number;
  }>;

  return rows.map((r) => {
    const options = JSON.parse(r.options_json) as string[];
    const cIdx = Number(r.correct_index);
    const letter = String.fromCharCode(65 + cIdx);
    return {
      id: r.id,
      semester: Number(r.semester),
      subjectId: r.subject_id,
      subjectCode: r.subject_code,
      subjectName: r.subject_name,
      unitId: r.unit_id,
      unitNumber: r.unit_number !== null ? Number(r.unit_number) : null,
      unitTitle: r.unit_title,
      topicId: r.topic_id,
      topicTitle: r.topic_title,
      questionText: r.question_text,
      language: r.language,
      options,
      correctIndex: cIdx,
      correctOptionLetter: letter,
      correctOptionText: options[cIdx] || "",
      explanation: r.explanation,
      difficulty: r.difficulty,
      marks: Number(r.marks),
      source: r.source,
      questionType: "MCQ",
      verified: r.verified === 1,
      aiGenerated: r.ai_generated === 1,
    };
  });
}

/**
 * 7. ADMIN AUTHENTICATION FOUNDATION (SQLite `users` + `user_sessions` + scrypt)
 */
export interface AdminAuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

export function authenticateAdminCredentials(
  db: AppDatabase,
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): { token: string; user: AdminAuthenticatedUser; expiresAt: string } | null {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !password) return null;

  const userRow = db
    .prepare(
      `SELECT id, name, email, password_hash, role, is_active
       FROM users
       WHERE LOWER(email) = LOWER(?) AND is_active = 1
       LIMIT 1`
    )
    .get(cleanEmail) as
    | {
        id: string;
        name: string;
        email: string;
        password_hash: string;
        role: "student" | "admin";
        is_active: number;
      }
    | undefined;

  if (!userRow || userRow.role !== "admin") {
    return null;
  }

  const validPassword = verifyPasswordScrypt(password, userRow.password_hash);
  if (!validPassword) {
    return null;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = computeSha256Hex(rawToken);
  const sessionId = `sess_admin_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO user_sessions (id, user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    sessionId,
    userRow.id,
    tokenHash,
    expiresAt,
    ipAddress || null,
    userAgent || null
  );

  return {
    token: rawToken,
    expiresAt,
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: "admin",
    },
  };
}

export function verifyAdminSessionToken(
  db: AppDatabase,
  rawToken: string
): AdminAuthenticatedUser | null {
  const cleanToken = (rawToken || "").trim();
  if (!cleanToken) return null;

  const tokenHash = computeSha256Hex(cleanToken);
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, s.expires_at
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND u.is_active = 1
       LIMIT 1`
    )
    .get(tokenHash) as
    | {
        id: string;
        name: string;
        email: string;
        role: "student" | "admin";
        expires_at: string;
      }
    | undefined;

  if (!row || row.role !== "admin") {
    return null;
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare("DELETE FROM user_sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: "admin",
  };
}

export function revokeAdminSessionToken(db: AppDatabase, rawToken: string): boolean {
  const cleanToken = (rawToken || "").trim();
  if (!cleanToken) return false;
  const tokenHash = computeSha256Hex(cleanToken);
  const res = db.prepare("DELETE FROM user_sessions WHERE token_hash = ?").run(tokenHash);
  return Number(res.changes) > 0;
}

/**
 * 8. CONTROLLED ADMIN MCQ CONTENT MANAGEMENT (Strict Canonical Hierarchy Validation)
 */
export interface CreateAdminMcqInput {
  subjectCodeOrId?: string;
  subjectCode?: string;
  subjectId?: string;
  unitId?: string | null;
  unitNumber?: number | null;
  topicId?: string | null;
  questionText: string;
  options: [string, string, string, string] | string[];
  correctIndex: number;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
  language?: "en" | "hi";
  marks?: number;
  createdBy?: string | null;
}

export function createAdminMcq(
  db: AppDatabase,
  input: CreateAdminMcqInput
): AdminMcqRecord {
  const cleanSubj = (input.subjectCodeOrId || input.subjectCode || input.subjectId || "").trim();
  if (!cleanSubj) {
    throw new Error("A valid canonical subjectCode or subjectId is required.");
  }

  const subjectRow = db
    .prepare(
      `SELECT id, semester_id, code, name
       FROM subjects
       WHERE is_active = 1 AND (id = ? OR UPPER(code) = UPPER(?))
       LIMIT 1`
    )
    .get(cleanSubj, cleanSubj) as
    | { id: string; semester_id: number; code: string; name: string }
    | undefined;

  if (!subjectRow) {
    throw new Error(`Canonical subject "${cleanSubj}" not found.`);
  }

  const qText = (input.questionText || "").trim();
  if (!qText || qText.length < 5) {
    throw new Error("Question text must be at least 5 characters.");
  }

  if (!Array.isArray(input.options) || input.options.length !== 4) {
    throw new Error("MCQ must provide exactly 4 distinct options.");
  }
  const cleanOptions = input.options.map((o) => String(o || "").trim());
  if (cleanOptions.some((o) => !o)) {
    throw new Error("All 4 MCQ options must be non-empty strings.");
  }

  const cIdx = Number(input.correctIndex);
  if (!Number.isInteger(cIdx) || cIdx < 0 || cIdx > 3) {
    throw new Error("correctIndex must be an integer between 0 and 3.");
  }

  const explanation = (input.explanation || "").trim();
  if (!explanation) {
    throw new Error("Explanation is required for verified academic MCQs.");
  }

  const difficulty: "easy" | "medium" | "hard" =
    input.difficulty === "easy" || input.difficulty === "hard"
      ? input.difficulty
      : "medium";
  const language: "en" | "hi" = input.language === "hi" ? "hi" : "en";
  const marks = Math.max(1, Number(input.marks) || 1);

  // Resolve unit belonging strictly to subjectRow.id
  let resolvedUnitId: string | null = null;
  if (input.unitId && input.unitId.trim()) {
    const uRow = db
      .prepare("SELECT id FROM units WHERE id = ? AND subject_id = ? AND is_active = 1 LIMIT 1")
      .get(input.unitId.trim(), subjectRow.id) as { id: string } | undefined;
    if (!uRow) {
      throw new Error(`Unit "${input.unitId}" does not belong to subject ${subjectRow.code}.`);
    }
    resolvedUnitId = uRow.id;
  } else if (input.unitNumber !== undefined && input.unitNumber !== null) {
    const uRow = db
      .prepare(
        "SELECT id FROM units WHERE subject_id = ? AND unit_number = ? AND is_active = 1 LIMIT 1"
      )
      .get(subjectRow.id, Number(input.unitNumber)) as { id: string } | undefined;
    if (!uRow) {
      throw new Error(
        `Unit number ${input.unitNumber} does not exist in subject ${subjectRow.code}.`
      );
    }
    resolvedUnitId = uRow.id;
  } else {
    const firstUnit = db
      .prepare(
        "SELECT id FROM units WHERE subject_id = ? AND is_active = 1 ORDER BY unit_number ASC LIMIT 1"
      )
      .get(subjectRow.id) as { id: string } | undefined;
    resolvedUnitId = firstUnit?.id || null;
  }

  // Resolve topic belonging strictly to subjectRow.id (and resolvedUnitId if set)
  let resolvedTopicId: string | null = null;
  if (input.topicId && input.topicId.trim()) {
    const tRow = db
      .prepare(
        `SELECT id, unit_id FROM topics
         WHERE id = ? AND subject_id = ? AND is_active = 1
         LIMIT 1`
      )
      .get(input.topicId.trim(), subjectRow.id) as
      | { id: string; unit_id: string }
      | undefined;
    if (!tRow) {
      throw new Error(`Topic "${input.topicId}" does not belong to subject ${subjectRow.code}.`);
    }
    if (resolvedUnitId && tRow.unit_id !== resolvedUnitId) {
      throw new Error(
        `Topic "${input.topicId}" belongs to unit "${tRow.unit_id}", not "${resolvedUnitId}".`
      );
    }
    resolvedUnitId = tRow.unit_id;
    resolvedTopicId = tRow.id;
  } else if (resolvedUnitId) {
    const firstTopic = db
      .prepare(
        "SELECT id FROM topics WHERE subject_id = ? AND unit_id = ? AND is_active = 1 ORDER BY order_index ASC LIMIT 1"
      )
      .get(subjectRow.id, resolvedUnitId) as { id: string } | undefined;
    resolvedTopicId = firstTopic?.id || null;
  }

  const qHash = computeQuestionHash(qText);
  const newId = `q_admin_${subjectRow.code}_${qHash.slice(0, 16)}`;

  db.prepare(
    `INSERT INTO questions (
       id, subject_id, unit_id, topic_id,
       question_text, question_hash, language, options_json,
       correct_index, explanation, difficulty, marks,
       source, ai_generated, verified, is_active, created_by, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', 0, 1, 1, ?, datetime('now'))
     ON CONFLICT(subject_id, question_hash) DO UPDATE SET
       unit_id = excluded.unit_id,
       topic_id = excluded.topic_id,
       question_text = excluded.question_text,
       language = excluded.language,
       options_json = excluded.options_json,
       correct_index = excluded.correct_index,
       explanation = excluded.explanation,
       difficulty = excluded.difficulty,
       marks = excluded.marks,
       verified = 1,
       is_active = 1,
       updated_at = datetime('now')`
  ).run(
    newId,
    subjectRow.id,
    resolvedUnitId,
    resolvedTopicId,
    qText,
    qHash,
    language,
    JSON.stringify(cleanOptions),
    cIdx,
    explanation,
    difficulty,
    marks,
    input.createdBy || null
  );

  const storedRow = db
    .prepare("SELECT id FROM questions WHERE subject_id = ? AND question_hash = ? LIMIT 1")
    .get(subjectRow.id, qHash) as { id: string };

  const matching = getAdminMcqs(db, { subjectId: subjectRow.id });
  const created = matching.find((m) => m.id === storedRow.id);
  if (!created) {
    throw new Error("Failed to load created MCQ record.");
  }
  return created;
}

export function deactivateAdminMcq(db: AppDatabase, questionId: string): boolean {
  const cleanId = (questionId || "").trim();
  if (!cleanId) return false;
  const res = db
    .prepare("UPDATE questions SET is_active = 0, updated_at = datetime('now') WHERE id = ?")
    .run(cleanId);
  return Number(res.changes) > 0;
}

// ============================================================================
// PHASE 4: FULL ADMIN CONTENT MANAGEMENT — RBAC & COMPLETE CRUD REPOSITORY
// ============================================================================

export type AdminSessionInspectionResult =
  | { status: "authorized"; user: AdminAuthenticatedUser }
  | { status: "forbidden"; user: { id: string; email: string; role: string }; error: string }
  | { status: "unauthorized"; user: null; error: string };

/**
 * Inspects a session token against SQLite `user_sessions` joined with `users`.
 * Distinguishes between:
 *  - 'authorized' (200): Valid active admin session
 *  - 'forbidden' (403): Valid active session belonging to a non-admin user (e.g., student)
 *  - 'unauthorized' (401): Missing, unknown, inactive, or expired session token
 */
export function inspectAdminSessionToken(
  db: AppDatabase,
  rawToken: string | null | undefined
): AdminSessionInspectionResult {
  const cleanToken = (rawToken || "").trim();
  if (!cleanToken) {
    return {
      status: "unauthorized",
      user: null,
      error: "Unauthorized: Missing administrator session token.",
    };
  }

  const tokenHash = computeSha256Hex(cleanToken);
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, s.expires_at
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?
       LIMIT 1`
    )
    .get(tokenHash) as
    | {
        id: string;
        name: string;
        email: string;
        role: "student" | "admin";
        is_active: number;
        expires_at: string;
      }
    | undefined;

  if (!row || row.is_active !== 1) {
    return {
      status: "unauthorized",
      user: null,
      error: "Unauthorized: Invalid administrator session token.",
    };
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare("DELETE FROM user_sessions WHERE token_hash = ?").run(tokenHash);
    return {
      status: "unauthorized",
      user: null,
      error: "Unauthorized: Administrator session token has expired.",
    };
  }

  if (row.role !== "admin") {
    return {
      status: "forbidden",
      user: { id: row.id, email: row.email, role: row.role },
      error: "Forbidden: Authenticated user does not hold administrator privileges.",
    };
  }

  return {
    status: "authorized",
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: "admin",
    },
  };
}

/**
 * Authenticates any active user (student or admin) and creates a session in `user_sessions`.
 * Useful for verifying that an authenticated student session token is rejected with 403 on `/api/admin/*`.
 */
export function authenticateAnyUserSession(
  db: AppDatabase,
  email: string,
  password: string
): {
  token: string;
  expiresAt: string;
  user: { id: string; name: string; email: string; role: "student" | "admin" };
} | null {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !password) return null;

  const userRow = db
    .prepare(
      `SELECT id, name, email, password_hash, role, is_active
       FROM users
       WHERE LOWER(email) = LOWER(?) AND is_active = 1
       LIMIT 1`
    )
    .get(cleanEmail) as
    | {
        id: string;
        name: string;
        email: string;
        password_hash: string;
        role: "student" | "admin";
        is_active: number;
      }
    | undefined;

  if (!userRow) return null;
  if (!verifyPasswordScrypt(password, userRow.password_hash)) return null;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = computeSha256Hex(rawToken);
  const sessionId = `sess_${userRow.role}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO user_sessions (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`
  ).run(sessionId, userRow.id, tokenHash, expiresAt);

  return {
    token: rawToken,
    expiresAt,
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
    },
  };
}

// ============================================================================
// 9. PAPER MANAGEMENT — FULL CRUD (CREATE, EDIT, VIEW, DELETE)
// ============================================================================

export const authenticateUserCredentials = authenticateAnyUserSession;

export interface AdminPaperQuestionInput {
  id?: string;
  sectionNumber?: number;
  sectionTitle?: string;
  questionNumber: string;
  subQuestionLabel?: string | null;
  choiceGroupLabel?: string | null;
  isAlternative?: boolean;
  relatedQuestionId?: string | null;
  questionText: string;
  marks?: number;
  unitId?: string | null;
  unitNumber?: number | null;
  topicId?: string | null;
  displayOrder?: number;
}

export interface CreateAdminPaperInput {
  paperId?: string;
  semester?: number | string | null;
  subjectCodeOrId?: string;
  subjectCode?: string;
  subjectId?: string;
  examYear: number | string;
  examSession: "Summer" | "Winter" | string;
  title?: string;
  totalMarks?: number;
  durationMinutes?: number;
  examDate?: string | null;
  examTime?: string | null;
  instructions?: string[];
  fileName?: string | null;
  fileUrl?: string | null;
  externalUrl?: string | null;
  availabilityStatus?: "available" | "unavailable" | "pending_verification" | "archived";
  published?: boolean;
  verified?: boolean;
  uploadedBy?: string | null;
  questions?: AdminPaperQuestionInput[];
}

export interface UpdateAdminPaperInput {
  semester?: number | string | null;
  subjectCodeOrId?: string;
  examYear?: number | string;
  examSession?: "Summer" | "Winter" | string;
  title?: string;
  totalMarks?: number;
  durationMinutes?: number;
  examDate?: string | null;
  examTime?: string | null;
  instructions?: string[];
  fileName?: string | null;
  fileUrl?: string | null;
  externalUrl?: string | null;
  availabilityStatus?: "available" | "unavailable" | "pending_verification" | "archived";
  published?: boolean;
  verified?: boolean;
  questions?: AdminPaperQuestionInput[];
}

export interface AdminPaperFullDetail {
  paper: AdminPaperSlotRecord & {
    examDate: string | null;
    examTime: string | null;
    fileUrl: string | null;
    externalUrl: string | null;
    instructions: string[];
  };
  questions: AdminPaperQuestionRecord[];
  sections: Array<{
    sectionNumber: number;
    sectionTitle: string;
    questions: Array<{
      primary: AdminPaperQuestionRecord;
      orAlternative: AdminPaperQuestionRecord | null;
    }>;
  }>;
}

/**
 * Loads any paper from `papers` by ID or subjectCode (including pending/archived/unavailable when allowAnyStatus = true)
 * along with its isolated `paper_questions` and grouped `sections` (Primary + OR pairs).
 */
export function getAdminPaperDetailById(
  db: AppDatabase,
  paperIdOrSubjectCode: string,
  allowAnyStatus: boolean = false
): AdminPaperFullDetail | null {
  const clean = (paperIdOrSubjectCode || "").trim();
  if (!clean) return null;

  const statusFilter = allowAnyStatus
    ? ""
    : "p.availability_status = 'available' AND p.published = 1 AND p.verified = 1 AND";

  const paperRow = db
    .prepare(
      `SELECT
         p.id AS paper_id,
         p.semester_id AS semester,
         p.subject_id AS subject_id,
         s.code AS subject_code,
         s.name AS subject_name,
         s.short_name,
         s.category,
         p.exam_year,
         p.exam_session,
         p.title AS paper_title,
         p.availability_status,
         p.published,
         p.verified,
         p.total_marks,
         p.duration_minutes,
         p.file_name,
         p.file_url,
         p.external_url,
         p.exam_date,
         p.exam_time,
         p.instructions_json
       FROM papers p
       JOIN subjects s ON s.id = p.subject_id
       WHERE ${statusFilter} (p.id = ? OR UPPER(s.code) = UPPER(?) OR s.id = ?)
       ORDER BY
         CASE WHEN p.availability_status = 'available' AND p.published = 1 AND p.verified = 1 THEN 0 ELSE 1 END ASC,
         p.exam_year DESC
       LIMIT 1`
    )
    .get(clean, clean, clean) as
    | {
        paper_id: string;
        semester: number;
        subject_id: string;
        subject_code: string;
        subject_name: string;
        short_name: string | null;
        category: string;
        exam_year: number;
        exam_session: "Summer" | "Winter";
        paper_title: string;
        availability_status: "available" | "unavailable" | "pending_verification" | "archived";
        published: number;
        verified: number;
        total_marks: number;
        duration_minutes: number;
        file_name: string | null;
        file_url: string | null;
        external_url: string | null;
        exam_date: string | null;
        exam_time: string | null;
        instructions_json: string | null;
      }
    | undefined;

  if (!paperRow) {
    return null;
  }

  const pqRows = db
    .prepare(
      `SELECT
         pq.id,
         pq.paper_id,
         pq.subject_id,
         pq.unit_id,
         u.unit_number,
         u.title AS unit_title,
         pq.topic_id,
         t.title AS topic_title,
         pq.section_number,
         pq.section_title,
         pq.question_number,
         pq.sub_question_label,
         pq.choice_group_label,
         pq.is_alternative,
         pq.question_text,
         pq.marks,
         pq.display_order
       FROM paper_questions pq
       LEFT JOIN units u ON u.id = pq.unit_id AND u.subject_id = pq.subject_id
       LEFT JOIN topics t ON t.id = pq.topic_id AND t.subject_id = pq.subject_id
       WHERE pq.paper_id = ?
         AND pq.subject_id = ?
       ORDER BY pq.display_order ASC`
    )
    .all(paperRow.paper_id, paperRow.subject_id) as Array<{
    id: string;
    paper_id: string;
    subject_id: string;
    unit_id: string | null;
    unit_number: number | null;
    unit_title: string | null;
    topic_id: string | null;
    topic_title: string | null;
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

  const questions: AdminPaperQuestionRecord[] = [];
  for (let i = 0; i < pqRows.length; i++) {
    const row = pqRows[i];
    if (row.paper_id !== paperRow.paper_id || row.subject_id !== paperRow.subject_id) {
      throw new Error(
        `Security integrity violation: paper_question ${row.id} (${row.paper_id}, ${row.subject_id}) does not match requestedPaper (${paperRow.paper_id}, ${paperRow.subject_id})`
      );
    }

    let relatedQuestionId: string | null = null;
    let relatedQuestionNumber: string | null = null;

    if (row.is_alternative === 1) {
      for (let j = i - 1; j >= 0; j--) {
        const candidate = pqRows[j];
        if (candidate.section_number === row.section_number && candidate.is_alternative === 0) {
          relatedQuestionId = candidate.id;
          relatedQuestionNumber = candidate.question_number;
          break;
        }
      }
    } else if (row.is_alternative === 0) {
      for (let j = i + 1; j < pqRows.length; j++) {
        const candidate = pqRows[j];
        if (candidate.section_number === row.section_number && candidate.is_alternative === 1) {
          relatedQuestionId = candidate.id;
          relatedQuestionNumber = candidate.question_number;
          break;
        }
        if (candidate.section_number === row.section_number && candidate.is_alternative === 0) {
          break;
        }
      }
    }

    questions.push({
      id: row.id,
      paperId: row.paper_id,
      subjectId: row.subject_id,
      subjectCode: paperRow.subject_code,
      subjectName: paperRow.subject_name,
      semester: Number(paperRow.semester),
      unitId: row.unit_id,
      unitNumber: row.unit_number !== null ? Number(row.unit_number) : null,
      unitTitle: row.unit_title,
      topicId: row.topic_id,
      topicTitle: row.topic_title,
      sectionNumber: Number(row.section_number),
      sectionTitle: row.section_title,
      questionNumber: row.question_number,
      subQuestionLabel: row.sub_question_label,
      choiceGroupLabel: row.choice_group_label,
      isAlternative: row.is_alternative === 1,
      relatedQuestionId,
      relatedQuestionNumber,
      questionText: row.question_text,
      marks: Number(row.marks),
      displayOrder: Number(row.display_order),
    });
  }

  // Group into sections with primary + OR alternative pairs
  const sectionMap = new Map<
    number,
    {
      sectionNumber: number;
      sectionTitle: string;
      questions: Array<{
        primary: AdminPaperQuestionRecord;
        orAlternative: AdminPaperQuestionRecord | null;
      }>;
    }
  >();

  for (const q of questions) {
    let sec = sectionMap.get(q.sectionNumber);
    if (!sec) {
      sec = {
        sectionNumber: q.sectionNumber,
        sectionTitle: q.sectionTitle,
        questions: [],
      };
      sectionMap.set(q.sectionNumber, sec);
    }

    if (q.isAlternative && sec.questions.length > 0) {
      const lastPair = sec.questions[sec.questions.length - 1];
      if (!lastPair.orAlternative) {
        lastPair.orAlternative = q;
      } else {
        sec.questions.push({ primary: q, orAlternative: null });
      }
    } else {
      sec.questions.push({ primary: q, orAlternative: null });
    }
  }

  const sections = Array.from(sectionMap.values()).sort(
    (a, b) => a.sectionNumber - b.sectionNumber
  );

  const isAvailable =
    paperRow.availability_status === "available" &&
    paperRow.published === 1 &&
    paperRow.verified === 1;

  const primaryCount = questions.filter((q) => !q.isAlternative).length;
  const altCount = questions.filter((q) => q.isAlternative).length;

  const instructions = paperRow.instructions_json
    ? (JSON.parse(paperRow.instructions_json) as string[])
    : ["Attempt all questions.", "Figures to the right indicate full marks."];

  return {
    paper: {
      paperId: paperRow.paper_id,
      semester: Number(paperRow.semester),
      subjectId: paperRow.subject_id,
      subjectCode: paperRow.subject_code,
      subjectName: paperRow.subject_name,
      shortName: paperRow.short_name || paperRow.subject_name,
      category: paperRow.category,
      examYear: Number(paperRow.exam_year),
      examSession: paperRow.exam_session,
      title: paperRow.paper_title,
      availabilityStatus: paperRow.availability_status,
      pdfStatus: isAvailable ? "PDF Available" : "PDF not available",
      isAvailable,
      published: paperRow.published === 1,
      verified: paperRow.verified === 1,
      fileName:
        paperRow.file_name ||
        `GTU_BCA_Sem${paperRow.semester}_${paperRow.subject_code}_${paperRow.exam_year}_${paperRow.exam_session}.pdf`,
      totalMarks: Number(paperRow.total_marks),
      durationMinutes: Number(paperRow.duration_minutes),
      questionCount: questions.length,
      primaryQuestionCount: primaryCount,
      alternativeQuestionCount: altCount,
      examDate: paperRow.exam_date,
      examTime: paperRow.exam_time,
      fileUrl: paperRow.file_url,
      externalUrl: paperRow.external_url,
      instructions,
      questions,
      sections,
    } as any,
    questions,
    sections,
  };
}

function normalizeExamSession(raw: unknown): "Summer" | "Winter" {
  const s = String(raw || "")
    .trim()
    .toLowerCase();
  if (s === "summer") return "Summer";
  if (s === "winter") return "Winter";
  throw new Error(`Invalid examSession "${String(raw)}". Must be "Summer" or "Winter".`);
}

function resolveUnitAndTopicForSubject(
  db: AppDatabase,
  subjectId: string,
  subjectCode: string,
  unitId?: string | null,
  unitNumber?: number | null,
  topicId?: string | null,
  defaultToFirst: boolean = false
): { unitId: string | null; topicId: string | null } {
  let resolvedUnitId: string | null = null;
  if (unitId && unitId.trim()) {
    const uRow = db
      .prepare("SELECT id FROM units WHERE id = ? AND subject_id = ? AND is_active = 1 LIMIT 1")
      .get(unitId.trim(), subjectId) as { id: string } | undefined;
    if (!uRow) {
      throw new Error(
        `Hierarchy violation: Unit "${unitId}" does not belong to subject ${subjectCode} (${subjectId}).`
      );
    }
    resolvedUnitId = uRow.id;
  } else if (unitNumber !== undefined && unitNumber !== null && String(unitNumber) !== "") {
    const uRow = db
      .prepare(
        "SELECT id FROM units WHERE subject_id = ? AND unit_number = ? AND is_active = 1 LIMIT 1"
      )
      .get(subjectId, Number(unitNumber)) as { id: string } | undefined;
    if (!uRow) {
      throw new Error(
        `Hierarchy violation: Unit number ${unitNumber} does not exist in subject ${subjectCode}.`
      );
    }
    resolvedUnitId = uRow.id;
  } else if (defaultToFirst) {
    const firstUnit = db
      .prepare(
        "SELECT id FROM units WHERE subject_id = ? AND is_active = 1 ORDER BY unit_number ASC LIMIT 1"
      )
      .get(subjectId) as { id: string } | undefined;
    resolvedUnitId = firstUnit?.id || null;
  }

  let resolvedTopicId: string | null = null;
  if (topicId && topicId.trim()) {
    const tRow = db
      .prepare(
        "SELECT id, unit_id FROM topics WHERE id = ? AND subject_id = ? AND is_active = 1 LIMIT 1"
      )
      .get(topicId.trim(), subjectId) as { id: string; unit_id: string } | undefined;
    if (!tRow) {
      throw new Error(
        `Hierarchy violation: Topic "${topicId}" does not belong to subject ${subjectCode} (${subjectId}).`
      );
    }
    if (resolvedUnitId && tRow.unit_id !== resolvedUnitId) {
      throw new Error(
        `Hierarchy violation: Topic "${topicId}" belongs to unit "${tRow.unit_id}", not "${resolvedUnitId}".`
      );
    }
    resolvedUnitId = tRow.unit_id;
    resolvedTopicId = tRow.id;
  } else if (defaultToFirst && resolvedUnitId) {
    const firstTopic = db
      .prepare(
        "SELECT id FROM topics WHERE subject_id = ? AND unit_id = ? AND is_active = 1 ORDER BY order_index ASC LIMIT 1"
      )
      .get(subjectId, resolvedUnitId) as { id: string } | undefined;
    resolvedTopicId = firstTopic?.id || null;
  }

  return { unitId: resolvedUnitId, topicId: resolvedTopicId };
}

/**
 * CREATE PAPER: Creates a canonical GTU paper and optional initial paper questions transactionally.
 */
export function createAdminPaper(
  db: AppDatabase,
  input: CreateAdminPaperInput
): AdminPaperFullDetail {
  const cleanSubj = (input.subjectCodeOrId || input.subjectCode || input.subjectId || "").trim();
  if (!cleanSubj) {
    throw new Error("A valid canonical subjectCode or subjectId is required to create a paper.");
  }

  const subjectRow = db
    .prepare(
      `SELECT id, semester_id, code, name, short_name
       FROM subjects
       WHERE is_active = 1 AND (id = ? OR UPPER(code) = UPPER(?))
       LIMIT 1`
    )
    .get(cleanSubj, cleanSubj) as
    | { id: string; semester_id: number; code: string; name: string; short_name: string | null }
    | undefined;

  if (!subjectRow) {
    throw new Error(`Canonical GTU BCA subject "${cleanSubj}" not found.`);
  }

  if (input.semester !== undefined && input.semester !== null && input.semester !== "") {
    const semNum = parseValidSemester(input.semester);
    if (semNum !== null && semNum !== Number(subjectRow.semester_id)) {
      throw new Error(
        `Semester mismatch: Canonical subject ${subjectRow.code} belongs to Semester ${subjectRow.semester_id}, not Semester ${semNum}.`
      );
    }
  }

  const examYear = Number(input.examYear);
  if (!Number.isInteger(examYear) || examYear < 2015 || examYear > 2035) {
    throw new Error(`Invalid examYear "${String(input.examYear)}". Must be between 2015 and 2035.`);
  }

  const examSession = normalizeExamSession(input.examSession);

  // Check for duplicate paper on (subject_id, exam_year, exam_session)
  const existingForSlot = db
    .prepare(
      `SELECT id, availability_status
       FROM papers
       WHERE subject_id = ? AND exam_year = ? AND exam_session = ?
       LIMIT 1`
    )
    .get(subjectRow.id, examYear, examSession) as
    | { id: string; availability_status: string }
    | undefined;

  if (existingForSlot) {
    throw new Error(
      `Duplicate paper: Paper "${existingForSlot.id}" already exists for subject ${subjectRow.code} (${examSession} ${examYear}).`
    );
  }

  const paperId =
    input.paperId && input.paperId.trim()
      ? input.paperId.trim()
      : `gtu-paper-sem${subjectRow.semester_id}-${subjectRow.code.toLowerCase()}-${examYear}-${examSession.toLowerCase()}`;

  const existingById = db
    .prepare("SELECT id FROM papers WHERE id = ? LIMIT 1")
    .get(paperId) as { id: string } | undefined;
  if (existingById) {
    throw new Error(`Duplicate paper ID: A paper with id "${paperId}" already exists.`);
  }

  const totalMarks = Math.max(1, Number(input.totalMarks) || 70);
  const durationMinutes = Math.max(1, Number(input.durationMinutes) || 150);
  const title =
    input.title && input.title.trim()
      ? input.title.trim()
      : `${subjectRow.name} (${examSession} ${examYear})`;

  const availabilityStatus: "available" | "unavailable" | "pending_verification" | "archived" =
    input.availabilityStatus === "unavailable" ||
    input.availabilityStatus === "pending_verification" ||
    input.availabilityStatus === "archived"
      ? input.availabilityStatus
      : "available";

  const canonicalFileName =
    input.fileName && input.fileName.trim()
      ? input.fileName.trim()
      : `GTU_BCA_Sem${subjectRow.semester_id}_${subjectRow.code}_${examYear}_${examSession}.pdf`;

  let published = 1;
  let verified = 1;
  let fileUrl: string | null =
    input.fileUrl && input.fileUrl.trim() ? input.fileUrl.trim() : null;
  const externalUrl: string | null =
    input.externalUrl && input.externalUrl.trim() ? input.externalUrl.trim() : null;
  let sourceType: "local" | "remote" | "generated_structured" | "none" = "generated_structured";

  if (availabilityStatus === "available") {
    published = 1;
    verified = 1;
    if (!fileUrl && !externalUrl) {
      fileUrl = `/papers/${canonicalFileName}`;
    }
    sourceType = externalUrl ? "remote" : "generated_structured";
  } else {
    published = 0;
    verified = input.verified ? 1 : 0;
    if (published === 1 && verified === 1) {
      published = 0;
    }
    sourceType = fileUrl || externalUrl ? "generated_structured" : "none";
  }

  const instructions =
    Array.isArray(input.instructions) && input.instructions.length > 0
      ? input.instructions.map((s) => String(s || "").trim()).filter(Boolean)
      : ["Attempt all questions.", "Figures to the right indicate full marks."];

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO papers (
         id, semester_id, subject_id, subject_code_snapshot, subject_name_snapshot,
         exam_year, exam_session, title, availability_status, source_type,
         file_url, external_url, file_name, total_pages, total_marks, duration_minutes,
         instructions_json, exam_date, exam_time, published, verified, uploaded_by,
         created_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 2, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      paperId,
      subjectRow.semester_id,
      subjectRow.id,
      subjectRow.code,
      subjectRow.name,
      examYear,
      examSession,
      title,
      availabilityStatus,
      sourceType,
      fileUrl,
      externalUrl,
      canonicalFileName,
      totalMarks,
      durationMinutes,
      JSON.stringify(instructions),
      input.examDate || `${examSession} ${examYear}`,
      input.examTime || "10:30 AM to 01:00 PM",
      published,
      verified,
      input.uploadedBy || null
    );

    if (Array.isArray(input.questions) && input.questions.length > 0) {
      for (let i = 0; i < input.questions.length; i++) {
        const q = input.questions[i];
        createAdminPaperQuestion(db, {
          paperId,
          subjectCodeOrId: subjectRow.id,
          sectionNumber: q.sectionNumber ?? 1,
          sectionTitle: q.sectionTitle || `Q.${q.sectionNumber ?? 1}`,
          questionNumber: q.questionNumber || `Q.${q.sectionNumber ?? 1}(${i + 1})`,
          subQuestionLabel: q.subQuestionLabel ?? null,
          choiceGroupLabel: q.choiceGroupLabel ?? null,
          isAlternative: Boolean(q.isAlternative),
          questionText: q.questionText,
          marks: q.marks ?? 7,
          unitId: q.unitId,
          unitNumber: q.unitNumber,
          topicId: q.topicId,
          displayOrder: q.displayOrder ?? i + 1,
        });
      }
    }
  });

  tx();

  const detail = getAdminPaperDetailById(db, paperId, true);
  if (!detail) {
    throw new Error(`Failed to load newly created paper "${paperId}".`);
  }
  return detail;
}

/**
 * EDIT PAPER: Updates allowed metadata and optional questions list while strictly preserving
 * paper identity (`id`) and canonical subject relationship (`subject_id`, `semester_id`).
 */
export function updateAdminPaper(
  db: AppDatabase,
  paperId: string,
  input: UpdateAdminPaperInput
): AdminPaperFullDetail {
  const cleanId = (paperId || "").trim();
  if (!cleanId) {
    throw new Error("Paper ID is required.");
  }

  const existing = db
    .prepare(
      `SELECT p.*, s.code AS canonical_code, s.name AS canonical_name
       FROM papers p
       JOIN subjects s ON s.id = p.subject_id
       WHERE p.id = ?
       LIMIT 1`
    )
    .get(cleanId) as any;

  if (!existing) {
    throw new Error(`Paper "${cleanId}" not found.`);
  }

  // Enforce immutable subject & semester relationship
  if (input.subjectCodeOrId !== undefined && String(input.subjectCodeOrId).trim() !== "") {
    const reqSubj = String(input.subjectCodeOrId).trim();
    if (
      reqSubj !== existing.subject_id &&
      reqSubj.toUpperCase() !== String(existing.canonical_code).toUpperCase()
    ) {
      throw new Error(
        `Immutable paper hierarchy violation: Paper "${cleanId}" belongs to subject ${existing.canonical_code} (${existing.subject_id}) and cannot be reassigned to "${reqSubj}".`
      );
    }
  }

  if (input.semester !== undefined && input.semester !== null && input.semester !== "") {
    const semNum = parseValidSemester(input.semester);
    if (semNum !== null && semNum !== Number(existing.semester_id)) {
      throw new Error(
        `Immutable paper hierarchy violation: Paper "${cleanId}" belongs to Semester ${existing.semester_id} and cannot be moved to Semester ${semNum}.`
      );
    }
  }

  const examYear =
    input.examYear !== undefined && input.examYear !== null && String(input.examYear) !== ""
      ? Number(input.examYear)
      : Number(existing.exam_year);
  if (!Number.isInteger(examYear) || examYear < 2015 || examYear > 2035) {
    throw new Error(`Invalid examYear "${String(input.examYear)}". Must be between 2015 and 2035.`);
  }

  const examSession =
    input.examSession !== undefined && String(input.examSession).trim() !== ""
      ? normalizeExamSession(input.examSession)
      : (existing.exam_session as "Summer" | "Winter");

  // Check duplicate slot if year or session changed
  const slotConflict = db
    .prepare(
      `SELECT id FROM papers
       WHERE subject_id = ? AND exam_year = ? AND exam_session = ? AND id != ?
       LIMIT 1`
    )
    .get(existing.subject_id, examYear, examSession, cleanId) as { id: string } | undefined;
  if (slotConflict) {
    throw new Error(
      `Duplicate paper slot: Another paper ("${slotConflict.id}") already exists for ${existing.canonical_code} (${examSession} ${examYear}).`
    );
  }

  const title =
    input.title !== undefined && input.title.trim() ? input.title.trim() : existing.title;
  const totalMarks =
    input.totalMarks !== undefined
      ? Math.max(1, Number(input.totalMarks) || 70)
      : Number(existing.total_marks);
  const durationMinutes =
    input.durationMinutes !== undefined
      ? Math.max(1, Number(input.durationMinutes) || 150)
      : Number(existing.duration_minutes);

  let availabilityStatus: "available" | "unavailable" | "pending_verification" | "archived" =
    input.availabilityStatus || existing.availability_status;

  if (input.published === false && availabilityStatus === "available") {
    availabilityStatus = "unavailable";
  } else if (
    input.published === true &&
    input.verified !== false &&
    availabilityStatus !== "available"
  ) {
    availabilityStatus = "available";
  }

  const canonicalFileName =
    input.fileName && input.fileName.trim()
      ? input.fileName.trim()
      : existing.file_name ||
        `GTU_BCA_Sem${existing.semester_id}_${existing.canonical_code}_${examYear}_${examSession}.pdf`;

  let fileUrl: string | null =
    input.fileUrl !== undefined ? input.fileUrl : existing.file_url;
  const externalUrl: string | null =
    input.externalUrl !== undefined ? input.externalUrl : existing.external_url;

  let published = existing.published;
  let verified = existing.verified;
  let sourceType = existing.source_type || "generated_structured";

  if (availabilityStatus === "available") {
    published = 1;
    verified = 1;
    if (!fileUrl && !externalUrl) {
      fileUrl = `/papers/${canonicalFileName}`;
    }
    if (sourceType === "none") {
      sourceType = "generated_structured";
    }
  } else {
    published = 0;
    verified = input.verified !== undefined ? (input.verified ? 1 : 0) : 0;
  }

  const instructionsJson =
    Array.isArray(input.instructions) && input.instructions.length > 0
      ? JSON.stringify(input.instructions.map((s) => String(s || "").trim()).filter(Boolean))
      : existing.instructions_json;

  const examDate = input.examDate !== undefined ? input.examDate : existing.exam_date;
  const examTime = input.examTime !== undefined ? input.examTime : existing.exam_time;

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE papers
       SET exam_year = ?,
           exam_session = ?,
           title = ?,
           availability_status = ?,
           source_type = ?,
           file_name = ?,
           file_url = ?,
           external_url = ?,
           total_marks = ?,
           duration_minutes = ?,
           instructions_json = ?,
           exam_date = ?,
           exam_time = ?,
           published = ?,
           verified = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      examYear,
      examSession,
      title,
      availabilityStatus,
      sourceType,
      canonicalFileName,
      fileUrl,
      externalUrl,
      totalMarks,
      durationMinutes,
      instructionsJson,
      examDate,
      examTime,
      published,
      verified,
      cleanId
    );

    if (Array.isArray(input.questions)) {
      db.prepare("DELETE FROM paper_questions WHERE paper_id = ?").run(cleanId);
      for (let i = 0; i < input.questions.length; i++) {
        const q = input.questions[i];
        createAdminPaperQuestion(db, {
          paperId: cleanId,
          subjectCodeOrId: existing.subject_id,
          sectionNumber: q.sectionNumber ?? 1,
          sectionTitle: q.sectionTitle || `Q.${q.sectionNumber ?? 1}`,
          questionNumber: q.questionNumber || `Q.${q.sectionNumber ?? 1}(${i + 1})`,
          subQuestionLabel: q.subQuestionLabel ?? null,
          choiceGroupLabel: q.choiceGroupLabel ?? null,
          isAlternative: Boolean(q.isAlternative),
          questionText: q.questionText,
          marks: q.marks ?? 7,
          unitId: q.unitId,
          unitNumber: q.unitNumber,
          topicId: q.topicId,
          displayOrder: q.displayOrder ?? i + 1,
        });
      }
    }
  });

  tx();

  const updated = getAdminPaperDetailById(db, cleanId, true);
  if (!updated) {
    throw new Error(`Failed to reload updated paper "${cleanId}".`);
  }
  return updated;
}

/**
 * ARCHIVE / DEACTIVATE PAPER: Marks a paper as archived/unpublished so it is excluded from Student Portal.
 */
export function archiveAdminPaper(db: AppDatabase, paperId: string): AdminPaperFullDetail {
  return updateAdminPaper(db, paperId, {
    availabilityStatus: "archived",
    published: false,
    verified: false,
  });
}

/**
 * DELETE PAPER: Deletes or archives a paper and its associated `paper_questions`.
 */
export function deleteAdminPaper(
  db: AppDatabase,
  paperId: string,
  options?: { mode?: "archive" | "delete" }
): boolean {
  const cleanId = (paperId || "").trim();
  if (!cleanId) return false;
  if (options?.mode === "archive") {
    archiveAdminPaper(db, cleanId);
    return true;
  }
  const res = db.prepare("DELETE FROM papers WHERE id = ?").run(cleanId);
  return Number(res.changes) > 0;
}

// ============================================================================
// 10. PAPER QUESTION MANAGEMENT — FULL CRUD (`paper_questions`)
// ============================================================================

export interface CreateAdminPaperQuestionInput {
  id?: string;
  paperId: string;
  subjectCodeOrId?: string;
  unitId?: string | null;
  unitNumber?: number | null;
  topicId?: string | null;
  sectionNumber?: number;
  sectionTitle?: string;
  questionNumber: string;
  subQuestionLabel?: string | null;
  choiceGroupLabel?: string | null;
  isAlternative?: boolean;
  relatedQuestionId?: string | null;
  questionText: string;
  marks?: number;
  displayOrder?: number;
}

export interface UpdateAdminPaperQuestionInput {
  paperId?: string;
  subjectCodeOrId?: string;
  unitId?: string | null;
  unitNumber?: number | null;
  topicId?: string | null;
  sectionNumber?: number;
  sectionTitle?: string;
  questionNumber?: string;
  subQuestionLabel?: string | null;
  choiceGroupLabel?: string | null;
  isAlternative?: boolean;
  relatedQuestionId?: string | null;
  questionText?: string;
  marks?: number;
  displayOrder?: number;
}

export function getAdminPaperQuestionById(
  db: AppDatabase,
  questionId: string
): AdminPaperQuestionRecord | null {
  const cleanId = (questionId || "").trim();
  if (!cleanId) return null;

  const row = db
    .prepare("SELECT paper_id FROM paper_questions WHERE id = ? LIMIT 1")
    .get(cleanId) as { paper_id: string } | undefined;
  if (!row) return null;

  const detail = getAdminPaperDetailById(db, row.paper_id, true);
  if (!detail) return null;
  return detail.questions.find((q) => q.id === cleanId) || null;
}

export function createAdminPaperQuestion(
  db: AppDatabase,
  input: CreateAdminPaperQuestionInput
): AdminPaperQuestionRecord {
  const cleanPaperId = (input.paperId || "").trim();
  if (!cleanPaperId) {
    throw new Error("paperId is required to create a paper question.");
  }

  const paperRow = db
    .prepare(
      `SELECT p.id, p.subject_id, p.semester_id, s.code AS subject_code, s.name AS subject_name
       FROM papers p
       JOIN subjects s ON s.id = p.subject_id
       WHERE p.id = ?
       LIMIT 1`
    )
    .get(cleanPaperId) as
    | {
        id: string;
        subject_id: string;
        semester_id: number;
        subject_code: string;
        subject_name: string;
      }
    | undefined;

  if (!paperRow) {
    throw new Error(`Target paper "${cleanPaperId}" not found.`);
  }

  // Enforce strict subject isolation: if caller passed subjectCodeOrId, it MUST match paperRow.subject_id
  if (input.subjectCodeOrId && input.subjectCodeOrId.trim()) {
    const reqSubj = input.subjectCodeOrId.trim();
    if (
      reqSubj !== paperRow.subject_id &&
      reqSubj.toUpperCase() !== paperRow.subject_code.toUpperCase()
    ) {
      throw new Error(
        `Subject isolation violation: Paper "${paperRow.id}" belongs to ${paperRow.subject_code} (${paperRow.subject_id}), not "${reqSubj}".`
      );
    }
  }

  const qText = (input.questionText || "").trim();
  if (!qText || qText.length < 5) {
    throw new Error("Paper question text must be at least 5 characters.");
  }

  const sectionNumber = Math.max(1, Math.floor(Number(input.sectionNumber) || 1));
  const sectionTitle =
    input.sectionTitle && input.sectionTitle.trim()
      ? input.sectionTitle.trim()
      : `Q.${sectionNumber}`;
  const questionNumber =
    input.questionNumber && input.questionNumber.trim()
      ? input.questionNumber.trim()
      : `Q.${sectionNumber}`;

  const marks = Math.max(1, Math.floor(Number(input.marks) || 7));
  const isAlternative = input.isAlternative ? 1 : 0;

  // Validate OR-question relationship if relatedQuestionId is supplied
  if (input.relatedQuestionId && input.relatedQuestionId.trim()) {
    if (isAlternative !== 1) {
      throw new Error(
        "OR-question validation error: relatedQuestionId can only be set when isAlternative is true."
      );
    }
    const relRow = db
      .prepare(
        "SELECT id, paper_id, subject_id, section_number, is_alternative FROM paper_questions WHERE id = ? LIMIT 1"
      )
      .get(input.relatedQuestionId.trim()) as
      | {
          id: string;
          paper_id: string;
          subject_id: string;
          section_number: number;
          is_alternative: number;
        }
      | undefined;

    if (!relRow) {
      throw new Error(`OR-question validation error: Related question "${input.relatedQuestionId}" not found.`);
    }
    if (relRow.paper_id !== paperRow.id) {
      throw new Error(
        `Cross-paper isolation violation: Related question "${relRow.id}" belongs to paper "${relRow.paper_id}", not "${paperRow.id}".`
      );
    }
    if (relRow.subject_id !== paperRow.subject_id) {
      throw new Error(
        `Cross-subject isolation violation: Related question "${relRow.id}" belongs to subject "${relRow.subject_id}", not "${paperRow.subject_id}".`
      );
    }
    if (Number(relRow.section_number) !== sectionNumber) {
      throw new Error(
        `OR-question section mismatch: Related question "${relRow.id}" is in Section ${relRow.section_number}, but this OR question is in Section ${sectionNumber}.`
      );
    }
    if (Number(relRow.is_alternative) === 1) {
      throw new Error(
        `OR-question validation error: Related question "${relRow.id}" is already an alternative question.`
      );
    }
  } else if (isAlternative === 1) {
    // Ensure at least one primary question exists in the same section of this paper
    const primaryInSec = db
      .prepare(
        "SELECT id FROM paper_questions WHERE paper_id = ? AND section_number = ? AND is_alternative = 0 LIMIT 1"
      )
      .get(paperRow.id, sectionNumber) as { id: string } | undefined;
    if (!primaryInSec) {
      throw new Error(
        `OR-question validation error: Cannot add an alternative (OR) question to Section ${sectionNumber} before adding a primary question in Section ${sectionNumber}.`
      );
    }
  }

  const { unitId: resolvedUnitId, topicId: resolvedTopicId } = resolveUnitAndTopicForSubject(
    db,
    paperRow.subject_id,
    paperRow.subject_code,
    input.unitId,
    input.unitNumber,
    input.topicId,
    false
  );

  // Determine unique display_order within paper_id
  const maxOrderRow = db
    .prepare(
      "SELECT COALESCE(MAX(display_order), 0) AS max_order FROM paper_questions WHERE paper_id = ?"
    )
    .get(paperRow.id) as { max_order: number };

  let displayOrder = Number(maxOrderRow.max_order) + 1;
  if (input.displayOrder !== undefined && input.displayOrder !== null) {
    const requestedOrder = Math.max(1, Math.floor(Number(input.displayOrder)));
    const collision = db
      .prepare("SELECT id FROM paper_questions WHERE paper_id = ? AND display_order = ? LIMIT 1")
      .get(paperRow.id, requestedOrder) as { id: string } | undefined;
    if (!collision) {
      displayOrder = requestedOrder;
    }
  }

  const qHash = computeQuestionHash(`${paperRow.id}:${questionNumber}:${isAlternative}:${qText}`);
  const questionId =
    input.id && input.id.trim()
      ? input.id.trim()
      : `pq_${paperRow.id}_${displayOrder}_${qHash.slice(0, 8)}`;

  const choiceGroupLabel =
    input.choiceGroupLabel !== undefined
      ? input.choiceGroupLabel
      : isAlternative === 1
      ? `Q${sectionNumber}_OR`
      : null;

  db.prepare(
    `INSERT INTO paper_questions (
       id, paper_id, subject_id, unit_id, topic_id,
       section_number, section_title, question_number, sub_question_label,
       choice_group_label, is_alternative, question_text, marks,
       frequency_count, display_order, created_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))`
  ).run(
    questionId,
    paperRow.id,
    paperRow.subject_id,
    resolvedUnitId,
    resolvedTopicId,
    sectionNumber,
    sectionTitle,
    questionNumber,
    input.subQuestionLabel || null,
    choiceGroupLabel,
    isAlternative,
    qText,
    marks,
    displayOrder
  );

  const created = getAdminPaperQuestionById(db, questionId);
  if (!created) {
    throw new Error("Failed to load created paper question.");
  }
  return created;
}

export function updateAdminPaperQuestion(
  db: AppDatabase,
  questionId: string,
  input: UpdateAdminPaperQuestionInput
): AdminPaperQuestionRecord {
  const cleanId = (questionId || "").trim();
  if (!cleanId) {
    throw new Error("Paper question ID is required.");
  }

  const existing = db
    .prepare(
      `SELECT pq.*, s.code AS subject_code
       FROM paper_questions pq
       JOIN subjects s ON s.id = pq.subject_id
       WHERE pq.id = ?
       LIMIT 1`
    )
    .get(cleanId) as any;

  if (!existing) {
    throw new Error(`Paper question "${cleanId}" not found.`);
  }

  if (input.paperId && input.paperId.trim() && input.paperId.trim() !== existing.paper_id) {
    throw new Error(
      `Immutable hierarchy violation: Paper question "${cleanId}" belongs to paper "${existing.paper_id}", not "${input.paperId}".`
    );
  }

  if (input.subjectCodeOrId && input.subjectCodeOrId.trim()) {
    const reqSubj = input.subjectCodeOrId.trim();
    if (
      reqSubj !== existing.subject_id &&
      reqSubj.toUpperCase() !== String(existing.subject_code).toUpperCase()
    ) {
      throw new Error(
        `Immutable hierarchy violation: Paper question "${cleanId}" belongs to subject ${existing.subject_code} (${existing.subject_id}) and cannot be moved to "${reqSubj}".`
      );
    }
  }

  const qText =
    input.questionText !== undefined ? input.questionText.trim() : existing.question_text;
  if (!qText || qText.length < 5) {
    throw new Error("Paper question text must be at least 5 characters.");
  }

  const sectionNumber =
    input.sectionNumber !== undefined
      ? Math.max(1, Math.floor(Number(input.sectionNumber)))
      : Number(existing.section_number);
  const sectionTitle =
    input.sectionTitle !== undefined && input.sectionTitle.trim()
      ? input.sectionTitle.trim()
      : existing.section_title;
  const questionNumber =
    input.questionNumber !== undefined && input.questionNumber.trim()
      ? input.questionNumber.trim()
      : existing.question_number;
  const marks =
    input.marks !== undefined
      ? Math.max(1, Math.floor(Number(input.marks)))
      : Number(existing.marks);
  const isAlternative =
    input.isAlternative !== undefined
      ? input.isAlternative
        ? 1
        : 0
      : Number(existing.is_alternative);

  let resolvedUnitId: string | null = existing.unit_id;
  let resolvedTopicId: string | null = existing.topic_id;
  if (
    input.unitId !== undefined ||
    input.unitNumber !== undefined ||
    input.topicId !== undefined
  ) {
    const resolved = resolveUnitAndTopicForSubject(
      db,
      existing.subject_id,
      existing.subject_code,
      input.unitId !== undefined ? input.unitId : existing.unit_id,
      input.unitNumber,
      input.topicId !== undefined ? input.topicId : existing.topic_id,
      false
    );
    resolvedUnitId = resolved.unitId;
    resolvedTopicId = resolved.topicId;
  }

  let displayOrder = Number(existing.display_order);
  if (input.displayOrder !== undefined && input.displayOrder !== null) {
    const reqOrder = Math.max(1, Math.floor(Number(input.displayOrder)));
    const collision = db
      .prepare(
        "SELECT id FROM paper_questions WHERE paper_id = ? AND display_order = ? AND id != ? LIMIT 1"
      )
      .get(existing.paper_id, reqOrder, cleanId) as { id: string } | undefined;
    if (!collision) {
      displayOrder = reqOrder;
    }
  }

  const subQuestionLabel =
    input.subQuestionLabel !== undefined ? input.subQuestionLabel : existing.sub_question_label;
  const choiceGroupLabel =
    input.choiceGroupLabel !== undefined ? input.choiceGroupLabel : existing.choice_group_label;

  db.prepare(
    `UPDATE paper_questions
     SET unit_id = ?,
         topic_id = ?,
         section_number = ?,
         section_title = ?,
         question_number = ?,
         sub_question_label = ?,
         choice_group_label = ?,
         is_alternative = ?,
         question_text = ?,
         marks = ?,
         display_order = ?
     WHERE id = ?`
  ).run(
    resolvedUnitId,
    resolvedTopicId,
    sectionNumber,
    sectionTitle,
    questionNumber,
    subQuestionLabel,
    choiceGroupLabel,
    isAlternative,
    qText,
    marks,
    displayOrder,
    cleanId
  );

  const updated = getAdminPaperQuestionById(db, cleanId);
  if (!updated) {
    throw new Error("Failed to reload updated paper question.");
  }
  return updated;
}

export function deleteAdminPaperQuestion(
  db: AppDatabase,
  questionId: string,
  expectedPaperId?: string
): boolean {
  const cleanId = (questionId || "").trim();
  if (!cleanId) return false;

  if (expectedPaperId && expectedPaperId.trim()) {
    const row = db
      .prepare("SELECT paper_id FROM paper_questions WHERE id = ? LIMIT 1")
      .get(cleanId) as { paper_id: string } | undefined;
    if (!row) return false;
    if (row.paper_id !== expectedPaperId.trim()) {
      throw new Error(
        `Paper question "${cleanId}" belongs to paper "${row.paper_id}", not "${expectedPaperId}".`
      );
    }
  }

  const res = db.prepare("DELETE FROM paper_questions WHERE id = ?").run(cleanId);
  return Number(res.changes) > 0;
}

/**
 * REORDER PAPER QUESTIONS: Transactionally updates display_order of all questions in a paper.
 * Strict cross-paper isolation: rejects any questionId that does not belong to `paperId`.
 */
export function reorderAdminPaperQuestions(
  db: AppDatabase,
  paperId: string,
  orderedQuestionIds: string[]
): AdminPaperFullDetail {
  const cleanPaperId = (paperId || "").trim();
  if (!cleanPaperId) {
    throw new Error("paperId is required to reorder paper questions.");
  }
  if (!Array.isArray(orderedQuestionIds) || orderedQuestionIds.length === 0) {
    throw new Error("orderedQuestionIds must be a non-empty array.");
  }

  const existingRows = db
    .prepare("SELECT id, paper_id, subject_id FROM paper_questions WHERE paper_id = ? ORDER BY display_order ASC")
    .all(cleanPaperId) as Array<{ id: string; paper_id: string; subject_id: string }>;

  if (existingRows.length === 0) {
    throw new Error(`No paper questions found for paper "${cleanPaperId}".`);
  }

  const validIds = new Set(existingRows.map((r) => r.id));
  for (const qId of orderedQuestionIds) {
    if (!validIds.has(qId)) {
      throw new Error(
        `Cross-paper isolation violation: Question "${qId}" does not belong to paper "${cleanPaperId}".`
      );
    }
  }

  // Append any remaining questions from the same paper not explicitly listed
  const finalOrder: string[] = [...orderedQuestionIds];
  for (const r of existingRows) {
    if (!finalOrder.includes(r.id)) {
      finalOrder.push(r.id);
    }
  }

  const tx = db.transaction(() => {
    // First shift to high positive temporary orders to avoid UNIQUE(paper_id, display_order) collisions while respecting CHECK(display_order >= 1)
    const tempStmt = db.prepare("UPDATE paper_questions SET display_order = ? WHERE id = ? AND paper_id = ?");
    for (let i = 0; i < finalOrder.length; i++) {
      tempStmt.run(100000 + i + 1, finalOrder[i], cleanPaperId);
    }
    for (let i = 0; i < finalOrder.length; i++) {
      tempStmt.run(i + 1, finalOrder[i], cleanPaperId);
    }
  });

  tx();

  const detail = getAdminPaperDetailById(db, cleanPaperId, true);
  if (!detail) {
    throw new Error(`Failed to reload paper "${cleanPaperId}" after reordering questions.`);
  }
  return detail;
}

// ============================================================================
// 11. MCQ QUESTION BANK — FULL CRUD (`getAdminMcqById`, `updateAdminMcq`, `deleteAdminMcq`)
// ============================================================================

export interface UpdateAdminMcqInput {
  subjectCodeOrId?: string;
  unitId?: string | null;
  unitNumber?: number | null;
  topicId?: string | null;
  questionText?: string;
  options?: [string, string, string, string] | string[];
  correctIndex?: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  language?: "en" | "hi";
  marks?: number;
  verified?: boolean;
}

export function getAdminMcqById(db: AppDatabase, questionId: string): AdminMcqRecord | null {
  const cleanId = (questionId || "").trim();
  if (!cleanId) return null;

  const row = db
    .prepare("SELECT subject_id FROM questions WHERE id = ? AND is_active = 1 LIMIT 1")
    .get(cleanId) as { subject_id: string } | undefined;
  if (!row) return null;

  const list = getAdminMcqs(db, { subjectId: row.subject_id });
  return list.find((m) => m.id === cleanId) || null;
}

export function updateAdminMcq(
  db: AppDatabase,
  questionId: string,
  input: UpdateAdminMcqInput
): AdminMcqRecord {
  const cleanId = (questionId || "").trim();
  if (!cleanId) {
    throw new Error("MCQ question ID is required.");
  }

  const existing = db
    .prepare(
      `SELECT q.*, s.code AS subject_code
       FROM questions q
       JOIN subjects s ON s.id = q.subject_id
       WHERE q.id = ? AND q.is_active = 1
       LIMIT 1`
    )
    .get(cleanId) as any;

  if (!existing) {
    throw new Error(`MCQ "${cleanId}" not found.`);
  }

  // Enforce immutable subject relationship
  if (input.subjectCodeOrId && input.subjectCodeOrId.trim()) {
    const reqSubj = input.subjectCodeOrId.trim();
    if (
      reqSubj !== existing.subject_id &&
      reqSubj.toUpperCase() !== String(existing.subject_code).toUpperCase()
    ) {
      throw new Error(
        `Immutable hierarchy violation: MCQ "${cleanId}" belongs to subject ${existing.subject_code} (${existing.subject_id}) and cannot be reassigned to "${reqSubj}".`
      );
    }
  }

  const qText =
    input.questionText !== undefined ? input.questionText.trim() : existing.question_text;
  if (!qText || qText.length < 5) {
    throw new Error("Question text must be at least 5 characters.");
  }

  let cleanOptions: string[] = JSON.parse(existing.options_json);
  if (input.options !== undefined) {
    if (!Array.isArray(input.options) || input.options.length !== 4) {
      throw new Error("MCQ must provide exactly 4 distinct options.");
    }
    cleanOptions = input.options.map((o) => String(o || "").trim());
    if (cleanOptions.some((o) => !o)) {
      throw new Error("All 4 MCQ options must be non-empty strings.");
    }
  }

  const cIdx =
    input.correctIndex !== undefined ? Number(input.correctIndex) : Number(existing.correct_index);
  if (!Number.isInteger(cIdx) || cIdx < 0 || cIdx > 3) {
    throw new Error("correctIndex must be an integer between 0 and 3.");
  }

  const explanation =
    input.explanation !== undefined ? input.explanation.trim() : existing.explanation;
  if (!explanation) {
    throw new Error("Explanation is required for verified academic MCQs.");
  }

  const difficulty: "easy" | "medium" | "hard" =
    input.difficulty === "easy" || input.difficulty === "medium" || input.difficulty === "hard"
      ? input.difficulty
      : existing.difficulty;
  const language: "en" | "hi" =
    input.language === "en" || input.language === "hi" ? input.language : existing.language;
  const marks =
    input.marks !== undefined ? Math.max(1, Number(input.marks) || 1) : Number(existing.marks);
  const verified =
    input.verified !== undefined ? (input.verified ? 1 : 0) : Number(existing.verified);

  let resolvedUnitId: string | null = existing.unit_id;
  let resolvedTopicId: string | null = existing.topic_id;
  if (
    input.unitId !== undefined ||
    input.unitNumber !== undefined ||
    input.topicId !== undefined
  ) {
    const resolved = resolveUnitAndTopicForSubject(
      db,
      existing.subject_id,
      existing.subject_code,
      input.unitId !== undefined ? input.unitId : existing.unit_id,
      input.unitNumber,
      input.topicId !== undefined ? input.topicId : existing.topic_id,
      false
    );
    resolvedUnitId = resolved.unitId;
    resolvedTopicId = resolved.topicId;
  }

  const qHash = computeQuestionHash(qText);
  const duplicateHash = db
    .prepare(
      "SELECT id FROM questions WHERE subject_id = ? AND question_hash = ? AND id != ? LIMIT 1"
    )
    .get(existing.subject_id, qHash, cleanId) as { id: string } | undefined;
  if (duplicateHash) {
    throw new Error(
      `Duplicate MCQ question text detected in subject ${existing.subject_code} (conflicts with "${duplicateHash.id}").`
    );
  }

  db.prepare(
    `UPDATE questions
     SET unit_id = ?,
         topic_id = ?,
         question_text = ?,
         question_hash = ?,
         language = ?,
         options_json = ?,
         correct_index = ?,
         explanation = ?,
         difficulty = ?,
         marks = ?,
         verified = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    resolvedUnitId,
    resolvedTopicId,
    qText,
    qHash,
    language,
    JSON.stringify(cleanOptions),
    cIdx,
    explanation,
    difficulty,
    marks,
    verified,
    cleanId
  );

  const updated = getAdminMcqById(db, cleanId);
  if (!updated) {
    throw new Error("Failed to reload updated MCQ.");
  }
  return updated;
}

// ============================================================================
// 12. SUBJECT, UNIT, TOPIC & STUDY MATERIAL MANAGEMENT — FULL CRUD
// ============================================================================

export interface UpdateAdminSubjectInput {
  name?: string;
  shortName?: string;
  category?: string;
  credits?: number;
  description?: string;
}

export function updateAdminSubject(
  db: AppDatabase,
  idOrCode: string,
  input: UpdateAdminSubjectInput
): AdminSubjectDetail {
  const existing = getAdminSubjectById(db, idOrCode);
  if (!existing) {
    throw new Error(`Canonical GTU BCA subject "${idOrCode}" not found.`);
  }

  const name = input.name !== undefined && input.name.trim() ? input.name.trim() : existing.name;
  const shortName =
    input.shortName !== undefined && input.shortName.trim()
      ? input.shortName.trim()
      : existing.shortName;
  const category =
    input.category !== undefined && input.category.trim()
      ? input.category.trim()
      : existing.category;
  const credits =
    input.credits !== undefined
      ? Math.max(1, Math.floor(Number(input.credits) || 4))
      : existing.credits;
  const description =
    input.description !== undefined ? input.description.trim() : existing.description;

  db.prepare(
    `UPDATE subjects
     SET name = ?,
         short_name = ?,
         category = ?,
         credits = ?,
         description = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(name, shortName, category, credits, description, existing.id);

  const updated = getAdminSubjectById(db, existing.id);
  if (!updated) {
    throw new Error("Failed to reload updated subject.");
  }
  return updated;
}

export interface CreateAdminUnitInput {
  subjectCodeOrId?: string;
  subjectId?: string;
  subjectCode?: string;
  unitNumber: number;
  title: string;
  description?: string;
  weightage?: string;
}

export function createAdminUnit(db: AppDatabase, input: CreateAdminUnitInput) {
  const targetSubj = (input.subjectCodeOrId || input.subjectId || input.subjectCode || "").trim();
  const subj = getAdminSubjectById(db, targetSubj);
  if (!subj) {
    throw new Error(`Canonical subject "${targetSubj}" not found.`);
  }
  const unitNum = Math.max(1, Math.floor(Number(input.unitNumber)));
  const title = (input.title || "").trim();
  if (!title) {
    throw new Error("Unit title is required.");
  }

  const unitId = `unit_${subj.code}_u${unitNum}`;
  const existing = db
    .prepare("SELECT id FROM units WHERE subject_id = ? AND unit_number = ? LIMIT 1")
    .get(subj.id, unitNum) as { id: string } | undefined;
  if (existing) {
    throw new Error(`Unit ${unitNum} already exists in subject ${subj.code}.`);
  }

  db.prepare(
    `INSERT INTO units (
       id, subject_id, unit_number, title, description, weightage, order_index, is_active, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
  ).run(
    unitId,
    subj.id,
    unitNum,
    title,
    input.description || null,
    input.weightage || "25%",
    unitNum
  );

  return {
    id: unitId,
    subjectId: subj.id,
    unitNumber: unitNum,
    title,
    weightage: input.weightage || "25%",
    subject: getAdminSubjectById(db, subj.id),
  };
}

export function updateAdminUnit(
  db: AppDatabase,
  unitId: string,
  input: { unitNumber?: number; title?: string; description?: string; weightage?: string }
) {
  const cleanId = (unitId || "").trim();
  const row = db
    .prepare("SELECT id, subject_id, unit_number, title, description, weightage FROM units WHERE id = ? LIMIT 1")
    .get(cleanId) as any;
  if (!row) {
    throw new Error(`Unit "${cleanId}" not found.`);
  }

  const title = input.title !== undefined && input.title.trim() ? input.title.trim() : row.title;
  const description = input.description !== undefined ? input.description : row.description;
  const weightage = input.weightage !== undefined ? input.weightage : row.weightage;

  db.prepare(
    `UPDATE units SET title = ?, description = ?, weightage = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(title, description, weightage, cleanId);

  return {
    id: cleanId,
    subjectId: row.subject_id,
    unitNumber: Number(row.unit_number),
    title,
    weightage,
    subject: getAdminSubjectById(db, row.subject_id),
  };
}

export function deleteAdminUnit(db: AppDatabase, unitId: string): boolean {
  const cleanId = (unitId || "").trim();
  if (!cleanId) return false;
  db.prepare("DELETE FROM topics WHERE unit_id = ?").run(cleanId);
  const res = db.prepare("DELETE FROM units WHERE id = ?").run(cleanId);
  return Number(res.changes) > 0;
}

export interface CreateAdminTopicInput {
  subjectCodeOrId?: string;
  subjectId?: string;
  subjectCode?: string;
  unitId?: string;
  unitNumber?: number;
  title: string;
  summary?: string;
  content?: string;
  importantMarks?: number[];
  estimatedMinutes?: number;
}

export function createAdminTopic(db: AppDatabase, input: CreateAdminTopicInput) {
  const targetSubj = (input.subjectCodeOrId || input.subjectId || input.subjectCode || "").trim();
  const subj = getAdminSubjectById(db, targetSubj);
  if (!subj) {
    throw new Error(`Canonical subject "${targetSubj}" not found.`);
  }

  const { unitId: resolvedUnitId } = resolveUnitAndTopicForSubject(
    db,
    subj.id,
    subj.code,
    input.unitId,
    input.unitNumber,
    null,
    true
  );

  if (!resolvedUnitId) {
    throw new Error(`Target unit not found in subject ${subj.code}.`);
  }

  const title = (input.title || "").trim();
  if (!title) {
    throw new Error("Topic title is required.");
  }

  const maxOrderRow = db
    .prepare("SELECT COALESCE(MAX(order_index), 0) AS max_ord FROM topics WHERE unit_id = ?")
    .get(resolvedUnitId) as { max_ord: number };
  const nextOrder = Number(maxOrderRow.max_ord) + 1;
  const hashSuffix = computeQuestionHash(`${resolvedUnitId}:${title}`).slice(0, 8);
  const topicId = `topic_${subj.code}_${nextOrder}_${hashSuffix}`;

  const marksJson = JSON.stringify(
    Array.isArray(input.importantMarks) && input.importantMarks.length > 0
      ? input.importantMarks
      : [3, 5, 7]
  );

  db.prepare(
    `INSERT INTO topics (
       id, subject_id, unit_id, title, summary, content,
       important_marks_json, order_index, estimated_minutes, is_active, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
  ).run(
    topicId,
    subj.id,
    resolvedUnitId,
    title,
    input.summary || `${title} in ${subj.name}`,
    input.content || null,
    marksJson,
    nextOrder,
    Math.max(5, Number(input.estimatedMinutes) || 30)
  );

  return {
    id: topicId,
    topicId,
    subjectId: subj.id,
    unitId: resolvedUnitId,
    title,
    subject: getAdminSubjectById(db, subj.id),
  };
}

export function updateAdminTopic(
  db: AppDatabase,
  topicId: string,
  input: {
    title?: string;
    summary?: string;
    content?: string;
    importantMarks?: number[];
    estimatedMinutes?: number;
  }
) {
  const cleanId = (topicId || "").trim();
  const row = db
    .prepare("SELECT * FROM topics WHERE id = ? LIMIT 1")
    .get(cleanId) as any;
  if (!row) {
    throw new Error(`Topic "${cleanId}" not found.`);
  }

  const title = input.title !== undefined && input.title.trim() ? input.title.trim() : row.title;
  const summary = input.summary !== undefined ? input.summary : row.summary;
  const content = input.content !== undefined ? input.content : row.content;
  const marksJson =
    Array.isArray(input.importantMarks) && input.importantMarks.length > 0
      ? JSON.stringify(input.importantMarks)
      : row.important_marks_json;
  const estimatedMinutes =
    input.estimatedMinutes !== undefined
      ? Math.max(5, Number(input.estimatedMinutes) || 30)
      : row.estimated_minutes;

  db.prepare(
    `UPDATE topics
     SET title = ?,
         summary = ?,
         content = ?,
         important_marks_json = ?,
         estimated_minutes = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(title, summary, content, marksJson, estimatedMinutes, cleanId);

  return getAdminSubjectById(db, row.subject_id);
}

export function deleteAdminTopic(db: AppDatabase, topicId: string): boolean {
  const cleanId = (topicId || "").trim();
  if (!cleanId) return false;
  const res = db.prepare("DELETE FROM topics WHERE id = ?").run(cleanId);
  return Number(res.changes) > 0;
}

// Study Materials CRUD (`study_materials`)
export interface AdminStudyMaterialRecord {
  id: string;
  semester: number;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  unitId: string | null;
  unitNumber: number | null;
  unitTitle: string | null;
  topicId: string | null;
  topicTitle: string | null;
  title: string;
  materialType:
    | "notes"
    | "summary"
    | "formula_sheet"
    | "cheatsheet"
    | "reference_link"
    | "question_bank";
  summary: string;
  contentMarkdown: string;
  fileUrl: string | null;
  externalUrl: string | null;
  published: boolean;
  verified: boolean;
  updatedAt: string;
}

export function getAdminStudyMaterials(
  db: AppDatabase,
  filters: {
    semester?: number | null;
    subjectCode?: string;
    subjectId?: string;
    unitId?: string;
    topicId?: string;
    materialType?: string;
    search?: string;
  } = {}
): AdminStudyMaterialRecord[] {
  const params: Array<string | number> = [];
  let whereClause = "WHERE s.is_active = 1";

  if (filters.semester !== undefined && filters.semester !== null) {
    whereClause += " AND s.semester_id = ?";
    params.push(filters.semester);
  }
  if (filters.subjectCode && filters.subjectCode.trim() && filters.subjectCode !== "all") {
    whereClause += " AND UPPER(s.code) = UPPER(?)";
    params.push(filters.subjectCode.trim());
  }
  if (filters.subjectId && filters.subjectId.trim() && filters.subjectId !== "all") {
    whereClause += " AND sm.subject_id = ?";
    params.push(filters.subjectId.trim());
  }
  if (filters.unitId && filters.unitId.trim() && filters.unitId !== "all") {
    whereClause += " AND sm.unit_id = ?";
    params.push(filters.unitId.trim());
  }
  if (filters.topicId && filters.topicId.trim() && filters.topicId !== "all") {
    whereClause += " AND sm.topic_id = ?";
    params.push(filters.topicId.trim());
  }
  if (filters.materialType && filters.materialType.trim() && filters.materialType !== "all") {
    whereClause += " AND sm.material_type = ?";
    params.push(filters.materialType.trim());
  }
  if (filters.search && filters.search.trim()) {
    const sq = `%${filters.search.trim().toLowerCase()}%`;
    whereClause +=
      " AND (LOWER(sm.title) LIKE ? OR LOWER(COALESCE(sm.summary, '')) LIKE ? OR LOWER(s.code) LIKE ? OR LOWER(s.name) LIKE ?)";
    params.push(sq, sq, sq, sq);
  }

  const rows = db
    .prepare(
      `SELECT
         sm.id,
         s.semester_id AS semester,
         sm.subject_id,
         s.code AS subject_code,
         s.name AS subject_name,
         sm.unit_id,
         u.unit_number,
         u.title AS unit_title,
         sm.topic_id,
         t.title AS topic_title,
         sm.title,
         sm.material_type,
         sm.summary,
         sm.content_markdown,
         sm.file_url,
         sm.external_url,
         sm.published,
         sm.verified,
         sm.updated_at
       FROM study_materials sm
       JOIN subjects s ON s.id = sm.subject_id
       LEFT JOIN units u ON u.id = sm.unit_id AND u.subject_id = sm.subject_id
       LEFT JOIN topics t ON t.id = sm.topic_id AND t.subject_id = sm.subject_id
       ${whereClause}
       ORDER BY s.semester_id ASC, s.code ASC, u.unit_number ASC, sm.id ASC`
    )
    .all(...params) as any[];

  return rows.map((r) => ({
    id: r.id,
    semester: Number(r.semester),
    subjectId: r.subject_id,
    subjectCode: r.subject_code,
    subjectName: r.subject_name,
    unitId: r.unit_id,
    unitNumber: r.unit_number !== null ? Number(r.unit_number) : null,
    unitTitle: r.unit_title,
    topicId: r.topic_id,
    topicTitle: r.topic_title,
    title: r.title,
    materialType: r.material_type,
    summary: r.summary || "",
    contentMarkdown: r.content_markdown || "",
    fileUrl: r.file_url,
    externalUrl: r.external_url,
    published: r.published === 1,
    verified: r.verified === 1,
    updatedAt: r.updated_at,
  }));
}

export function getAdminStudyMaterialById(
  db: AppDatabase,
  materialId: string
): AdminStudyMaterialRecord | null {
  const cleanId = (materialId || "").trim();
  if (!cleanId) return null;
  const row = db
    .prepare("SELECT subject_id FROM study_materials WHERE id = ? LIMIT 1")
    .get(cleanId) as { subject_id: string } | undefined;
  if (!row) return null;
  const list = getAdminStudyMaterials(db, { subjectId: row.subject_id });
  return list.find((m) => m.id === cleanId) || null;
}

export interface CreateAdminStudyMaterialInput {
  subjectCodeOrId?: string;
  subjectCode?: string;
  subjectId?: string;
  unitId?: string | null;
  unitNumber?: number | null;
  topicId?: string | null;
  title: string;
  description?: string;
  language?: "en" | "hi";
  materialType?:
    | "notes"
    | "summary"
    | "formula_sheet"
    | "cheatsheet"
    | "reference"
    | "reference_link"
    | "video"
    | "other"
    | "question_bank";
  summary?: string;
  contentMarkdown?: string;
  fileUrl?: string | null;
  externalUrl?: string | null;
  published?: boolean;
  verified?: boolean;
  createdBy?: string | null;
}

export function createAdminStudyMaterial(
  db: AppDatabase,
  input: CreateAdminStudyMaterialInput
): AdminStudyMaterialRecord {
  const cleanSubj = (input.subjectCodeOrId || input.subjectCode || input.subjectId || "").trim();
  const subjectRow = db
    .prepare(
      "SELECT id, code, name FROM subjects WHERE is_active = 1 AND (id = ? OR UPPER(code) = UPPER(?)) LIMIT 1"
    )
    .get(cleanSubj, cleanSubj) as { id: string; code: string; name: string } | undefined;

  if (!subjectRow) {
    throw new Error(`Canonical subject "${cleanSubj}" not found.`);
  }

  const title = (input.title || "").trim();
  if (!title) {
    throw new Error("Study material title is required.");
  }

  const allowedTypes = new Set([
    "notes",
    "summary",
    "formula_sheet",
    "cheatsheet",
    "reference_link",
    "question_bank",
  ]);
  const materialType =
    input.materialType && allowedTypes.has(input.materialType) ? input.materialType : "notes";

  const { unitId: resolvedUnitId, topicId: resolvedTopicId } = resolveUnitAndTopicForSubject(
    db,
    subjectRow.id,
    subjectRow.code,
    input.unitId,
    input.unitNumber,
    input.topicId,
    true
  );

  const hashSuffix = computeQuestionHash(`${subjectRow.code}:${title}:${materialType}`).slice(
    0,
    12
  );
  const matId = `mat_admin_${subjectRow.code}_${hashSuffix}`;

  db.prepare(
    `INSERT INTO study_materials (
       id, subject_id, unit_id, topic_id, title, material_type,
       summary, content_markdown, file_url, external_url,
       published, verified, created_by, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       unit_id = excluded.unit_id,
       topic_id = excluded.topic_id,
       title = excluded.title,
       material_type = excluded.material_type,
       summary = excluded.summary,
       content_markdown = excluded.content_markdown,
       file_url = excluded.file_url,
       external_url = excluded.external_url,
       published = excluded.published,
       verified = excluded.verified,
       updated_at = datetime('now')`
  ).run(
    matId,
    subjectRow.id,
    resolvedUnitId,
    resolvedTopicId,
    title,
    materialType,
    input.summary || `${title} (${subjectRow.code})`,
    input.contentMarkdown || `# ${title}\n\n${input.summary || ""}`,
    input.fileUrl || null,
    input.externalUrl || null,
    input.published !== false ? 1 : 0,
    input.verified !== false ? 1 : 0,
    input.createdBy || null
  );

  const created = getAdminStudyMaterialById(db, matId);
  if (!created) {
    throw new Error("Failed to load created study material.");
  }
  return created;
}

export function updateAdminStudyMaterial(
  db: AppDatabase,
  materialId: string,
  input: Partial<CreateAdminStudyMaterialInput>
): AdminStudyMaterialRecord {
  const cleanId = (materialId || "").trim();
  const existing = db
    .prepare(
      `SELECT sm.*, s.code AS subject_code
       FROM study_materials sm
       JOIN subjects s ON s.id = sm.subject_id
       WHERE sm.id = ?
       LIMIT 1`
    )
    .get(cleanId) as any;

  if (!existing) {
    throw new Error(`Study material "${cleanId}" not found.`);
  }

  if (input.subjectCodeOrId && input.subjectCodeOrId.trim()) {
    const reqSubj = input.subjectCodeOrId.trim();
    if (
      reqSubj !== existing.subject_id &&
      reqSubj.toUpperCase() !== String(existing.subject_code).toUpperCase()
    ) {
      throw new Error(
        `Immutable hierarchy violation: Study material "${cleanId}" belongs to subject ${existing.subject_code} and cannot be reassigned to "${reqSubj}".`
      );
    }
  }

  let resolvedUnitId: string | null = existing.unit_id;
  let resolvedTopicId: string | null = existing.topic_id;
  if (
    input.unitId !== undefined ||
    input.unitNumber !== undefined ||
    input.topicId !== undefined
  ) {
    const resolved = resolveUnitAndTopicForSubject(
      db,
      existing.subject_id,
      existing.subject_code,
      input.unitId !== undefined ? input.unitId : existing.unit_id,
      input.unitNumber,
      input.topicId !== undefined ? input.topicId : existing.topic_id,
      false
    );
    resolvedUnitId = resolved.unitId;
    resolvedTopicId = resolved.topicId;
  }

  const title =
    input.title !== undefined && input.title.trim() ? input.title.trim() : existing.title;
  const materialType = input.materialType || existing.material_type;
  const summary = input.summary !== undefined ? input.summary : existing.summary;
  const contentMarkdown =
    input.contentMarkdown !== undefined ? input.contentMarkdown : existing.content_markdown;
  const fileUrl = input.fileUrl !== undefined ? input.fileUrl : existing.file_url;
  const externalUrl = input.externalUrl !== undefined ? input.externalUrl : existing.external_url;
  const published =
    input.published !== undefined ? (input.published ? 1 : 0) : existing.published;
  const verified = input.verified !== undefined ? (input.verified ? 1 : 0) : existing.verified;

  db.prepare(
    `UPDATE study_materials
     SET unit_id = ?,
         topic_id = ?,
         title = ?,
         material_type = ?,
         summary = ?,
         content_markdown = ?,
         file_url = ?,
         external_url = ?,
         published = ?,
         verified = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    resolvedUnitId,
    resolvedTopicId,
    title,
    materialType,
    summary,
    contentMarkdown,
    fileUrl,
    externalUrl,
    published,
    verified,
    cleanId
  );

  const updated = getAdminStudyMaterialById(db, cleanId);
  if (!updated) {
    throw new Error("Failed to reload updated study material.");
  }
  return updated;
}

export function deleteAdminStudyMaterial(
  db: AppDatabase,
  materialId: string,
  _options?: { permanent?: boolean }
): boolean {
  const cleanId = (materialId || "").trim();
  if (!cleanId) return false;
  const res = db.prepare("DELETE FROM study_materials WHERE id = ?").run(cleanId);
  return Number(res.changes) > 0;
}

export interface UpsertAdminAccountResult {
  status: "CREATED" | "UPDATED";
  id: string;
  name: string;
  email: string;
  role: "admin";
  isActive: boolean;
}

/**
 * Creates or updates an administrator account in the canonical SQLite `users` table
 * using the existing scrypt password hashing contract (`salt:derivedKey`).
 * Never logs, returns, or stores the plaintext password.
 */
export function upsertAdminUserAccount(
  db: AppDatabase,
  input: {
    email: string;
    password?: string;
    precomputedScryptHash?: string;
    name?: string;
    deterministicSalt?: string;
  }
): UpsertAdminAccountResult {
  const cleanEmail = (input.email || "").trim();
  if (!cleanEmail) {
    throw new Error("Admin email is required.");
  }

  let passwordHash = input.precomputedScryptHash || "";
  if (!passwordHash) {
    if (!input.password) {
      throw new Error("Either password or precomputedScryptHash is required.");
    }
    passwordHash = hashPasswordScrypt(input.password, input.deterministicSalt);
  }

  // Verify the hash conforms to scrypt salt:derivedKey format (32 hex chars : 128 hex chars)
  const parts = passwordHash.split(":");
  if (parts.length !== 2 || parts[0].length < 16 || parts[1].length !== 128) {
    throw new Error("Invalid scrypt password hash format.");
  }

  const existing = db
    .prepare(
      `SELECT id, name, email, role, is_active
       FROM users
       WHERE LOWER(email) = LOWER(?)
       LIMIT 1`
    )
    .get(cleanEmail) as
    | { id: string; name: string; email: string; role: string; is_active: number }
    | undefined;

  if (existing) {
    const nextName = (input.name || "").trim() || existing.name;
    db.prepare(
      `UPDATE users
       SET name = ?,
           email = ?,
           password_hash = ?,
           role = 'admin',
           is_active = 1,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(nextName, cleanEmail, passwordHash, existing.id);

    return {
      status: "UPDATED",
      id: existing.id,
      name: nextName,
      email: cleanEmail,
      role: "admin",
      isActive: true,
    };
  }

  const newId = `user_admin_${computeSha256Hex(cleanEmail.toLowerCase()).slice(0, 12)}`;
  const adminName = (input.name || "").trim() || "StudentMate Administrator";

  db.prepare(
    `INSERT INTO users (
       id, name, email, password_hash, role, semester, branch, xp, streak, is_active, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, 'admin', 6, 'BCA', 1000, 1, 1, datetime('now'), datetime('now'))`
  ).run(newId, adminName, cleanEmail, passwordHash);

  return {
    status: "CREATED",
    id: newId,
    name: adminName,
    email: cleanEmail,
    role: "admin",
    isActive: true,
  };
}


