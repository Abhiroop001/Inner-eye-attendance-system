---
document_id: faq-attendance-v1
version: "1.0"
document_type: faq
title: Frequently Asked Questions - Attendance, Leave, and Exception Workflows
sensitivity: internal
effective_from: "2026-01-01"
effective_to: "2027-12-31"
access_scope:
  - EMPLOYEE
  - HR
---

# Frequently Asked Questions: Attendance, Leave, and Exception Workflows

### Q1: What is the official daily check-in grace period?
**A**: The official grace period is 15 minutes from your scheduled shift start time. For a 09:00 AM shift, check-ins up to 09:15:00 AM are classified as on-time (`PRESENT`). Check-ins at 09:15:01 AM or later are classified as `LATE`.

### Q2: How are late minutes calculated?
**A**: Late minutes are calculated as $\max(0, \text{Actual CheckIn} - \text{Scheduled Start} - \text{Grace Minutes})$. For instance, checking in at 09:30 AM results in $30 - 15 = 15$ late minutes.

### Q3: What happens if I forget to check out at the end of the day?
**A**: If you do not record a checkout by 23:59:59 local time, the session is marked as `INCOMPLETE_SESSION`. You should contact HR or submit a punch correction request in the portal with supervisor verification.

### Q4: Can I check in more than once in a single day?
**A**: No. The system allows exactly one active attendance session per calendar business day. Duplicate check-ins will be rejected with a conflict error.

### Q5: How do I submit an explanation for late arrival?
**A**: Navigate to your Employee Dashboard, find the Late Arrival notification card, select a reason category (e.g., `TRAFFIC_TRANSIT`, `MEDICAL`), write a detailed description, attach any supporting receipts or certificates, and click Submit.

### Q6: When is a supporting document mandatory for late arrival?
**A**: Supporting documentation is mandatory if your lateness exceeds 60 minutes or if the reason category is `MEDICAL`.

### Q7: What formats and sizes are permitted for document uploads?
**A**: Permitted formats are PDF (`.pdf`), JPEG (`.jpg`, `.jpeg`), and PNG (`.png`). The maximum allowed file size is 10 MB per file.

### Q8: How many days of Casual Leave (CL) do I receive each year?
**A**: Full-time employees receive 18 days of Casual / Privilege Leave annually, accrued at 4.5 days per quarter.

### Q9: How many days of Sick Leave (SL) are allocated?
**A**: Employees receive 12 days of Sick Leave per calendar year credited on January 1st.

### Q10: Do weekends count toward leave deductions?
**A**: No. If you take leave from Friday to Monday on a standard 5-day work schedule, exactly 2 days of leave balance will be deducted, excluding Saturday and Sunday.

### Q11: How is a Half-Day computed?
**A**: Working between 210 and 359 net minutes (3.5 to 6 hours) is classified as a Half-Day. 0.5 days of leave balance will be deducted if you apply for half-day absence.

### Q12: How is overtime calculated?
**A**: Overtime is calculated as net working minutes beyond the scheduled 420 minutes (7 net hours). An employee must work at least 30 excess minutes to accrue eligible overtime.

### Q13: How does employee registration work?
**A**: HR creates your employee profile first. Once provisioned, you submit a Registration Request using your official work email and employee ID. You will receive a single-use 15-minute activation challenge to set your password.

### Q14: Can an activated employee register again?
**A**: No. Registration is a strictly one-time activation process. Once your account is active, you must log in using your established credentials.

### Q15: What should I do if my activation token expires?
**A**: If the 15-minute activation window lapses, you may submit a new Registration Request or contact HR to re-issue an activation challenge.

### Q16: Is Multi-Factor Authentication (MFA) required?
**A**: MFA is mandatory for all HR Administrator accounts using standard authenticator apps (TOTP). It is optional but recommended for general employees.

### Q17: Who reviews my late reason submissions?
**A**: Your submitted late reasons and attached supporting documents are reviewed and adjudicated by the HR Department and your assigned Reporting Manager.

### Q18: What are the acceptable late reason categories?
**A**: The standard categories are `MEDICAL`, `TRAFFIC_TRANSIT`, `FAMILY_EMERGENCY`, `CLIENT_MEETING`, `TECHNICAL_GLITCH`, and `OTHER`.

### Q19: Where can I view my leave balance?
**A**: You can view your real-time available, consumed, and pending leave balances directly on the Employee Dashboard or Leave Management page.

### Q20: What happens if I work on a declared public holiday?
**A**: Working on an official holiday qualifies as `OVERTIME_HOLIDAY` and gives 1.5x compensatory credit upon managerial approval.
