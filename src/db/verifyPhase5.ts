import crypto from 'node:crypto';
import { getDatabase } from './connection.js';
import { computeSha256Hex } from './hash.js';

const BASE_URL = 'http://127.0.0.1:3000';

async function runPhase5Verification() {
  console.log('==================================================================');
  console.log('PHASE 5 VERIFICATION: ADMIN STUDENT ACCOUNT MANAGEMENT (LIVE E2E)');
  console.log('==================================================================');

  const db = getDatabase();

  // Step 1: Unauthenticated access blocked
  console.log('\n[1/8] Verifying unauthenticated and unauthorized access control...');
  const unauthRes = await fetch(`${BASE_URL}/api/admin/students`);
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
  }
  console.log('  -> PASS: Unauthenticated GET /api/admin/students returned 401.');

  // Step 2: Register a student and verify student cannot access admin student endpoints
  console.log('\n[2/8] Verifying student role cannot access admin endpoints (RBAC)...');
  const testStudentEmail = `phase5_verify_${Date.now()}@gtu.ac.in`;
  const initialPassword = 'InitialPass#123';

  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Phase 5 Test Student',
      email: testStudentEmail,
      password: initialPassword,
      semester: 3,
      branch: 'BCA',
    }),
  });

  const regData = await regRes.json();
  if (!regRes.ok || !regData.token) {
    throw new Error(`Failed to register test student: ${JSON.stringify(regData)}`);
  }
  const studentToken = regData.token;
  const studentId = regData.user.id;
  console.log(`  -> Registered test student: ${testStudentEmail} (id: ${studentId})`);

  // Student attempts to call /api/admin/students
  const studentForbiddenRes = await fetch(`${BASE_URL}/api/admin/students`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (studentForbiddenRes.status !== 403 && studentForbiddenRes.status !== 401) {
    throw new Error(`Expected 401 or 403 for student token on admin route, got ${studentForbiddenRes.status}`);
  }
  console.log(`  -> PASS: Student token access rejected with HTTP ${studentForbiddenRes.status}.`);

  // Step 3: Admin Session Token for Live HTTP API Tests
  console.log('\n[3/8] Verifying Admin Authentication & Retrieval of Student Directory...');
  const adminUserRow = db.prepare("SELECT id, email, name FROM users WHERE role = 'admin' LIMIT 1").get() as {
    id: string;
    email: string;
    name: string;
  };
  if (!adminUserRow) {
    throw new Error('No administrator account found in SQLite users table');
  }

  const rawAdminToken = `test_p5_adm_${crypto.randomBytes(24).toString('hex')}`;
  const tokenHash = computeSha256Hex(rawAdminToken);
  const sessionId = `sess_p5_verify_${Date.now()}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(sessionId, adminUserRow.id, tokenHash, expiresAt);

  console.log(`  -> Provisioned temporary test session for verified admin (${adminUserRow.email}).`);

  try {
    // Step 4: GET /api/admin/students
    console.log('\n[4/8] Verifying GET /api/admin/students data hygiene and security...');
    const studentsListRes = await fetch(`${BASE_URL}/api/admin/students?page=1&pageSize=20`, {
      headers: { Authorization: `Bearer ${rawAdminToken}` },
    });
    if (!studentsListRes.ok) {
      throw new Error(`Failed to fetch students list: ${studentsListRes.status}`);
    }
    const listData = await studentsListRes.json();

    if (!Array.isArray(listData.students)) {
      throw new Error('Expected students array in response');
    }
    if (!listData.metrics || typeof listData.metrics.totalStudents !== 'number') {
      throw new Error('Expected metrics object in response');
    }

    // Strict Security audit of payload:
    for (const st of listData.students) {
      if ('password_hash' in st || 'password' in st) {
        throw new Error(`SECURITY ALERT: password_hash exposed in student record: ${st.id}`);
      }
      if ('session_token' in st || 'token' in st) {
        throw new Error(`SECURITY ALERT: session token exposed in student record: ${st.id}`);
      }
      if (st.email.toLowerCase() === adminUserRow.email.toLowerCase()) {
        throw new Error(`SECURITY ALERT: Admin account appeared in student directory!`);
      }
    }
    console.log(`  -> PASS: ${listData.students.length} students retrieved. Zero password hashes or admin accounts exposed.`);
    console.log(`  -> Metrics: Total=${listData.metrics.totalStudents}, Active=${listData.metrics.activeStudents}, Inactive=${listData.metrics.inactiveStudents}`);

    // Step 5: Search & Semester Filtering
    console.log('\n[5/8] Verifying server-side search and semester filtering...');
    const searchRes = await fetch(`${BASE_URL}/api/admin/students?search=${encodeURIComponent(testStudentEmail)}`, {
      headers: { Authorization: `Bearer ${rawAdminToken}` },
    });
    const searchData = await searchRes.json();
    const foundStudent = searchData.students.find((s: any) => s.id === studentId);
    if (!foundStudent) {
      throw new Error('Search by email failed to find test student');
    }
    console.log(`  -> PASS: Search by email successfully returned student ${testStudentEmail}.`);

    const semFilterRes = await fetch(`${BASE_URL}/api/admin/students?semester=3`, {
      headers: { Authorization: `Bearer ${rawAdminToken}` },
    });
    const semFilterData = await semFilterRes.json();
    const allSem3 = semFilterData.students.every((s: any) => s.semester === 3);
    if (!allSem3 && semFilterData.students.length > 0) {
      throw new Error('Semester filter returned non-semester-3 student');
    }
    console.log(`  -> PASS: Semester filtering verified (all ${semFilterData.students.length} returned are Sem 3).`);

    // Step 6: Deactivation & Reactivation Lifecycle
    console.log('\n[6/8] Verifying student account deactivation & reactivation lifecycle...');
    // Deactivate
    const deactRes = await fetch(`${BASE_URL}/api/admin/students/${studentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawAdminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    const deactData = await deactRes.json();
    if (!deactRes.ok || deactData.student?.isActive !== false) {
      throw new Error(`Failed to deactivate student: ${JSON.stringify(deactData)}`);
    }
    console.log('  -> PASS: Account status changed to inactive.');

    // Inactive student tries to log in
    const blockedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        password: initialPassword,
      }),
    });
    if (blockedLoginRes.status !== 403 && blockedLoginRes.status !== 400) {
      throw new Error(`Expected login to be rejected for inactive student, got ${blockedLoginRes.status}`);
    }
    console.log(`  -> PASS: Inactive student login blocked with status ${blockedLoginRes.status}.`);

    // Inactive student's existing session token must fail verification
    const sessionCheckRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (sessionCheckRes.status !== 401 && sessionCheckRes.status !== 403) {
      throw new Error(`Expected revoked session to fail with 401/403, got ${sessionCheckRes.status}`);
    }
    console.log('  -> PASS: Active sessions immediately invalidated upon deactivation.');

    // Reactivate
    const reactRes = await fetch(`${BASE_URL}/api/admin/students/${studentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawAdminToken}`,
      },
      body: JSON.stringify({ isActive: true }),
    });
    const reactData = await reactRes.json();
    if (!reactRes.ok || reactData.student?.isActive !== true) {
      throw new Error(`Failed to reactivate student: ${JSON.stringify(reactData)}`);
    }
    console.log('  -> PASS: Account status restored to active.');

    // Active student logs in successfully
    const reactLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        password: initialPassword,
      }),
    });
    if (!reactLoginRes.ok) {
      throw new Error(`Reactivated student could not log in: ${reactLoginRes.status}`);
    }
    console.log('  -> PASS: Reactivated student can log in with initial password.');

    // Step 7: Password Reset
    console.log('\n[7/8] Verifying admin password reset and session invalidation...');
    const newPassword = 'NewSecurePass#9876';

    // Weak password rejected
    const weakResetRes = await fetch(`${BASE_URL}/api/admin/students/${studentId}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawAdminToken}`,
      },
      body: JSON.stringify({ newPassword: '123' }),
    });
    if (weakResetRes.status !== 400) {
      throw new Error(`Expected 400 for weak password reset, got ${weakResetRes.status}`);
    }
    console.log('  -> PASS: Weak password (< 6 chars) rejected with 400.');

    // Valid password reset
    const resetRes = await fetch(`${BASE_URL}/api/admin/students/${studentId}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawAdminToken}`,
      },
      body: JSON.stringify({ newPassword }),
    });
    const resetData = await resetRes.json();
    if (!resetRes.ok || !resetData.success) {
      throw new Error(`Failed to reset password: ${JSON.stringify(resetData)}`);
    }
    console.log('  -> PASS: Password reset succeeded with safe response.');

    // Old password must fail
    const oldPassLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        password: initialPassword,
      }),
    });
    if (oldPassLoginRes.status !== 401) {
      throw new Error(`Expected 401 when logging in with old password, got ${oldPassLoginRes.status}`);
    }
    console.log('  -> PASS: Login with old password rejected.');

    // New password must succeed
    const newPassLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        password: newPassword,
      }),
    });
    if (!newPassLoginRes.ok) {
      throw new Error(`Login with new password failed: ${newPassLoginRes.status}`);
    }
    console.log('  -> PASS: Login with new reset password succeeded.');

    // Step 8: Safety boundary tests (admin account protection)
    console.log('\n[8/8] Verifying admin accounts cannot be modified via student endpoints...');
    const adminStatusTamper = await fetch(`${BASE_URL}/api/admin/students/${adminUserRow.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawAdminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    if (adminStatusTamper.status !== 400) {
      throw new Error(`Expected 400 when attempting to modify admin status, got ${adminStatusTamper.status}`);
    }
    console.log('  -> PASS: Attempt to deactivate admin account rejected with 400 (NOT_A_STUDENT).');

    const adminResetTamper = await fetch(`${BASE_URL}/api/admin/students/${adminUserRow.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawAdminToken}`,
      },
      body: JSON.stringify({ newPassword: 'AttemptTamper#123' }),
    });
    if (adminResetTamper.status !== 400) {
      throw new Error(`Expected 400 when attempting to reset admin password via student route, got ${adminResetTamper.status}`);
    }
    console.log('  -> PASS: Attempt to reset admin password via student endpoint rejected with 400.');

    console.log('\n==================================================================');
    console.log('ALL 8/8 PHASE 5 LIVE VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    console.log('==================================================================\n');
  } finally {
    // Cleanup temporary test admin session and test student account
    db.prepare('DELETE FROM user_sessions WHERE id = ?').run(sessionId);
    db.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(studentId);
    db.prepare('DELETE FROM users WHERE id = ?').run(studentId);
    console.log('  -> Cleaned up test session and student database records.');
  }
}

runPhase5Verification().catch((err) => {
  console.error('\n[FAIL] Phase 5 verification failed:', err);
  process.exit(1);
});
