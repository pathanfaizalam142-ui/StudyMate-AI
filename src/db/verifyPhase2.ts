import assert from "node:assert/strict";
import fs from "node:fs";
import {
  computeQuestionHash,
  getCanonicalCurriculumFromDb,
  getSemesterPapersFromDb,
  initializeDatabase,
  runMigrations,
  seedDatabase,
} from "./index";

async function runVerification() {
  console.log("==================================================================");
  console.log("PHASE 1.2 / PHASE 2 — DATABASE MIGRATION, SEED & INTEGRITY SUITE");
  console.log("==================================================================");

  const dbExistedBefore = fs.existsSync("studymate.db");
  console.log(`[Pre-Check] studymate.db existed before initialization: ${dbExistedBefore}`);

  // 1. Run initialization (creates studymate.db, runs migration 001, runs seed)
  const { db, migrationReport, seedReport } = initializeDatabase();
  console.log("[Step 1] Initial Migration Report:", JSON.stringify(migrationReport));
  console.log("[Step 1] Initial Seed Report:", JSON.stringify(seedReport));

  assert.equal(fs.existsSync("studymate.db"), true, "studymate.db must exist after initializeDatabase()");

  // List all tables created in studymate.db
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC"
    )
    .all() as Array<{ name: string }>;
  console.log(`[Step 2] Verified ${tables.length} tables in studymate.db:`, tables.map((t) => t.name).join(", "));
  assert.equal(tables.length, 27, "Expected all 27 Phase 1.1 contract tables to exist");

  // =========================================================================
  // CRITICAL TEST 1: Every subject has the correct canonical subject code & deterministic ID
  // =========================================================================
  const subjects = db
    .prepare("SELECT id, semester_id, code, name FROM subjects ORDER BY semester_id ASC, code ASC")
    .all() as Array<{ id: string; semester_id: number; code: string; name: string }>;
  assert.equal(subjects.length, 35, "Expected exactly 35 canonical GTU BCA subjects across Sem 1-6");
  for (const s of subjects) {
    assert.equal(s.id, `subj_${s.code}`, `Subject ID ${s.id} must match deterministic format subj_${s.code}`);
    assert.match(s.code, /^BCA[1-6]0[1-8]$/, `Invalid subject code format: ${s.code}`);
  }
  console.log("[PASS] Test 1: All 35 canonical subjects have deterministic IDs (subj_<CODE>) and valid codes.");

  // =========================================================================
  // CRITICAL TEST 2: Every unit belongs to the correct subject
  // =========================================================================
  const orphanOrMismatchedUnits = db
    .prepare(
      `SELECT u.id, u.subject_id, s.code
       FROM units u
       LEFT JOIN subjects s ON s.id = u.subject_id
       WHERE s.id IS NULL OR u.id NOT LIKE ('unit_' || s.code || '_u%')`
    )
    .all();
  assert.equal(orphanOrMismatchedUnits.length, 0, "Zero units may be orphaned or mismatched from their parent subject");
  console.log(`[PASS] Test 2: All ${seedReport.unitsSeeded} units belong strictly to their canonical parent subject.`);

  // =========================================================================
  // CRITICAL TEST 3: Every topic belongs to the correct unit and subject
  // =========================================================================
  const mismatchedTopics = db
    .prepare(
      `SELECT t.id, t.subject_id, t.unit_id, u.subject_id AS unit_subject_id
       FROM topics t
       LEFT JOIN units u ON u.id = t.unit_id
       LEFT JOIN subjects s ON s.id = t.subject_id
       WHERE u.id IS NULL OR s.id IS NULL OR t.subject_id != u.subject_id`
    )
    .all();
  assert.equal(mismatchedTopics.length, 0, "Zero topics may have mismatched unit_id and subject_id");
  console.log(`[PASS] Test 3: All ${seedReport.topicsSeeded} topics belong strictly to their parent unit and subject.`);

  // =========================================================================
  // CRITICAL TEST 4: Every paper belongs to the intended canonical subject (Approved Paper Mappings)
  // =========================================================================
  const papers = db
    .prepare(
      `SELECT p.id, p.semester_id, p.subject_id, s.code AS canonical_code, s.name AS canonical_name,
              p.availability_status, p.published, p.verified
       FROM papers p
       JOIN subjects s ON s.id = p.subject_id
       ORDER BY s.semester_id ASC, s.code ASC`
    )
    .all() as Array<{
    id: string;
    semester_id: number;
    subject_id: string;
    canonical_code: string;
    canonical_name: string;
    availability_status: string;
    published: number;
    verified: number;
  }>;

  const paperMapById = new Map(papers.map((p) => [p.id, p]));
  assert.equal(paperMapById.get("gtu-paper-sem1-fco-2026-summer")?.canonical_code, "BCA101");
  assert.equal(paperMapById.get("gtu-paper-sem1-cp-2025-winter")?.canonical_code, "BCA102");
  assert.equal(paperMapById.get("gtu-paper-sem1-wt-2026-summer")?.canonical_code, "BCA103");
  assert.equal(paperMapById.get("gtu-paper-sem3-ds-2025-winter")?.canonical_code, "BCA201");
  assert.equal(paperMapById.get("gtu-paper-sem2-dbms-2025-winter")?.canonical_code, "BCA202");
  assert.equal(paperMapById.get("gtu-paper-sem4-os-2026-summer")?.canonical_code, "BCA301");
  assert.equal(paperMapById.get("gtu-paper-sem3-java-2026-summer")?.canonical_code, "BCA302");
  assert.equal(paperMapById.get("gtu-paper-sem4-cn-2025-winter")?.canonical_code, "BCA303");
  assert.equal(paperMapById.get("gtu-paper-sem5-python-2026-summer")?.canonical_code, "BCA401");
  assert.equal(paperMapById.get("gtu-paper-sem6-web-2026-summer")?.canonical_code, "BCA502");
  console.log("[PASS] Test 4: All approved paper mappings (DS→BCA201, OS→BCA301, CN→BCA303, Python→BCA401, React/Node→BCA502, plus BCA101, BCA102, BCA103, BCA202, BCA302) verified.");

  // =========================================================================
  // CRITICAL TEST 5: C++ is NOT attached to any subject & is quarantined
  // =========================================================================
  const cppInPapers = db
    .prepare(
      "SELECT id FROM papers WHERE id = 'gtu-paper-sem2-cpp-2026-summer' OR LOWER(title) LIKE '%c++%' OR LOWER(subject_name_snapshot) LIKE '%c++%'"
    )
    .all();
  assert.equal(cppInPapers.length, 0, "C++ paper must NOT exist in papers table");

  const cppInPaperQuestions = db
    .prepare("SELECT id FROM paper_questions WHERE LOWER(question_text) LIKE '%in c++%'")
    .all();
  assert.equal(cppInPaperQuestions.length, 0, "C++ paper questions must NOT exist in paper_questions table");

  const cppQuarantined = db
    .prepare("SELECT id, legacy_id, reason FROM quarantined_legacy_records WHERE legacy_id = 'gtu-paper-sem2-cpp-2026-summer'")
    .get() as { id: string; legacy_id: string; reason: string } | undefined;
  assert.ok(cppQuarantined, "C++ paper must be recorded in quarantined_legacy_records");
  console.log("[PASS] Test 5: C++ paper is 100% excluded from papers/paper_questions and recorded in quarantined_legacy_records.");

  // =========================================================================
  // CRITICAL TEST 6: Paper question subject matches paper subject (and trigger blocks mismatch)
  // =========================================================================
  const mismatchedPaperQuestions = db
    .prepare(
      `SELECT pq.id
       FROM paper_questions pq
       JOIN papers p ON p.id = pq.paper_id
       LEFT JOIN units u ON u.id = pq.unit_id
       LEFT JOIN topics t ON t.id = pq.topic_id
       WHERE pq.subject_id != p.subject_id
          OR (pq.unit_id IS NOT NULL AND u.subject_id != pq.subject_id)
          OR (pq.topic_id IS NOT NULL AND t.subject_id != pq.subject_id)`
    )
    .all();
  assert.equal(mismatchedPaperQuestions.length, 0, "Every paper_question must match its parent paper subject_id and unit/topic hierarchy");

  assert.throws(
    () => {
      db.prepare(
        `INSERT INTO paper_questions (id, paper_id, subject_id, section_number, section_title, question_number, question_text, marks, display_order)
         VALUES ('pq_illegal_test', 'gtu-paper-sem1-fco-2026-summer', 'subj_BCA201', 1, 'Q1', 'Q1', 'Illegal cross-subject question', 7, 999)`
      ).run();
    },
    /Hierarchy violation in paper_questions/,
    "Trigger trg_paper_questions_hierarchy_ins must block paper_question with mismatched subject_id"
  );
  console.log(`[PASS] Test 6: All ${seedReport.paperQuestionsSeeded} paper_questions match their paper subject_id, and cross-subject insertion is blocked by trigger.`);

  // =========================================================================
  // CRITICAL TEST 7: Question subject cannot silently change
  // =========================================================================
  const sampleQuestion = db
    .prepare("SELECT id, subject_id FROM questions WHERE subject_id = 'subj_BCA101' LIMIT 1")
    .get() as { id: string; subject_id: string };
  assert.ok(sampleQuestion, "Sample question must exist for subj_BCA101");

  assert.throws(
    () => {
      db.prepare("UPDATE questions SET subject_id = 'subj_BCA201' WHERE id = ?").run(
        sampleQuestion.id
      );
    },
    /Immutable hierarchy violation: question subject_id cannot be changed after creation/,
    "Trigger trg_questions_hierarchy_upd must reject changing questions.subject_id"
  );
  console.log("[PASS] Test 7: Question subject_id immutability enforced by SQLite trigger (cannot silently change).");

  // =========================================================================
  // CRITICAL TEST 8: Duplicate subjects are not created
  // =========================================================================
  assert.throws(
    () => {
      db.prepare(
        "INSERT INTO subjects (id, semester_id, code, name) VALUES ('subj_BCA101_dup', 1, 'BCA101', 'Duplicate Subject')"
      ).run();
    },
    /UNIQUE constraint failed: subjects\.code/,
    "UNIQUE(code) must prevent duplicate subject codes"
  );
  console.log("[PASS] Test 8: Duplicate subjects are rejected by UNIQUE constraint.");

  // =========================================================================
  // CRITICAL TEST 9: Duplicate questions are not created within a subject
  // =========================================================================
  const h1 = computeQuestionHash("What is RAM?");
  const h2 = computeQuestionHash("what is ram?");
  const h3 = computeQuestionHash("What is  RAM ?");
  assert.equal(h1, h2, "Normalized hash must be identical for 'What is RAM?' and 'what is ram?'");
  assert.equal(h2, h3, "Normalized hash must be identical for 'what is ram?' and 'What is  RAM ?'");

  const existingQ = db
    .prepare("SELECT subject_id, question_text, question_hash FROM questions LIMIT 1")
    .get() as { subject_id: string; question_text: string; question_hash: string };

  assert.throws(
    () => {
      db.prepare(
        `INSERT INTO questions (id, subject_id, question_text, question_hash, language, options_json, correct_index, explanation, difficulty, marks, source)
         VALUES ('q_dup_test', ?, ?, ?, 'en', '["A","B","C","D"]', 0, 'Test', 'easy', 1, 'admin')`
      ).run(existingQ.subject_id, existingQ.question_text + "   ??? ", existingQ.question_hash);
    },
    /UNIQUE constraint failed: questions\.subject_id, questions\.question_hash/,
    "UNIQUE(subject_id, question_hash) must reject duplicate questions within the same subject"
  );
  console.log("[PASS] Test 9: Deterministic question_hash normalization & UNIQUE(subject_id, question_hash) prevent duplicate questions.");

  // =========================================================================
  // CRITICAL TEST 10 & 11: Migration and Seed can be run safely more than once (Idempotency)
  // =========================================================================
  const migReport2 = runMigrations(db);
  assert.equal(migReport2.applied.length, 0, "Second runMigrations() must apply 0 new migrations");
  assert.equal(migReport2.alreadyApplied.includes("001_phase1_1_canonical_schema"), true);

  const seedReport2 = seedDatabase(db);
  const seedReport3 = seedDatabase(db);
  assert.deepEqual(seedReport2, seedReport, "Second seedDatabase() run must produce identical row counts");
  assert.deepEqual(seedReport3, seedReport, "Third seedDatabase() run must produce identical row counts");
  console.log("[PASS] Test 10 & 11: Migration and Seed are 100% idempotent across multiple runs.");

  // =========================================================================
  // CRITICAL TEST 12: Repository read models (Curriculum & 4-State Papers)
  // =========================================================================
  const curriculumSemesters = getCanonicalCurriculumFromDb(db);
  assert.equal(curriculumSemesters.length, 6, "Must return 6 semesters");
  const totalCurrSubjects = curriculumSemesters.reduce((acc, s) => acc + s.subjects.length, 0);
  assert.equal(totalCurrSubjects, 35, "Curriculum API model must return all 35 canonical subjects");

  const paperSemesters = getSemesterPapersFromDb(db);
  assert.equal(paperSemesters.length, 6, "Papers API model must return 6 semesters");
  const totalPaperSubjects = paperSemesters.reduce((acc, s) => acc + s.totalSubjects, 0);
  const totalAvailablePapers = paperSemesters.reduce((acc, s) => acc + s.availableCount, 0);
  assert.equal(totalPaperSubjects, 35, "Papers view model must include all 35 canonical subjects");
  assert.equal(totalAvailablePapers, 9, "Papers view model must have exactly 9 verified available papers");

  console.log("==================================================================");
  console.log("ALL 12 CRITICAL PHASE 2 INTEGRITY TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================================");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
