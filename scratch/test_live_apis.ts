const BASE_URL = 'https://inner-eye-attendance-system.onrender.com';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  statusCode: number;
  durationMs: number;
  details?: any;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  endpoint: string,
  options: RequestInit = {},
  expectedStatus: number = 200
): Promise<{ ok: boolean; data?: any; status: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const durationMs = Date.now() - start;
    const json = await res.json().catch(() => null);

    const isPass = res.status === expectedStatus;
    results.push({
      name,
      status: isPass ? 'PASS' : 'FAIL',
      statusCode: res.status,
      durationMs,
      details: isPass ? json?.data || json : json?.error || json,
    });

    return { ok: isPass, data: json?.data || json, status: res.status };
  } catch (err: any) {
    results.push({
      name,
      status: 'FAIL',
      statusCode: 0,
      durationMs: Date.now() - start,
      details: err.message,
    });
    return { ok: false, status: 0 };
  }
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`  RUNNING COMPREHENSIVE LIVE API TEST SUITE`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // 1. System Health
  console.log('[1/15] Testing GET /api/health ...');
  await runTest('System Health Check', '/api/health');

  // 2. Employee Authentication
  console.log('[2/15] Testing POST /api/auth/login (Employee) ...');
  const empLogin = await runTest(
    'Employee Authentication',
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        usernameOrEmail: 'aarav.sharma@company.local',
        password: 'EmployeePass123!',
      }),
    },
    200
  );

  const empToken = empLogin.data?.accessToken;
  const empHeaders = empToken ? { Authorization: `Bearer ${empToken}` } : {};

  // 3. Employee Session Check
  console.log('[3/15] Testing GET /api/auth/me (Employee Session) ...');
  await runTest('Employee Session Verification', '/api/auth/me', { headers: empHeaders });

  // 4. Employee Dashboard
  console.log('[4/15] Testing GET /api/me/dashboard ...');
  await runTest('Employee Dashboard Aggregations', '/api/me/dashboard', { headers: empHeaders });

  // 5. Employee Attendance History
  console.log('[5/15] Testing GET /api/me/attendance ...');
  await runTest('Employee Attendance History', '/api/me/attendance', { headers: empHeaders });

  // 6. Employee Leave & Quota Summary
  console.log('[6/15] Testing GET /api/me/leave ...');
  await runTest('Employee Leave Quota & Requests', '/api/me/leave', { headers: empHeaders });

  // 7. Employee Exceptions & Late Explanations
  console.log('[7/15] Testing GET /api/me/exceptions ...');
  await runTest('Employee Late Exceptions Ledger', '/api/me/exceptions', { headers: empHeaders });

  // 8. HR Admin Authentication
  console.log('[8/15] Testing POST /api/auth/login (HR Admin) ...');
  const hrLogin = await runTest(
    'HR Admin Authentication',
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        usernameOrEmail: 'hr.admin@company.local',
        password: 'AdminSecurePass123!',
      }),
    },
    200
  );

  const hrToken = hrLogin.data?.accessToken;
  const hrHeaders = hrToken ? { Authorization: `Bearer ${hrToken}` } : {};

  // 9. HR Operations Dashboard
  console.log('[9/15] Testing GET /api/hr/dashboard ...');
  await runTest('HR Operations Intelligence Dashboard', '/api/hr/dashboard', { headers: hrHeaders });

  // 10. HR Employee Directory
  console.log('[10/15] Testing GET /api/hr/employees ...');
  await runTest('HR Personnel Directory', '/api/hr/employees', { headers: hrHeaders });

  // 11. HR Organization Attendance
  console.log('[11/15] Testing GET /api/hr/attendance ...');
  await runTest('HR Organization Attendance Ledger', '/api/hr/attendance', { headers: hrHeaders });

  // 12. HR Leave Requests Queue
  console.log('[12/15] Testing GET /api/hr/leave ...');
  await runTest('HR Organization Leave Approvals', '/api/hr/leave', { headers: hrHeaders });

  // 13. HR Exceptions Review Queue
  console.log('[13/15] Testing GET /api/hr/exceptions ...');
  await runTest('HR Exceptions Adjudication Queue', '/api/hr/exceptions', { headers: hrHeaders });

  // 14. HR Compliance Audit Log
  console.log('[14/15] Testing GET /api/hr/audit ...');
  await runTest('HR Compliance & Security Audit Stream', '/api/hr/audit', { headers: hrHeaders });

  // 15. HR Live Redis Cache Clear
  console.log('[15/15] Testing POST /api/hr/cache/clear ...');
  await runTest('HR Upstash Redis Cache Purge', '/api/hr/cache/clear', {
    method: 'POST',
    headers: hrHeaders,
  });

  // 16. LangGraph Policy RAG Assistant (Employee)
  console.log('[16/16] Testing POST /api/ai/employee-assistant (LangGraph Agentic RAG) ...');
  await runTest('LangGraph RAG Policy AI Assistant', '/api/ai/employee-assistant', {
    method: 'POST',
    headers: empHeaders,
    body: JSON.stringify({
      question: 'What is the standard grace period for morning check-in?',
    }),
  });

  console.log(`\n======================================================`);
  console.log(`  LIVE API TEST SUITE EXECUTION SUMMARY`);
  console.log(`======================================================\n`);

  let passed = 0;
  for (const r of results) {
    const symbol = r.status === 'PASS' ? '[PASS]' : '[FAIL]';
    console.log(`${symbol.padEnd(8)} | Status: ${r.statusCode} | ${r.durationMs}ms | ${r.name}`);
    if (r.status === 'PASS') passed++;
  }

  console.log(`\nResults: ${passed} Passed, ${results.length - passed} Failed (Total ${results.length} Tests)`);
  console.log(`Live Backend Server: ${BASE_URL}\n`);
}

main().catch(console.error);
