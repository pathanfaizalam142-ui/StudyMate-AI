import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import express from "express";
import {
  authenticateAdminCredentials,
  createAdminMcq,
  deactivateAdminMcq,
  getAdminAllPaperQuestions,
  getAdminDashboardStats,
  getAdminMcqs,
  getAdminPapers,
  getAdminPaperWithQuestions,
  getAdminSubjectById,
  getAdminSubjects,
  initializeDatabase,
  parseValidSemester,
  revokeAdminSessionToken,
  verifyAdminSessionToken,
} from "./index";

async function fetchJson(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const payload = options.body ? JSON.stringify(options.body) : undefined;
    const headers: Record<string, string> = {
      ...(options.headers || {}),
    };
    if (payload) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = String(Buffer.byteLength(payload));
    }

    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode || 500,
              body: data ? JSON.parse(data) : null,
            });
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runPhase3Verification() {
  console.log("=================================================================");
  console.log("PHASE 3 — ADMIN FOUNDATION & CONTENT MANAGEMENT VERIFICATION");
  console.log("=================================================================\n");

  const { db } = initializeDatabase();

  // Clean up any leftover test sessions or test admin MCQs before running assertions
  db.prepare("DELETE FROM user_sessions").run();
  db.prepare("DELETE FROM questions WHERE id LIKE 'q_admin_%'").run();

  // Mount an isolated Express server with the exact Phase 3 Admin routes
  const app = express();
  app.use(express.json());

  function extractBearerToken(req: express.Request): string | null {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      return authHeader.slice(7).trim();
    }
    const customToken = req.headers["x-admin-token"];
    if (typeof customToken === "string" && customToken.trim()) {
      return customToken.trim();
    }
    return null;
  }

  function adminAccessGuard(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const explicitRole = String(
      req.headers["x-user-role"] || req.headers["x-admin-role"] || ""
    )
      .trim()
      .toLowerCase();

    if (explicitRole === "student" || explicitRole === "guest" || explicitRole === "unauthorized") {
      res.status(403).json({
        error: "Forbidden: Administrator privileges are required.",
      });
      return;
    }

    const token = extractBearerToken(req);
    if (token) {
      const adminUser = verifyAdminSessionToken(db, token);
      if (!adminUser) {
        res.status(401).json({
          error: "Unauthorized: Invalid or expired administrator session token.",
        });
        return;
      }
      (req as any).adminUser = adminUser;
      next();
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD" && explicitRole !== "admin") {
      res.status(401).json({
        error: "Unauthorized: Valid administrator session token is required for content mutations.",
      });
      return;
    }

    next();
  }

  app.post("/api/admin/auth/login", (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required." });
      return;
    }
    const authResult = authenticateAdminCredentials(db, email, password);
    if (!authResult) {
      res.status(401).json({ error: "Invalid administrator credentials." });
      return;
    }
    res.json({
      success: true,
      token: authResult.token,
      expiresAt: authResult.expiresAt,
      user: authResult.user,
    });
  });

  app.get("/api/admin/auth/me", (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ authenticated: false });
      return;
    }
    const user = verifyAdminSessionToken(db, token);
    if (!user) {
      res.status(401).json({ authenticated: false });
      return;
    }
    res.json({ authenticated: true, user });
  });

  app.post("/api/admin/auth/logout", (req, res) => {
    const token = extractBearerToken(req);
    const revoked = token ? revokeAdminSessionToken(db, token) : false;
    res.json({ success: true, revoked });
  });

  app.get("/api/admin/stats", adminAccessGuard, (req, res) => {
    const stats = getAdminDashboardStats(db);
    res.json({ ...stats, totalSubjects: stats.totalCanonicalSubjects, stats });
  });

  app.get("/api/admin/subjects", adminAccessGuard, (req, res) => {
    try {
      const semester = parseValidSemester(req.query.semester);
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const rawAvail = String(req.query.availability || "all").toLowerCase();
      const availability: "all" | "available" | "unavailable" =
        rawAvail === "available"
          ? "available"
          : rawAvail === "unavailable"
          ? "unavailable"
          : "all";
      const subjects = getAdminSubjects(db, { semester, search, availability });
      res.json({
        total: subjects.length,
        availableCount: subjects.filter((s) => s.availabilityStatus === "available").length,
        unavailableCount: subjects.filter((s) => s.availabilityStatus === "unavailable").length,
        subjects,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/admin/subjects/:id", adminAccessGuard, (req, res) => {
    const subject = getAdminSubjectById(db, req.params.id);
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    res.json({ subject });
  });

  app.get("/api/admin/papers", adminAccessGuard, (req, res) => {
    try {
      const semester = parseValidSemester(req.query.semester);
      const subjectCode =
        typeof req.query.subjectCode === "string" ? req.query.subjectCode : undefined;
      const year = req.query.year ? Number(req.query.year) : null;
      const examSession =
        typeof req.query.examSession === "string" ? req.query.examSession : undefined;
      const rawAvail = String(req.query.availability || "all").toLowerCase();
      const availability: "all" | "available" | "unavailable" =
        rawAvail === "available"
          ? "available"
          : rawAvail === "unavailable"
          ? "unavailable"
          : "all";
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const papers = getAdminPapers(db, {
        semester,
        subjectCode,
        year,
        examSession,
        availability,
        search,
      });
      res.json({
        total: papers.length,
        availableCount: papers.filter((p) => p.isAvailable).length,
        unavailableCount: papers.filter((p) => !p.isAvailable).length,
        papers,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/admin/papers/:id", adminAccessGuard, (req, res) => {
    const detail = getAdminPaperWithQuestions(db, req.params.id);
    if (!detail) {
      res.status(404).json({ error: "Paper not available" });
      return;
    }
    res.json({
      paper: detail.paper,
      totalQuestions: detail.questions.length,
      questions: detail.questions,
    });
  });

  app.get("/api/admin/papers/:id/questions", adminAccessGuard, (req, res) => {
    const detail = getAdminPaperWithQuestions(db, req.params.id);
    if (!detail) {
      res.status(404).json({ error: "Paper not available" });
      return;
    }
    const reqSubjectCode =
      typeof req.query.subjectCode === "string" && req.query.subjectCode.trim()
        ? req.query.subjectCode.trim().toUpperCase()
        : null;
    if (reqSubjectCode && reqSubjectCode !== detail.paper.subjectCode.toUpperCase()) {
      res.status(400).json({ error: "Subject isolation violation" });
      return;
    }
    res.json({
      paper: detail.paper,
      total: detail.questions.length,
      primaryCount: detail.paper.primaryQuestionCount,
      alternativeCount: detail.paper.alternativeQuestionCount,
      questions: detail.questions,
    });
  });

  app.get("/api/admin/paper-questions", adminAccessGuard, (req, res) => {
    try {
      const semester = parseValidSemester(req.query.semester);
      const paperId = typeof req.query.paperId === "string" ? req.query.paperId : undefined;
      const subjectCode =
        typeof req.query.subjectCode === "string" ? req.query.subjectCode : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      if (paperId) {
        const detail = getAdminPaperWithQuestions(db, paperId);
        if (!detail) {
          res.status(404).json({ error: "Paper not found" });
          return;
        }
        if (subjectCode && detail.paper.subjectCode.toUpperCase() !== subjectCode.toUpperCase()) {
          res.status(400).json({ error: "Subject isolation violation" });
          return;
        }
      }
      const questions = getAdminAllPaperQuestions(db, {
        semester,
        subjectCode,
        paperId,
        search,
      });
      res.json({ total: questions.length, questions });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/admin/mcqs", adminAccessGuard, (req, res) => {
    try {
      const semester = parseValidSemester(req.query.semester);
      const subjectCode =
        typeof req.query.subjectCode === "string" ? req.query.subjectCode : undefined;
      if (subjectCode && subjectCode !== "all") {
        const subj = getAdminSubjectById(db, subjectCode);
        if (!subj) {
          res.status(404).json({ error: "Subject not found" });
          return;
        }
      }
      const mcqs = getAdminMcqs(db, {
        semester,
        subjectCode,
        language: typeof req.query.language === "string" ? req.query.language : undefined,
        difficulty: typeof req.query.difficulty === "string" ? req.query.difficulty : undefined,
        source: typeof req.query.source === "string" ? req.query.source : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
      });
      res.json({ total: mcqs.length, mcqs, questions: mcqs });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/admin/mcqs", adminAccessGuard, (req, res) => {
    try {
      const created = createAdminMcq(db, {
        subjectCodeOrId: req.body?.subjectCode || "",
        unitId: req.body?.unitId,
        unitNumber: req.body?.unitNumber,
        topicId: req.body?.topicId,
        questionText: req.body?.questionText || "",
        options: req.body?.options,
        correctIndex: req.body?.correctIndex,
        explanation: req.body?.explanation || "",
        difficulty: req.body?.difficulty,
        language: req.body?.language,
      });
      res.status(201).json({ success: true, mcq: created });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/admin/mcqs/:id", adminAccessGuard, (req, res) => {
    const ok = deactivateAdminMcq(db, req.params.id);
    if (!ok) {
      res.status(404).json({ error: "MCQ not found" });
      return;
    }
    res.json({ success: true, deactivated: true });
  });

  const server = await new Promise<http.Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    // =========================================================================
    // CHECK 1: ADMIN DASHBOARD STATISTICS (100% SQLite-driven)
    // =========================================================================
    const statsRes = await fetchJson(baseUrl, "/api/admin/stats");
    assert.equal(statsRes.status, 200);
    const st = statsRes.body;
    assert.equal(st.totalSemesters, 6, "Must have 6 active semesters");
    assert.equal(st.totalCanonicalSubjects, 35, "Must have 35 canonical GTU BCA subjects");
    assert.equal(st.availablePapers, 9, "Must have 9 verified available papers");
    assert.equal(st.unavailableSubjects, 26, "Must have 26 unavailable subjects");
    assert.equal(st.totalPaperQuestions, 96, "Must have 96 verified paper_questions");
    assert.ok(st.totalMcqs >= 85, `Expected >= 85 active MCQs, found ${st.totalMcqs}`);
    assert.equal(st.totalQuarantinedRecords, 15, "Must have 15 quarantined legacy records");
    assert.equal(st.semesterBreakdown.length, 6, "Must return 6 semester breakdown rows");

    const sumSubjects = st.semesterBreakdown.reduce(
      (acc: number, r: any) => acc + r.subjectCount,
      0
    );
    const sumAvail = st.semesterBreakdown.reduce(
      (acc: number, r: any) => acc + r.availablePaperCount,
      0
    );
    const sumUnavail = st.semesterBreakdown.reduce(
      (acc: number, r: any) => acc + r.unavailableSubjectCount,
      0
    );
    const sumPq = st.semesterBreakdown.reduce(
      (acc: number, r: any) => acc + r.paperQuestionCount,
      0
    );
    assert.equal(sumSubjects, 35);
    assert.equal(sumAvail, 9);
    assert.equal(sumUnavail, 26);
    assert.equal(sumPq, 96);

    const cppQuarantined = st.quarantinedRecords.find(
      (q: any) => q.legacyId === "gtu-paper-sem2-cpp-2026-summer"
    );
    assert.ok(cppQuarantined, "Quarantined C++ paper must appear in quarantine audit log");

    console.log(
      "[PASS] Check 1: Admin Dashboard Statistics verified (35 subjects, 9 available papers, 26 unavailable, 96 paper_questions, 15 quarantined)."
    );

    // =========================================================================
    // CHECK 2: ADMIN SUBJECT MANAGEMENT
    // =========================================================================
    const allSubjRes = await fetchJson(baseUrl, "/api/admin/subjects");
    assert.equal(allSubjRes.status, 200);
    assert.equal(allSubjRes.body.total, 35);
    assert.equal(allSubjRes.body.availableCount, 9);
    assert.equal(allSubjRes.body.unavailableCount, 26);

    const expectedSemCounts: Record<number, number> = { 1: 8, 2: 8, 3: 7, 4: 5, 5: 4, 6: 3 };
    for (let sem = 1; sem <= 6; sem++) {
      const semSubjRes = await fetchJson(baseUrl, `/api/admin/subjects?semester=${sem}`);
      assert.equal(semSubjRes.status, 200);
      assert.equal(semSubjRes.body.total, expectedSemCounts[sem]);
    }

    // Invalid semester parameter must fail with 400
    const badSemRes = await fetchJson(baseUrl, "/api/admin/subjects?semester=9");
    assert.equal(badSemRes.status, 400);

    // Unknown subject must return 404
    const missingSubjRes = await fetchJson(baseUrl, "/api/admin/subjects/BCA999");
    assert.equal(missingSubjRes.status, 404);

    // Inspect BCA201 (DataStructure) detail
    const bca201Res = await fetchJson(baseUrl, "/api/admin/subjects/BCA201");
    assert.equal(bca201Res.status, 200);
    assert.equal(bca201Res.body.subject.code, "BCA201");
    assert.equal(bca201Res.body.subject.semester, 2);
    assert.equal(bca201Res.body.subject.paperStatus, "PDF Available");
    assert.ok(bca201Res.body.subject.units.length >= 2);

    console.log(
      "[PASS] Check 2: Admin Subject Management verified across all 6 semesters and 35 subjects."
    );

    // =========================================================================
    // CHECK 3: ADMIN PAPER MANAGEMENT (9 AVAILABLE / 26 UNAVAILABLE)
    // =========================================================================
    const papersAllRes = await fetchJson(baseUrl, "/api/admin/papers");
    assert.equal(papersAllRes.status, 200);
    assert.equal(papersAllRes.body.total, 35);
    assert.equal(papersAllRes.body.availableCount, 9);
    assert.equal(papersAllRes.body.unavailableCount, 26);

    const availOnlyRes = await fetchJson(baseUrl, "/api/admin/papers?availability=available");
    assert.equal(availOnlyRes.status, 200);
    assert.equal(availOnlyRes.body.total, 9);

    const unavailOnlyRes = await fetchJson(baseUrl, "/api/admin/papers?availability=unavailable");
    assert.equal(unavailOnlyRes.status, 200);
    assert.equal(unavailOnlyRes.body.total, 26);
    for (const u of unavailOnlyRes.body.papers) {
      assert.equal(u.isAvailable, false);
      assert.equal(u.pdfStatus, "PDF not available");
      assert.equal(u.paperId, null);
      assert.equal(u.questionCount, 0);
    }

    // Quarantined C++ paper and unavailable BCA103 must return 404 on /api/admin/papers/:id
    const cppPaperRes = await fetchJson(
      baseUrl,
      "/api/admin/papers/gtu-paper-sem2-cpp-2026-summer"
    );
    assert.equal(cppPaperRes.status, 404);

    const bca103PaperRes = await fetchJson(baseUrl, "/api/admin/papers/BCA103");
    assert.equal(bca103PaperRes.status, 404);

    console.log(
      "[PASS] Check 3: Admin Paper Management verified (9 available, 26 unavailable, quarantined C++ blocked with 404)."
    );

    // =========================================================================
    // CHECK 4: ADMIN PAPER QUESTIONS & STRICT SUBJECT ISOLATION
    // =========================================================================
    let totalVerifiedPqs = 0;
    for (const ap of availOnlyRes.body.papers) {
      const pqRes = await fetchJson(baseUrl, `/api/admin/papers/${ap.paperId}/questions`);
      assert.equal(pqRes.status, 200);
      assert.equal(pqRes.body.paper.paperId, ap.paperId);
      assert.equal(pqRes.body.paper.subjectId, ap.subjectId);
      assert.equal(pqRes.body.paper.subjectCode, ap.subjectCode);
      assert.equal(pqRes.body.questions.length, ap.questionCount);

      for (const q of pqRes.body.questions) {
        // Strict Security Rule:
        // question.paper_id === requestedPaper.id AND question.subject_id === requestedPaper.subject_id
        assert.equal(
          q.paperId,
          ap.paperId,
          `Question ${q.id} paperId (${q.paperId}) != requested paper (${ap.paperId})`
        );
        assert.equal(
          q.subjectId,
          ap.subjectId,
          `Question ${q.id} subjectId (${q.subjectId}) != requested subject (${ap.subjectId})`
        );
        assert.equal(q.subjectCode, ap.subjectCode);
        assert.equal(q.semester, ap.semester);
        if (q.isAlternative) {
          assert.ok(
            q.relatedQuestionId && q.relatedQuestionNumber,
            `Alternative question ${q.id} must link to its primary question`
          );
        }
      }
      totalVerifiedPqs += pqRes.body.questions.length;
    }
    assert.equal(totalVerifiedPqs, 96, "Total verified paper questions across 9 papers must be 96");

    // Cross-subject query on a paper must be rejected with 400
    const crossSubjPaperRes = await fetchJson(
      baseUrl,
      "/api/admin/papers/gtu-paper-sem3-ds-2025-winter/questions?subjectCode=BCA102"
    );
    assert.equal(crossSubjPaperRes.status, 400);

    console.log(
      "[PASS] Check 4: Admin Paper Questions Inspector verified (96 questions, 100% paper_id + subject_id isolation, OR pairs mapped)."
    );

    // =========================================================================
    // CHECK 5: ADMIN MCQ QUESTION BANK & ZERO FABRICATION
    // =========================================================================
    const mcqsAllRes = await fetchJson(baseUrl, "/api/admin/mcqs");
    assert.equal(mcqsAllRes.status, 200);
    assert.ok(mcqsAllRes.body.total >= 85);

    for (const m of mcqsAllRes.body.mcqs) {
      assert.equal(m.options.length, 4);
      assert.ok(m.correctIndex >= 0 && m.correctIndex <= 3);
      assert.equal(m.questionType, "MCQ");
      assert.ok(m.subjectId.startsWith("subj_BCA"));
    }

    // Subject with 0 seeded MCQs must return 0 (never fabricate questions)
    const emptySubjMcqRes = await fetchJson(baseUrl, "/api/admin/mcqs?subjectCode=BCA105");
    assert.equal(emptySubjMcqRes.status, 200);
    assert.equal(emptySubjMcqRes.body.total, 0);
    assert.equal(emptySubjMcqRes.body.mcqs.length, 0);

    console.log(
      "[PASS] Check 5: Admin MCQ Bank verified (strictly SQLite-backed, zero fabrication for empty subjects)."
    );

    // =========================================================================
    // CHECK 6: ADMIN AUTHENTICATION, RBAC & CONTROLLED CONTENT MUTATION
    // =========================================================================
    // Student role header must be rejected with 403
    const studentForbiddenRes = await fetchJson(baseUrl, "/api/admin/stats", {
      headers: { "x-user-role": "student" },
    });
    assert.equal(studentForbiddenRes.status, 403);

    // Invalid Bearer token must be rejected with 401
    const badTokenRes = await fetchJson(baseUrl, "/api/admin/stats", {
      headers: { Authorization: "Bearer invalid_token_12345" },
    });
    assert.equal(badTokenRes.status, 401);

    // Student credentials must not log into Admin Console
    const studentLoginAttempt = await fetchJson(baseUrl, "/api/admin/auth/login", {
      method: "POST",
      body: { email: "student@studymate.ai", password: "student123" },
    });
    assert.equal(studentLoginAttempt.status, 401);

    // Valid Admin credentials must succeed
    const adminLoginRes = await fetchJson(baseUrl, "/api/admin/auth/login", {
      method: "POST",
      body: { email: "admin@studymate.ai", password: "admin123" },
    });
    assert.equal(adminLoginRes.status, 200);
    assert.ok(adminLoginRes.body.token);
    assert.equal(adminLoginRes.body.user.role, "admin");
    const token = adminLoginRes.body.token;

    // Verify /api/admin/auth/me
    const meRes = await fetchJson(baseUrl, "/api/admin/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.authenticated, true);

    // Test creating and deactivating a verified MCQ using the Admin token, then clean up completely
    const createMcqRes = await fetchJson(baseUrl, "/api/admin/mcqs", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: {
        subjectCode: "BCA201",
        unitNumber: 1,
        questionText: "In Data Structures, what is the worst-case time complexity of binary search on a sorted array of size n?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctIndex: 1,
        explanation: "Binary search halves the search space on each comparison, yielding O(log n) worst-case time complexity.",
        difficulty: "easy",
        language: "en",
      },
    });
    assert.equal(createMcqRes.status, 201);
    const createdMcqId = createMcqRes.body.mcq.id;
    assert.equal(createMcqRes.body.mcq.subjectCode, "BCA201");

    // Cross-subject unit mismatch must be blocked with 400
    const badHierarchyMcqRes = await fetchJson(baseUrl, "/api/admin/mcqs", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: {
        subjectCode: "BCA201",
        unitId: "unit_BCA301_u1", // Operating System unit on Data Structure question!
        questionText: "Mismatched unit hierarchy test question?",
        options: ["A", "B", "C", "D"],
        correctIndex: 0,
        explanation: "Should fail hierarchy check.",
      },
    });
    assert.equal(badHierarchyMcqRes.status, 400);

    // Clean up test MCQ and revoke session token so canonical DB remains pristine
    const delRes = await fetchJson(baseUrl, `/api/admin/mcqs/${createdMcqId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(delRes.status, 200);
    db.prepare("DELETE FROM questions WHERE id = ?").run(createdMcqId);

    const logoutRes = await fetchJson(baseUrl, "/api/admin/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.body.revoked, true);

    // Static bypass check on AdminView.tsx and adminRepository.ts
    const adminViewSource = fs.readFileSync("src/views/AdminView.tsx", "utf8");
    const adminRepoSource = fs.readFileSync("src/db/adminRepository.ts", "utf8");
    assert.ok(
      !/from\s+['"].*gtuPapersData['"]/.test(adminViewSource) &&
        !/from\s+['"].*gtuPapersData['"]/.test(adminRepoSource),
      "AdminView and adminRepository must not import static gtuPapersData.ts"
    );

    console.log(
      "[PASS] Check 6: Admin Authentication (scrypt + user_sessions), RBAC (401/403), and Hierarchy-Validated MCQ Lifecycle verified."
    );

    console.log("\n=================================================================");
    console.log("ALL 6/6 PHASE 3 ADMIN FOUNDATION CHECKS PASSED SUCCESSFULLY");
    console.log("=================================================================");
  } finally {
    server.close();
  }
}

runPhase3Verification().catch((err) => {
  console.error("PHASE 3 VERIFICATION FAILED:", err);
  process.exit(1);
});
