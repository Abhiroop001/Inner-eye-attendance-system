# Evaluation & Interactive Demo Script

## 1. Pre-Configured Evaluation Credentials

| Role | Username / Email | Password | Scope |
|---|---|---|---|
| **HR Administrator** | `hr.admin@company.local` | `AdminSecurePass123!` | Full HR Operations & Security Console |
| **Employee 1** | `aarav.sharma@company.local` | `EmployeePass123!` | Engineering Lead Portal |
| **Employee 2** | `priya.patel@company.local` | `EmployeePass123!` | Product Manager Portal |
| **Employee 3** | `rohit.verma@company.local` | `EmployeePass123!` | Security Engineer Portal |

---

## 2. Step-by-Step Verification Walkthrough

### Scenario A: Employee Daily Attendance & Exception Workflow
1. Navigate to `/login` and select the **Employee Login** button (pre-fills `aarav.sharma@company.local`).
2. Click **Authenticate & Sign In** $\rightarrow$ lands on `/employee/dashboard`.
3. Review the **Live Punch Clock Terminal**. Click **Check-In for Today** to record an active session.
4. If checking in late, observe the **Late Check-In Alert Banner**.
5. Click **Submit Reason**, choose a category (e.g. `Traffic / Transit Delay`), enter explanation, and attach an optional PDF document.
6. Submit and observe the state transition to `UNDER_REVIEW`.

### Scenario B: AI Grounded Policy Assistant
1. Click the **AI Policy Assistant** button in the top navbar to open the slide-over drawer.
2. Click one of the quick prompts (e.g., *"What is the grace period for check-in?"*).
3. Verify that the assistant responds with an accurate answer and cites `01_attendance_policy.md` and `04_working_hours_policy.md`.

### Scenario C: HR Operations & Adjudication Queue
1. Log out and sign in as **HR Administrator** (`hr.admin@company.local`).
2. Open `/hr/dashboard` to inspect live workforce metrics, 7-day attendance trends, and the **LangGraph Workforce Intelligence** synthesis card.
3. Open `/hr/exceptions` to view pending late arrival submissions.
4. Click **Adjudicate**, review the AI advisory recommendation, enter reviewer comments, and click **Confirm Decision**.
5. Open `/hr/leave` to adjudicate pending leave requests. Click **Approve** to execute deterministic balance deductions.
6. Open `/hr/audit` to view the immutable compliance stream capturing all recent operations.

### Scenario D: Authoritative Employee Provisioning & One-Time Activation
1. In HR Console, go to `/hr/employees` and click **Provision New Employee**.
2. Create employee `EMP-1030` (`kavita.nair@company.local`).
3. Log out and navigate to `/register`.
4. Enter `kavita.nair@company.local` and `EMP-1030`, then click **Submit Activation Request**.
5. In development mode, click the generated **Development Activation Link** to open `/activate`.
6. Set permanent username and password, then sign in with the new credentials.
