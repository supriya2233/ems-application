# EMS: connected HR operations, hire to retire

A full-stack HR system built with **React + Vite**, **Node.js + Express** and **MongoDB**.
It covers the whole employee lifecycle (hiring, onboarding, leave, payroll, offboarding) as
**one connected workflow**, not separate forms. Every change is recorded, notified and pushed
live to every open browser tab.

## The problem

Small HR teams often keep people data in separate tools or spreadsheets: one for leave,
one for payroll, one for hiring. Nothing talks to anything else:

- Approving leave doesn't update attendance or the payroll.
- A hired candidate has to be typed in again as an employee.
- Nobody notices that a passport expires next month.
- Headcounts are typed by hand and drift from reality.

EMS started like that: eleven separate CRUD screens. It was rebuilt so that **one action
updates everything it affects**, and the dashboard always tells the truth.

## What it does

| Area | What happens |
|---|---|
| **Hire** | Recruitment board (drag candidates through stages). **Hire** creates the employee, an onboarding checklist with due dates, and links the candidate. No retyping. |
| **Onboard** | Checklist status follows the ticks. Hand over a laptop from the equipment step. Overdue steps raise reminders. Finishing makes the employee **Active**. |
| **Leave** | Days are counted as working days (weekends and company holidays skipped). Balances per type, overlap checks, and a team-coverage warning. Approval fills attendance; cancelling removes it. Employee status switches to *On Leave* automatically. |
| **Approvals** | One inbox: pending leave, overdue onboarding steps, expiring or expired documents, and documents to verify. |
| **Payroll** | **Generate payroll** for a month in one click. Deductions for unpaid leave and unexplained absences are shown per line. Leavers get a pro-rated final month. Payslips print to PDF from the browser. |
| **Offboard** | Checklist built from what the person holds: one "return asset" item per laptop or phone, plus exit interview, handover, archive and final settlement. Completing it makes them **Inactive** and frees their assets. |
| **Documents & assets** | Expiry tracking with 30-day warnings. Asset assign and return with full history (who, when, condition). |
| **Employee 360°** | One page per person: details, leave balances, attendance, payslips, assets, documents, reviews, tasks and their personal activity timeline. |
| **Dashboard** | "Needs your attention" links, today at a glance (who's off, joining and leaving), approvals waiting, task progress and a live activity feed. |
| **Activity log** | Every change ("Approved Priya Sharma's 3 days of Casual leave"), filterable by module, employee, date and words, with cursor-based paging. |
| **Live updates** | Approve something in one tab and the bell, toasts, dashboard and lists update in every other tab within a second. |

Also included: Departments (counts calculated from real data, never typed), Tasks
(board with drag-and-drop or a list), Attendance (per-day sheet), Performance reviews,
a Calendar (holidays, leave, joining dates) and Settings (leave allowances, holidays, working days).

> Analytics, Announcements, Reports and Help are styled screens using **sample data**; they
> are not connected to the API yet.

## Architecture

```text
 Browser (React + Vite)                         Server (Express)                     MongoDB
 ─────────────────────                          ────────────────                     ───────
 pages/ ─► services/*.js ── REST (JSON) ──────► routes ─► controllers ─► services ─► models
   ▲                                                                       │
   │                                                                       ▼ publish("leave.approved")
   │                                                           events.js (Node EventEmitter)
   │                                                            │           │            │
   │                                                     ActivityLog   Notification   liveStream
   └──────── Server-Sent Events  (GET /api/stream) ◄────────────────────────────────────┘

 jobs.js: every hour (setInterval): leave → employee status, overdue onboarding steps, document expiry
```

**Key ideas**

- **Business rules live in `backend/src/services/`.** Controllers only translate HTTP.
  Pure rule files (`leaveRules.js`, `payrollRules.js`, `onboardingRules.js`, …) have no
  database access, so they are unit-tested directly.
- **Domain events.** A service announces what happened (`publish('leave.approved', …)`).
  Listeners turn that into an activity entry, a notification and a live push. The leave
  code doesn't know notifications exist.
- **Live updates with Server-Sent Events.** Built into browsers and Express, so there is no
  WebSocket library. Pages subscribe with `useLiveRefresh(['leave', 'employees'])`.
- **One source of truth for people.** Records keep the business key (`EMP004`) plus a copy of
  the name and department for fast lists. The server fills these copies in and updates them
  when an employee is renamed or moves department.
- **IDs from the server** (`EMP-`, `TSK-`, `DOC-`, …) using an atomic counter, so deleting
  a record never causes a duplicate ID.
- **Scheduled jobs with Node timers.** They run once at start-up, then hourly.
- **No new dependencies.** Backend runtime: `express`, `mongoose`, `cors`, `dotenv`.
  Frontend: `react`, `react-router-dom`, `lucide-react`. Tests use Node's built-in `node --test`.
- **Frontend:** a small UI kit (`components/common/`: Button, Modal, DataTable, toasts,
  confirm dialog, EmployeePicker…) following [`docs/design-system.md`](docs/design-system.md).
  Pages are code-split with `React.lazy`.

## Run it locally

Requirements: **Node.js 20+** and **MongoDB** running on `127.0.0.1:27017`.

```bash
# 1. Backend
cd backend
npm install
# create backend/.env with:
#   PORT=5000
#   MONGO_URI=mongodb://127.0.0.1:27017/ems
npm run dev            # http://localhost:5000/api/health

# 2. Frontend (second terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

The frontend calls `http://localhost:5000/api` by default. Set `VITE_API_URL` to point it elsewhere.

There is **no login**: every action is recorded as "Administrator".

### Demo data (separate database)

A ready-made company with 16 people in 6 departments and three weeks of history (leave,
attendance, two payroll months, hires, an expiring passport, someone leaving). It goes into
its **own database, `ems_demo`**, and never touches `ems`. The script refuses any database
whose name doesn't contain "demo".

```bash
cd backend
npm run seed:demo      # (re)builds ems_demo through the real API; safe to run again
npm run demo           # demo backend on http://localhost:5055

cd frontend
npm run dev:demo       # frontend wired to the demo backend (.env.demo)
```

## Tests

```bash
cd backend  && npm test      # 61 unit tests: leave day counting, balances, payroll maths,
                             # onboarding/offboarding status, document expiry, IDs, activity paging
cd frontend && npm run lint && npm run build
```

Each phase was also checked in a headless browser: every route at desktop and phone
width (no JavaScript errors, no sideways scrolling), plus end-to-end scenarios such as
"apply → approve → attendance, calendar and balance update".

## 3-minute demo script

Use the demo data (`npm run seed:demo`). Open the app in **two browser windows** side by side.

1. **Dashboard (20 s).** "Needs your attention" summarises the work. *Today at a glance*
   shows who's off, who's joining and who's leaving. Point at the live activity feed.
2. **Hire (40 s).** Recruitment → drag a card to another stage. On **Riya Bose** (Selected)
   click **Hire** → pick a joining date → save. Open Onboarding: her checklist exists with
   due dates. In the second window the bell rings and the dashboard's "people onboarding"
   count changes by itself.
3. **Leave (40 s).** Approvals → **Ananya Rao's** Annual leave shows "After approval: 15 left" →
   **Approve**. Then show the effects: her 360° profile balance, the days filled in
   Attendance, and the leave on the Calendar. One click, four modules updated.
4. **Payroll (30 s).** Payroll → October: Fatima's line shows "2 unpaid leave" and Arjun's
   "1 absent", deducted automatically. Open a row (**View**) → **Print payslip** for a PDF.
5. **Offboard (30 s).** Offboarding → **Aditya Kulkarni**: a "Return … laptop" item was added
   because he holds one. Tick the items ("Final settlement" creates his pro-rated last
   payslip). On the last tick he becomes Inactive and the laptop is Available again
   (check Assets → history).
6. **Audit (20 s).** Activity log → filter *Employee: Aditya Kulkarni* → his whole story,
   newest first. "Every change is traceable, and nothing here needed a page refresh."

Talking points if asked: why events instead of direct calls, why SSE instead of WebSockets,
how copies of names are kept consistent, and why business rules are pure functions with tests.

## Project structure

```text
backend/
  src/
    server.js            Express app, routes, live stream, jobs
    models/              Mongoose schemas (Employee, Leave, Payroll, Offboarding, ActivityLog, …)
    controllers/         HTTP in/out
    services/            business rules, events, listeners, live stream, scheduled jobs
    middleware/          central error handler
  scripts/               repair-data (one-off), seed-demo, demo-server
  test/                  node --test unit tests
frontend/
  src/
    pages/               one file per screen (lazy-loaded)
    components/          common UI kit + feature components (tasks, activity, payroll, …)
    services/            API calls (apiClient.js holds the base URL)
    utils/               formatting and small pure helpers
    styles/              design tokens, layout, kit and feature CSS
docs/
  design-system.md       colours, type, spacing and components
```

## Known limitations

- No authentication or roles. This was a deliberate scope decision; all actions are "Administrator".
- "Today" is the server's local calendar day. If the server runs in another time zone than
  its users (most cloud hosts use UTC), start it with e.g. `TZ=Asia/Kolkata`.
- Live updates assume a single server process (events are in memory).
- Analytics, Announcements, Reports and Help still show sample data.
