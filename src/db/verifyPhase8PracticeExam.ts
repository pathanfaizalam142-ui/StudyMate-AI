/**
 * Step 8: Practice & Exam Experience Finalization Verification Suite
 * Verifies that:
 * 1. MCQ Practice engine is canonical, subject-isolated, and backed by GTU BCA curriculum & SQLite questions.
 * 2. Exam Answer Generator is canonical, subject-isolated, and free of hardcoded "Deadlock / OS" defaults.
 * 3. Connection between GTU BCA and Practice/Exam is unified and preserves subject context.
 * 4. All existing database schemas, admin auth, paper isolation, and curriculum remain pristine.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  initializeDatabase,
  getCanonicalCurriculumFromDb,
  getQuestionsForCanonicalSubject,
  resolveAcademicHierarchy,
} from "./index";
import {
  GTU_BCA_CURRICULUM,
  findSubjectByCodeOrName,
  getAllGTUSubjectsFlat,
} from "../data/gtuBcaCurriculum";

async function runStep8Verification() {
  console.log("=== STEP 8: PRACTICE & EXAM VERIFICATION START ===");
  const { db, migrationReport, seedReport } = initializeDatabase();

  // 1. Database Immutability Check
  console.log("\n[Test 1] Verifying Database schema and seed immutability...");
  assert.equal(migrationReport.applied.length, 0, "No new migrations should have been introduced");
  assert.equal(migrationReport.schemaVersion, "001_phase1_1_canonical_schema", "Schema version must remain 001_phase1_1_canonical_schema");
  const totalSubjects = (db.prepare("SELECT COUNT(*) as c FROM subjects WHERE is_active = 1").get() as { c: number }).c;
  const totalQuestions = (db.prepare("SELECT COUNT(*) as c FROM questions WHERE is_active = 1").get() as { c: number }).c;
  assert.ok(totalSubjects >= 30, `Expected at least 30 active canonical subjects, found ${totalSubjects}`);
  assert.ok(totalQuestions >= 90, `Expected at least 90 active canonical questions, found ${totalQuestions}`);
  console.log(`  ✓ Database schema intact with ${totalSubjects} subjects and ${totalQuestions} MCQs in SQLite.`);

  // 2. Canonical GTU BCA Curriculum Verification
  console.log("\n[Test 2] Verifying GTU BCA Curriculum structure for Practice & Exam...");
  assert.equal(GTU_BCA_CURRICULUM.length, 6, "GTU BCA must have 6 semesters");

  for (const sem of GTU_BCA_CURRICULUM) {
    assert.ok(sem.subjects.length >= 3, `Semester ${sem.semester} must have at least 3 subjects`);
    for (const subj of sem.subjects) {
      assert.ok(subj.code && subj.code.startsWith("BCA"), `Subject ${subj.name} must have a valid BCA code`);
      assert.ok(subj.units.length >= 1, `Subject ${subj.name} must have at least 1 unit`);
      
      let subjectExamQuestionCount = 0;
      for (const unit of subj.units) {
        assert.ok(unit.topics.length > 0, `Unit ${unit.unitName} must contain topics`);
        for (const topic of unit.topics) {
          if (topic.examQuestions && topic.examQuestions.length > 0) {
            subjectExamQuestionCount += topic.examQuestions.length;
            for (const eq of topic.examQuestions) {
              assert.ok(eq.question && eq.question.trim().length > 10, "Exam question must have substantive text");
              assert.ok([2, 3, 5, 7, 10, 15].includes(eq.marks), "Exam question marks must match university scheme");
            }
          }
        }
      }
      assert.ok(
        subjectExamQuestionCount > 0,
        `Subject ${subj.code} (${subj.name}) must have canonical exam questions for Exam Answer Generator`
      );
    }
  }
  console.log("  ✓ GTU BCA curriculum has comprehensive units and university exam questions across all 6 semesters.");

  // 3. Subject-Isolated Question Queries from SQLite
  console.log("\n[Test 3] Verifying SQLite MCQ isolation per subject...");
  const sampleSubjectsToTest = [
    { code: "BCA101", name: "Fundamental of Computer Organization", sem: 1 },
    { code: "BCA201", name: "Advanced C Programming", sem: 2 },
    { code: "BCA301", name: "Database Management Systems", sem: 3 },
  ];

  for (const sample of sampleSubjectsToTest) {
    const hierarchy = resolveAcademicHierarchy(db, {
      semester: sample.sem,
      subjectCode: sample.code,
      subjectName: sample.name,
    });
    assert.equal(hierarchy.subjectCode, sample.code);
    assert.equal(hierarchy.semesterId, sample.sem);

    const questions = getQuestionsForCanonicalSubject(db, hierarchy, { count: 10 });
    assert.ok(questions.length > 0, `Subject ${sample.code} must have canonical MCQs in SQLite`);

    for (const q of questions) {
      assert.ok(q.question && q.question.trim().length > 5, "Question must have valid text");
      assert.equal(q.options.length, 4, "MCQ must have exactly 4 choices");
      assert.ok(q.correctAnswer >= 0 && q.correctAnswer <= 3, "correctAnswer must be between 0 and 3");
      assert.ok(q.explanation && q.explanation.trim().length > 5, "MCQ must have an educational explanation");

      // Verify in SQLite that the question belongs to this exact subject_id
      const dbRow = db
        .prepare("SELECT subject_id FROM questions WHERE question_text = ?")
        .get(q.question) as { subject_id: string } | undefined;
      if (dbRow) {
        assert.equal(
          dbRow.subject_id,
          hierarchy.subjectId,
          `Question "${q.question.slice(0, 30)}..." must strictly belong to subject ${sample.code}`
        );
      }
    }
  }
  console.log("  ✓ SQLite MCQs are strictly isolated by subject with zero cross-contamination.");

  // 4. Source Code Audit for Hardcoded Arbitrary Defaults
  console.log("\n[Test 4] Verifying elimination of arbitrary hardcoded defaults in Practice & Exam views...");
  const quizViewContent = fs.readFileSync(path.resolve("src/views/QuizView.tsx"), "utf-8");
  const examAnswerViewContent = fs.readFileSync(path.resolve("src/views/ExamAnswerView.tsx"), "utf-8");
  const appContent = fs.readFileSync(path.resolve("src/App.tsx"), "utf-8");

  // Verify ExamAnswerView no longer hardcodes Deadlock as the universal initial question
  assert.ok(
    !examAnswerViewContent.includes("'Explain Deadlock in Operating Systems. What are the four necessary Coffman conditions? How is it prevented?'"),
    "ExamAnswerView must not hardcode Deadlock question as the universal default"
  );
  assert.ok(
    examAnswerViewContent.includes("getCanonicalExamQuestionsForSubject"),
    "ExamAnswerView must dynamically derive canonical exam questions for the selected subject"
  );
  assert.ok(
    examAnswerViewContent.includes("findSubjectByCodeOrName"),
    "ExamAnswerView must look up canonical curriculum metadata"
  );

  // Verify QuizView has unit selection and academic context
  assert.ok(
    quizViewContent.includes("selectedUnitNumber"),
    "QuizView must support unit-level selection"
  );
  assert.ok(
    quizViewContent.includes("optgroup"),
    "QuizView must group subjects by semester in dropdown"
  );
  assert.ok(
    quizViewContent.includes("curriculumMatch"),
    "QuizView must bind to canonical curriculum metadata"
  );

  // Verify App.tsx passes onNavigate to both views
  assert.ok(
    appContent.includes("<ExamAnswerView") && appContent.includes("onNavigate={handleNavigate}"),
    "App.tsx must pass onNavigate to ExamAnswerView"
  );
  assert.ok(
    appContent.includes("<QuizView") && appContent.includes("onNavigate={handleNavigate}"),
    "App.tsx must pass onNavigate to QuizView"
  );

  // Verify single canonical engines (no duplicates)
  const viewsDir = fs.readdirSync(path.resolve("src/views"));
  assert.ok(!viewsDir.includes("QuizView2.tsx"), "No duplicate QuizView2 allowed");
  assert.ok(!viewsDir.includes("QuizEngineNew.tsx"), "No duplicate QuizEngineNew allowed");
  assert.ok(!viewsDir.includes("ExamAnswerViewNew.tsx"), "No duplicate ExamAnswerViewNew allowed");

  console.log("  ✓ Source code audit passed: No hardcoded topic contamination, single canonical engines.");

  // 5. Dynamic Exam Question Extraction
  console.log("\n[Test 5] Verifying dynamic exam question extraction across different subjects...");
  const fcoQuestions = findSubjectByCodeOrName("BCA101")?.units[0]?.topics[0]?.examQuestions;
  assert.ok(fcoQuestions && fcoQuestions.length > 0, "BCA101 must have canonical exam questions");
  assert.ok(
    fcoQuestions.some((q) => q.question.toLowerCase().includes("block diagram") || q.question.toLowerCase().includes("digital computer")),
    "BCA101 exam questions must be related to computer organization"
  );

  const cProgQuestions = findSubjectByCodeOrName("BCA102")?.units[0]?.topics[0]?.examQuestions;
  assert.ok(cProgQuestions && cProgQuestions.length > 0, "BCA102 must have canonical exam questions");
  assert.ok(
    cProgQuestions.some((q) => q.question.toLowerCase().includes("c ") || q.question.toLowerCase().includes("flowchart") || q.question.toLowerCase().includes("algorithm")),
    "BCA102 exam questions must be related to C programming/problem solving"
  );

  console.log("  ✓ Dynamic exam question extraction successfully isolates subject-specific exam questions.");

  console.log("\n=== ALL STEP 8 VERIFICATION TESTS PASSED (5/5) ===");
}

runStep8Verification().catch((err) => {
  console.error("Step 8 Verification Failed:", err);
  process.exit(1);
});
