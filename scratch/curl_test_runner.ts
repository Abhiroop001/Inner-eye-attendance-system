import { execSync } from 'child_process';

const BASE_URL = 'https://inner-eye-attendance-system.onrender.com';
const ITERATIONS = 10;

interface Metric {
  name: string;
  endpoint: string;
  passes: number;
  fails: number;
  durations: number[];
  statusCodes: Record<string, number>;
}

const metrics: Record<string, Metric> = {};

function getMetric(name: string, endpoint: string): Metric {
  if (!metrics[name]) {
    metrics[name] = {
      name,
      endpoint,
      passes: 0,
      fails: 0,
      durations: [],
      statusCodes: {},
    };
  }
  return metrics[name];
}

async function runCurl(
  name: string,
  endpoint: string,
  method = 'GET',
  headers: Record<string, string> = {},
  body?: any
): Promise<{ statusCode: number; data?: any }> {
  const metric = getMetric(name, endpoint);
  const start = Date.now();

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const duration = Date.now() - start;
    metric.durations.push(duration);
    const codeStr = String(res.status);
    metric.statusCodes[codeStr] = (metric.statusCodes[codeStr] || 0) + 1;

    const data = await res.json().catch(() => null);

    if (res.status >= 200 && res.status < 300) {
      metric.passes++;
      return { statusCode: res.status, data: data?.data || data };
    } else {
      metric.fails++;
      return { statusCode: res.status, data };
    }
  } catch (err: any) {
    const duration = Date.now() - start;
    metric.durations.push(duration);
    metric.fails++;
    metric.statusCodes['0'] = (metric.statusCodes['0'] || 0) + 1;
    return { statusCode: 0 };
  }
}

async function runSuite() {
  console.log(`\n==============================================================================`);
  console.log(`  STARTING 10-CYCLE MULTI-ENDPOINT cURL TEST SUITE`);
  console.log(`  Host: ${BASE_URL}`);
  console.log(`  Cycles: ${ITERATIONS} Iterations Per Endpoint (Total 160 Requests)`);
  console.log(`==============================================================================\n`);

  for (let i = 1; i <= ITERATIONS; i++) {
    process.stdout.write(`>>> [Cycle ${String(i).padStart(2, '0')}/${ITERATIONS}] Executing 16 API endpoints ... `);

    // 1. Health
    await runCurl('1. Health Check', '/api/health');

    // 2. Employee Login
    const empLogin = await runCurl('2. Employee Login', '/api/auth/login', 'POST', {}, {
      usernameOrEmail: 'aarav.sharma@company.local',
      password: 'EmployeePass123!',
    });
    const empToken = empLogin.data?.accessToken;
    const empHeaders = empToken ? { Authorization: `Bearer ${empToken}` } : {};

    // 3. Employee Session
    await runCurl('3. Employee Session', '/api/auth/me', 'GET', empHeaders);

    // 4. Employee Dashboard
    await runCurl('4. Employee Dashboard', '/api/me/dashboard', 'GET', empHeaders);

    // 5. Employee Attendance History
    await runCurl('5. Employee Attendance History', '/api/me/attendance', 'GET', empHeaders);

    // 6. Employee Leave Quotas
    await runCurl('6. Employee Leave Quotas', '/api/me/leave', 'GET', empHeaders);

    // 7. Employee Exceptions Ledger
    await runCurl('7. Employee Exceptions', '/api/me/exceptions', 'GET', empHeaders);

    // 8. HR Admin Login
    const hrLogin = await runCurl('8. HR Admin Login', '/api/auth/login', 'POST', {}, {
      usernameOrEmail: 'hr.admin@company.local',
      password: 'AdminSecurePass123!',
    });
    const hrToken = hrLogin.data?.accessToken;
    const hrHeaders = hrToken ? { Authorization: `Bearer ${hrToken}` } : {};

    // 9. HR Dashboard
    await runCurl('9. HR Operations Dashboard', '/api/hr/dashboard', 'GET', hrHeaders);

    // 10. HR Employee Directory
    await runCurl('10. HR Employee Directory', '/api/hr/employees', 'GET', hrHeaders);

    // 11. HR Organization Attendance
    await runCurl('11. HR Org Attendance Ledger', '/api/hr/attendance', 'GET', hrHeaders);

    // 12. HR Leave Queue
    await runCurl('12. HR Leave Queue', '/api/hr/leave', 'GET', hrHeaders);

    // 13. HR Exceptions Queue
    await runCurl('13. HR Exceptions Queue', '/api/hr/exceptions', 'GET', hrHeaders);

    // 14. HR Compliance Audit
    await runCurl('14. HR Audit Stream', '/api/hr/audit', 'GET', hrHeaders);

    // 15. HR Redis Cache Flush
    await runCurl('15. HR Redis Cache Flush', '/api/hr/cache/clear', 'POST', hrHeaders);

    // 16. LangGraph Agentic RAG
    await runCurl('16. LangGraph AI Assistant', '/api/ai/employee-assistant', 'POST', empHeaders, {
      question: 'What is the attendance grace period policy?',
    });

    console.log(`[DONE]`);
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n==============================================================================`);
  console.log(`  10-CYCLE MULTI-ENDPOINT TEST RESULTS TELEMETRY`);
  console.log(`==============================================================================\n`);

  let grandTotal = 0;
  let grandPass = 0;

  for (const m of Object.values(metrics)) {
    const total = m.passes + m.fails;
    grandTotal += total;
    grandPass += m.passes;

    const avg = Math.round(m.durations.reduce((a, b) => a + b, 0) / total);
    const min = Math.min(...m.durations);
    const max = Math.max(...m.durations);
    const passRate = ((m.passes / total) * 100).toFixed(1);

    const statusBadge = m.fails === 0 ? '[PASS]' : '[FAIL]';
    console.log(
      `${statusBadge.padEnd(7)} | ${m.name.padEnd(30)} | ${m.passes}/${total} Passed (${passRate}%) | Avg: ${String(avg).padStart(4)}ms (Min: ${String(min).padStart(4)}ms, Max: ${String(max).padStart(4)}ms)`
    );
  }

  console.log(`\n------------------------------------------------------------------------------`);
  console.log(`Total Requests: ${grandTotal} | Passed: ${grandPass} | Failed: ${grandTotal - grandPass} | Success Rate: ${((grandPass / grandTotal) * 100).toFixed(1)}%`);
  console.log(`Target Backend: ${BASE_URL}`);
  console.log(`------------------------------------------------------------------------------\n`);
}

runSuite().catch(console.error);
