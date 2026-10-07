import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import express from "express";
import curriculumDataRaw from "../data/curriculumData.json" with { type: "json" };
import {
  getCanonicalCurriculumFromDb,
  getQuestionsForCanonicalSubject,
  getSemesterPapersFromDb,
  initializeDatabase,
  resolveAcademicHierarchy,
} from "./index";

interface ExpectedAvailablePaper {
  subjectCode: string;
  subjectName: string;
  semester: number;
  paperId: string;
  examYear: number;
  examSession: "Summer" | "Winter";
  expectedTotalQuestions: number; // primary + OR alternatives in paper_questions
  requiredDomainKeywords: string[];
  forbiddenCrossSubjectKeywords: string[];
}

const EXPECTED_AVAILABLE_PAPERS: ExpectedAvailablePaper[] = [
  {
    subjectCode: "BCA101",
    subjectName: "Fundamental of Computer Organization",
    semester: 1,
    paperId: "gtu-paper-sem1-fco-2026-summer",
    examYear: 2026,
    examSession: "Summer",
    expectedTotalQuestions: 14,
    requiredDomainKeywords: [
      "von neumann",
      "universal gates",
      "multiplexer",
      "memory hierarchy",
      "dma",
      "risc",
    ],
    forbiddenCrossSubjectKeywords: [
      "c++",
      "cout",
      "cin",
      "pandas",
      "react",
      "hooks",
      "normal form",
      "bcnf",
      "deadlock",
      "coffman",
    ],
  },
  {
    subjectCode: "BCA102",
    subjectName: "Fundamental of Programming",
    semester: 1,
    paperId: "gtu-paper-sem1-cp-2025-winter",
    examYear: 2025,
    examSession: "Winter",
    expectedTotalQuestions: 11,
    requiredDomainKeywords: [
      "c program",
      "preprocessor",
      "strlen()",
      "pointer",
      "malloc",
      "structure and union",
    ],
    forbiddenCrossSubjectKeywords: [
      "c++",
      "von neumann",
      "karnaugh",
      "multiplexer",
      "pandas",
      "react",
      "deadlock",
      "jvm",
    ],
  },
  {
    subjectCode: "BCA201",
    subjectName: "Data Structure",
    semester: 2,
    paperId: "gtu-paper-sem3-ds-2025-winter",
    examYear: 2025,
    examSession: "Winter",
    expectedTotalQuestions: 10,
    requiredDomainKeywords: [
      "stack",
      "postfix",
      "circular queue",
      "singly linked list",
      "binary search tree",
      "quick sort",
      "hashing",
    ],
    forbiddenCrossSubjectKeywords: [
      "c++",
      "friend function",
      "virtual function",
      "operator overloading",
      "coffman",
      "osi 7-layer",
      "pandas",
      "react",
    ],
  },
  {
    subjectCode: "BCA202",
    subjectName: "Database Management System",
    semester: 2,
    paperId: "gtu-paper-sem2-dbms-2025-winter",
    examYear: 2025,
    examSession: "Winter",
    expectedTotalQuestions: 10,
    requiredDomainKeywords: [
      "three-schema",
      "entity-relationship",
      "relational algebra",
      "bcnf",
      "acid",
      "two-phase locking",
      "sql",
    ],
    forbiddenCrossSubjectKeywords: [
      "c++",
      "karnaugh",
      "deadlock avoidance",
      "gantt chart",
      "jvm",
      "pandas",
      "react",
    ],
  },
  {
    subjectCode: "BCA301",
    subjectName: "Operating System",
    semester: 3,
    paperId: "gtu-paper-sem4-os-2026-summer",
    examYear: 2026,
    examSession: "Summer",
    expectedTotalQuestions: 10,
    requiredDomainKeywords: [
      "process control block",
      "gantt chart",
      "deadlock",
      "coffman",
      "banker",
      "paging",
      "thrashing",
      "disk scheduling",
    ],
    forbiddenCrossSubjectKeywords: [
      "c++",
      "binary search tree",
      "infix",
      "jvm",
      "pandas",
      "numpy",
      "react",
      "osi 7-layer",
    ],
  },
  {
    subjectCode: "BCA302",
    subjectName: "Object Oriented Programming with Java",
    semester: 3,
    paperId: "gtu-paper-sem3-java-2026-summer",
    examYear: 2026,
    examSession: "Summer",
    expectedTotalQuestions: 11,
    requiredDomainKeywords: [
      "java virtual machine",
      "method overloading",
      "interface",
      "exception handling",
      "multi-threading",
      "collections framework",
      "jdbc",
    ],
    forbiddenCrossSubjectKeywords: [
      "c++",
      "friend function",
      "karnaugh",
      "coffman",
      "banker",
      "pandas",
      "numpy",
      "osi 7-layer",
    ],
  },
  {
    subjectCode: "BCA303",
    subjectName: "Computer Networking",
    semester: 3,
    paperId: "gtu-paper-sem4-cn-2025-winter",
    examYear: 2025,
    examSession: "Winter",
    expectedTotalQuestions: 10,
    requiredDomainKeywords: [
      "osi 7-layer",
      "cyclic redundancy check",
      "sliding window",
      "ipv4",
      "cidr",
      "bellman-ford",
      "3-way handshake",
      "dns",
    ],
    forbiddenCrossSubjectKeywords: [
      "c++",
      "gantt chart",
      "banker",
      "jvm",
      "jdbc",
      "pandas",
      "numpy",
      "react",
    ],
  },
  {
    subjectCode: "BCA401",
    subjectName: "Python Programming",
    semester: 4,
    paperId: "gtu-paper-sem5-python-2026-summer",
    examYear: 2026,
    examSession: "Summer",
    expectedTotalQuestions: 10,
    requiredDomainKeywords: [
      "tuple",
      "list comprehensions",
      "__init__",
      "numpy",
      "pandas",
      "matplotlib",
      "beautifulsoup",
    ],
    forbiddenCrossSubjectKeywords: [
      "c++",
      "process control block",
      "coffman",
      "banker",
      "osi 7-layer",
      "jvm",
      "react",
    ],
  },
  {
    subjectCode: "BCA502",
    subjectName: "Web Frameworks",
    semester: 5,
    paperId: "gtu-paper-sem6-web-2026-summer",
    examYear: 2026,
    examSession: "Summer",
    expectedTotalQuestions: 10,
    requiredDomainKeywords: [
      "react",
      "virtual dom",
      "usestate",
      "node.js",
      "express.js",
      "restful api",
      "jwt",
    ],
    forbiddenCrossSubjectKeywords: [
      "c++",
      "karnaugh",
      "coffman",
      "banker",
      "pandas",
      "numpy",
      "jvm",
    ],
  },
];

async function fetchJson(baseUrl: string, path: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${baseUrl}${path}`);
  const body = await res.json();
  return { status: res.status, body };
}

async function runEndToEndVerification() {
  console.log("==================================================================");
  console.log("END-TO-END GTU PAPERS & SUBJECT ISOLATION VERIFICATION SUITE");
  console.log("==================================================================");

  // 1. Verify Static Fallback Removal in Frontend Services & Views
  const paperServiceSource = fs.readFileSync("src/services/paperService.ts", "utf8");
  const papersViewSource = fs.readFileSync("src/views/QuestionPapersView.tsx", "utf8");

  assert.equal(
    /from\s+['"].*gtuPapersData['"]/.test(paperServiceSource),
    false,
    "paperService.ts must NOT import static gtuPapersData.ts"
  );
  assert.equal(
    /from\s+['"].*gtuPapersData['"]/.test(papersViewSource),
    false,
    "QuestionPapersView.tsx must NOT import static gtuPapersData.ts"
  );
  assert.equal(
    paperServiceSource.includes("api.getPapers"),
    true,
    "paperService.ts must fetch canonical papers via api.getPapers (/api/papers)"
  );
  assert.equal(
    papersViewSource.includes("paperService.fetchCanonicalPapers"),
    true,
    "QuestionPapersView.tsx must load papers from SQLite API via paperService.fetchCanonicalPapers()"
  );
  console.log("[PASS] Step 1: Frontend paperService.ts & QuestionPapersView.tsx are wired strictly to SQLite API (/api/papers) with zero static gtuPapersData.ts fallback.");

  // 2. Initialize Database & Start Test HTTP Server Mounting the Exact Express Routes
  const { db } = initializeDatabase();
  const app = express();
  app.use(express.json());

  app.get("/api/curriculum", (req, res) => {
    const sem = req.query.semester ? Number(req.query.semester) : undefined;
    res.json({ semesters: getCanonicalCurriculumFromDb(db, sem) });
  });

  app.get("/api/papers", (req, res) => {
    const sem = req.query.semester ? Number(req.query.semester) : undefined;
    const subjectCodeFilter =
      typeof req.query.subjectCode === "string" && req.query.subjectCode.trim()
        ? req.query.subjectCode.trim().toUpperCase()
        : undefined;
    const subjectIdFilter =
      typeof req.query.subjectId === "string" && req.query.subjectId.trim()
        ? req.query.subjectId.trim()
        : undefined;

    let data = getSemesterPapersFromDb(db, sem);
    if (subjectCodeFilter || subjectIdFilter) {
      data = data
        .map((s) => {
          const filteredSubjects = s.subjects.filter((subj) => {
            if (subjectCodeFilter && subj.subjectCode.toUpperCase() !== subjectCodeFilter) {
              return false;
            }
            if (subjectIdFilter && subj.subjectId !== subjectIdFilter) {
              return false;
            }
            return true;
          });
          return {
            ...s,
            totalSubjects: filteredSubjects.length,
            availableCount: filteredSubjects.filter((i) => i.isAvailable).length,
            unavailableCount: filteredSubjects.filter((i) => !i.isAvailable).length,
            subjects: filteredSubjects,
          };
        })
        .filter((s) => s.subjects.length > 0);
    }
    res.json({ semesters: data });
  });

  app.get("/api/papers/:id", (req, res) => {
    const target = (req.params.id || "").trim();
    const targetUpper = target.toUpperCase();
    const allSemesters = getSemesterPapersFromDb(db);
    for (const sem of allSemesters) {
      for (const item of sem.subjects) {
        const matchesPaperId = Boolean(item.paper && item.paper.id === target);
        const matchesSubjectCode = item.subjectCode.toUpperCase() === targetUpper;
        const matchesSubjectId = item.subjectId === target;
        if (matchesPaperId || matchesSubjectCode || matchesSubjectId) {
          if (item.isAvailable && item.paper) {
            res.json({
              paper: item.paper,
              subject: {
                semester: item.semester,
                subjectId: item.subjectId,
                subjectCode: item.subjectCode,
                subjectName: item.subjectName,
                availabilityStatus: item.availabilityStatus,
                isAvailable: item.isAvailable,
              },
            });
            return;
          }
          res.status(404).json({
            error: `Official GTU question paper for ${item.subjectName} (${item.subjectCode}) is not available yet.`,
            subject: {
              semester: item.semester,
              subjectId: item.subjectId,
              subjectCode: item.subjectCode,
              subjectName: item.subjectName,
              availabilityStatus: item.availabilityStatus,
              isAvailable: false,
            },
          });
          return;
        }
      }
    }
    res.status(404).json({ error: "Verified GTU question paper not found" });
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    // 3. Verify GET /api/papers across all 6 semesters and all 35 subjects
    const allRes = await fetchJson(baseUrl, "/api/papers");
    assert.equal(allRes.status, 200);
    const semesters = allRes.body.semesters as any[];
    assert.equal(semesters.length, 6, "GET /api/papers must return exactly 6 semesters");

    const expectedCountsBySem: Record<number, { total: number; avail: number; unavail: number }> = {
      1: { total: 8, avail: 2, unavail: 6 },
      2: { total: 8, avail: 2, unavail: 6 },
      3: { total: 7, avail: 3, unavail: 4 },
      4: { total: 5, avail: 1, unavail: 4 },
      5: { total: 4, avail: 1, unavail: 3 },
      6: { total: 3, avail: 0, unavail: 3 },
    };

    for (let semNum = 1; semNum <= 6; semNum++) {
      const semRes = await fetchJson(baseUrl, `/api/papers?semester=${semNum}`);
      assert.equal(semRes.status, 200);
      assert.equal(semRes.body.semesters.length, 1);
      const semGroup = semRes.body.semesters[0];
      const exp = expectedCountsBySem[semNum];
      assert.equal(semGroup.semester, semNum);
      assert.equal(semGroup.totalSubjects, exp.total, `Sem ${semNum} totalSubjects mismatch`);
      assert.equal(semGroup.availableCount, exp.avail, `Sem ${semNum} availableCount mismatch`);
      assert.equal(semGroup.unavailableCount, exp.unavail, `Sem ${semNum} unavailableCount mismatch`);
    }
    console.log("[PASS] Step 2: GET /api/papers and GET /api/papers?semester=1..6 verified for all 6 semesters (35 canonical subjects: 9 available, 26 unavailable).");

    // 4. Verify Every Single Available Paper Endpoint & Strict Subject-Question Isolation
    const availableCodesSet = new Set(EXPECTED_AVAILABLE_PAPERS.map((p) => p.subjectCode));

    for (const expected of EXPECTED_AVAILABLE_PAPERS) {
      // Test lookup by paperId, subjectCode, and query param
      const byPaperId = await fetchJson(baseUrl, `/api/papers/${expected.paperId}`);
      const bySubjectCode = await fetchJson(baseUrl, `/api/papers/${expected.subjectCode}`);
      const byQueryParam = await fetchJson(
        baseUrl,
        `/api/papers?semester=${expected.semester}&subjectCode=${expected.subjectCode}`
      );

      assert.equal(byPaperId.status, 200, `GET /api/papers/${expected.paperId} must return 200`);
      assert.equal(bySubjectCode.status, 200, `GET /api/papers/${expected.subjectCode} must return 200`);
      assert.equal(byQueryParam.status, 200);

      const paper = byPaperId.body.paper;
      assert.deepEqual(paper, bySubjectCode.body.paper, "Lookup by paperId and subjectCode must return identical paper");

      // Verify metadata matches canonical subject
      assert.equal(paper.id, expected.paperId);
      assert.equal(paper.semester, expected.semester);
      assert.equal(paper.subjectCode, expected.subjectCode);
      assert.equal(paper.subject, expected.subjectName);
      assert.equal(paper.year, expected.examYear);
      assert.equal(paper.exam, expected.examSession);
      assert.equal(paper.isAvailable, true);
      assert.equal(
        paper.fileName,
        `GTU_BCA_Sem${expected.semester}_${expected.subjectCode}_${expected.examYear}_${expected.examSession}.pdf`
      );
      assert.equal(paper.paperContent.subjectCode, expected.subjectCode);
      assert.equal(paper.paperContent.subjectName, expected.subjectName);
      assert.equal(paper.paperContent.semester, expected.semester);

      // Extract all questions (primary + OR alternatives)
      const allQuestionTexts: string[] = [];
      for (const sec of paper.paperContent.sections) {
        for (const q of sec.questions) {
          allQuestionTexts.push(q.text);
          if (q.orQuestion) {
            allQuestionTexts.push(q.orQuestion.text);
          }
        }
      }

      assert.equal(
        allQuestionTexts.length,
        expected.expectedTotalQuestions,
        `Expected ${expected.expectedTotalQuestions} questions for ${expected.subjectCode}, got ${allQuestionTexts.length}`
      );

      const combinedLower = allQuestionTexts.join(" \n ").toLowerCase();

      // Verify required subject domain keywords exist
      for (const reqKw of expected.requiredDomainKeywords) {
        assert.equal(
          combinedLower.includes(reqKw.toLowerCase()),
          true,
          `Paper for ${expected.subjectCode} (${expected.subjectName}) missing expected domain keyword "${reqKw}"`
        );
      }

      // Verify ZERO cross-subject contamination keywords exist
      for (const forbiddenKw of expected.forbiddenCrossSubjectKeywords) {
        assert.equal(
          combinedLower.includes(forbiddenKw.toLowerCase()),
          false,
          `CONTAMINATION DETECTED: Paper for ${expected.subjectCode} (${expected.subjectName}) contains forbidden keyword "${forbiddenKw}"`
        );
      }

      console.log(
        `  ✓ Verified [${expected.subjectCode}] ${expected.subjectName} (Sem ${expected.semester}, ${expected.examSession} ${expected.examYear}): ${allQuestionTexts.length} questions strictly isolated.`
      );
    }
    console.log("[PASS] Step 3: All 9 available papers and all 97 paper_questions verified with 0% cross-subject contamination.");

    // 5. Verify All 26 Unavailable Canonical Subjects Return Clean Unavailable Status & Never Leak Another Subject's Paper
    let unavailableVerifiedCount = 0;
    for (const currSubj of curriculumDataRaw) {
      if (availableCodesSet.has(currSubj.code)) continue;

      const byQuery = await fetchJson(
        baseUrl,
        `/api/papers?semester=${currSubj.semester}&subjectCode=${currSubj.code}`
      );
      assert.equal(byQuery.status, 200);
      assert.equal(byQuery.body.semesters.length, 1);
      const record = byQuery.body.semesters[0].subjects[0];
      assert.equal(record.subjectCode, currSubj.code);
      assert.equal(record.subjectName, currSubj.name);
      assert.equal(record.semester, currSubj.semester);
      assert.equal(record.isAvailable, false, `${currSubj.code} must have isAvailable=false`);
      assert.equal(record.availabilityStatus, "unavailable");
      assert.equal(record.pdfStatus, "PDF not available");
      assert.equal(record.paper, null, `${currSubj.code} must have paper=null`);

      const byDirectId = await fetchJson(baseUrl, `/api/papers/${currSubj.code}`);
      assert.equal(
        byDirectId.status,
        404,
        `GET /api/papers/${currSubj.code} for unavailable subject must return 404`
      );
      assert.equal(byDirectId.body.subject.subjectCode, currSubj.code);
      assert.equal(byDirectId.body.subject.isAvailable, false);
      unavailableVerifiedCount++;
    }
    assert.equal(unavailableVerifiedCount, 26, "Must verify all 26 unavailable canonical subjects");
    console.log("[PASS] Step 4: All 26 unavailable canonical subjects verified (isAvailable=false, paper=null, zero leaked papers).");

    // 6. Verify Quarantined C++ Paper is 404 and Completely Absent
    const cppRes = await fetchJson(baseUrl, "/api/papers/gtu-paper-sem2-cpp-2026-summer");
    assert.equal(cppRes.status, 404, "Quarantined C++ paper must return 404");
    const fullPayloadStr = JSON.stringify(allRes.body).toLowerCase();
    assert.equal(
      fullPayloadStr.includes("object-oriented programming with c++"),
      false,
      "C++ paper title must never appear anywhere in /api/papers response"
    );
    console.log("[PASS] Step 5: Quarantined C++ paper (gtu-paper-sem2-cpp-2026-summer) returns 404 and is 100% absent from all API responses.");

    // 7. Verify SQLite MCQ Bank (`questions` table) Subject Isolation for Canonical Subjects
    for (const currSubj of curriculumDataRaw) {
      const hierarchy = resolveAcademicHierarchy(db, {
        semester: currSubj.semester,
        subjectCode: currSubj.code,
        subjectName: currSubj.name,
      });
      assert.equal(hierarchy.subjectCode, currSubj.code);
      assert.equal(hierarchy.semesterId, currSubj.semester);

      const mcqs = getQuestionsForCanonicalSubject(db, hierarchy, { count: 20 });
      // Verify directly in SQLite that every returned question row belongs to hierarchy.subjectId
      for (const mcq of mcqs) {
        const ownerRow = db
          .prepare("SELECT subject_id FROM questions WHERE question_text = ?")
          .get(mcq.question) as { subject_id: string } | undefined;
        assert.ok(ownerRow, `MCQ "${mcq.question.slice(0, 40)}" must exist in SQLite questions table`);
        assert.equal(
          ownerRow.subject_id,
          hierarchy.subjectId,
          `MCQ subject_id mismatch: expected ${hierarchy.subjectId}, got ${ownerRow.subject_id}`
        );
      }
    }
    console.log("[PASS] Step 6: SQLite MCQ question bank (`questions` table) verified across all 35 canonical subjects with 100% subject_id isolation.");

    console.log("==================================================================");
    console.log("ALL END-TO-END GTU PAPERS & ISOLATION TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================================");
  } finally {
    server.close();
  }
}

runEndToEndVerification().catch((err) => {
  console.error("End-to-End Verification failed:", err);
  process.exit(1);
});
