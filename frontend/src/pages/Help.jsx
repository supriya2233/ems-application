import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeIndianRupee,
  BellRing,
  ChartColumn,
  ChevronDown,
  CircleCheck,
  CircleAlert,
  LoaderCircle,
  Plane,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'

import EmptyState from '../components/common/EmptyState'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import { useNotifications } from '../components/live/liveEventsContext'
import { API_BASE } from '../services/apiClient'

/*
 * Guides for the workflows this app really has. Each step names
 * the page and the button as they appear on screen.
 */
const GUIDES = [
  {
    id: 'people',
    icon: Users,
    title: 'People and teams',
    summary: 'Add employees, organise departments and see everything about a person in one place.',
    steps: [
      ['Add a department', 'Departments → Add department. Headcount and task numbers are counted for you.', '/departments'],
      ['Add an employee', 'Employees → Add employee. The employee ID is assigned automatically.', '/employees'],
      ['Open a profile', 'Click any name in Employees to see leave, attendance, payslips, assets, documents, reviews, tasks and their timeline.', '/employees'],
      ['Rename safely', 'Editing a name or department updates every module that shows it.', null],
    ],
  },
  {
    id: 'hiring',
    icon: UserPlus,
    title: 'Hire and onboard',
    summary: 'Move candidates through the pipeline, then turn a hire into an employee with a checklist.',
    steps: [
      ['Track candidates', 'Recruitment shows each stage as a column; change a candidate’s stage as they progress.', '/recruitment'],
      ['Hire', 'On a Selected candidate, choose Hire and fill in role, department and joining date. This creates the employee and their onboarding record.', '/recruitment'],
      ['Work the checklist', 'Onboarding lists documents, orientation, equipment and system access with due dates. Overdue steps appear in Approvals.', '/onboarding'],
      ['Go live', 'When every step is done the employee becomes Active automatically.', null],
    ],
  },
  {
    id: 'leave',
    icon: Plane,
    title: 'Leave and attendance',
    summary: 'Requests, approvals, balances and holidays, counted in working days.',
    steps: [
      ['Set the rules', 'Settings → leave allowance per year, company holidays and working days.', '/settings'],
      ['Request leave', 'Leave Management → Request leave. Weekends and holidays are not counted.', '/leave'],
      ['Approve', 'Approvals collects every pending request with the person’s balance and a team-coverage warning.', '/approvals'],
      ['Attendance fills itself', 'Approved leave marks those days as On Leave in Attendance; use Mark attendance for the rest.', '/attendance'],
    ],
  },
  {
    id: 'payroll',
    icon: BadgeIndianRupee,
    title: 'Payroll',
    summary: 'Generate a month in one step; unpaid leave and absences are deducted.',
    steps: [
      ['Generate payroll', 'Payroll → Generate payroll, pick the month. Everyone eligible gets a record.', '/payroll'],
      ['Check deductions', 'Open a record to see how unpaid leave and unexplained absences were calculated.', '/payroll'],
      ['Payslips', 'Print payslip opens a print-ready page; choose “Save as PDF” in the print dialog.', '/payroll'],
    ],
  },
  {
    id: 'offboarding',
    icon: ShieldCheck,
    title: 'Offboarding, documents and assets',
    summary: 'Close out leavers properly and keep compliance records current.',
    steps: [
      ['Start offboarding', 'From the employee’s profile choose Start offboarding. The checklist includes one return item per asset they hold.', '/offboarding'],
      ['Finish', 'Completing the checklist marks them Inactive and returns their assets to Available.', '/offboarding'],
      ['Document expiry', 'Documents past their expiry date are marked Expired; anything expiring within 30 days shows in Approvals.', '/documents'],
      ['Assets', 'Assign and return assets from Assets; each one keeps its assignment history.', '/assets'],
    ],
  },
  {
    id: 'insights',
    icon: ChartColumn,
    title: 'Analytics and reports',
    summary: 'Charts and exportable tables calculated from live records.',
    steps: [
      ['Analytics', 'Choose 3, 6 or 12 months. Every chart has a table view (the grid icon) for exact numbers.', '/analytics'],
      ['Reports', 'Pick a report, set the filters, then Download CSV or Print. The address bar keeps your filters, so you can bookmark a report.', '/reports'],
      ['Activity log', 'Every change is recorded with who, what and when; filter by module or person.', '/activity'],
    ],
  },
  {
    id: 'live',
    icon: BellRing,
    title: 'Notifications and live updates',
    summary: 'Changes appear in every open tab without refreshing.',
    steps: [
      ['The bell', 'The bell in the header shows unread notifications; open Notifications for the full list.', '/notifications'],
      ['Announcements', 'Post news for everyone or one team; pinned posts stay at the top.', '/announcements'],
      ['Live lists', 'When someone else approves leave or edits a record, the page you are on updates by itself.', null],
    ],
  },
]

const FAQS = [
  ['Why does a leave request show fewer days than the dates suggest?', 'Leave is counted in working days. Weekends and the holidays listed in Settings are skipped.'],
  ['Why is someone “On Leave” on the Employees page?', 'Status follows approved leave automatically. It is checked when the server starts and every hour after that.'],
  ['Can I undo a delete?', 'No. Deletes ask for confirmation first and are recorded in the Activity log.'],
  ['Who is “Administrator” in the activity log?', 'This app has no sign-in yet, so every change is attributed to the Administrator.'],
  ['How do I get data into a spreadsheet?', 'Open Reports, choose a report and filters, then Download CSV. Amounts are plain numbers so formulas work.'],
  ['The page says it is offline.', 'The live connection to the server dropped. Check the status card on this page; the app reconnects by itself once the server is reachable.'],
]

const matches = (text, term) => text.toLowerCase().includes(term)

function Help() {
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()

  const guides = useMemo(() => {
    if (!term) return GUIDES
    return GUIDES.map((guide) => {
      if (matches(`${guide.title} ${guide.summary}`, term)) return guide
      const steps = guide.steps.filter(([title, text]) => matches(`${title} ${text}`, term))
      return steps.length ? { ...guide, steps } : null
    }).filter(Boolean)
  }, [term])

  const faqs = useMemo(
    () => (term ? FAQS.filter(([q, a]) => matches(`${q} ${a}`, term)) : FAQS),
    [term],
  )

  return (
    <div className="help-page">
      <section className="help-hero">
        <PageHeader
          eyebrow="Help & Support"
          title="How can we help?"
          description="Short guides to every workflow in this workspace, plus a live check of the system."
        />
        <SearchBar value={search} onChange={setSearch} placeholder="Search guides, e.g. payslip, holidays, hire" label="Search help" />
      </section>

      <div className="help-layout">
        <div className="help-main">
          {!guides.length && !faqs.length ? (
            <section className="ui-card">
              <EmptyState title="No guide matches that" description="Try a page name such as Payroll, Leave or Recruitment." />
            </section>
          ) : (
            <>
              {guides.length > 0 && (
                <div className="help-guides">
                  {guides.map((guide) => (
                    <Guide key={guide.id} guide={guide} />
                  ))}
                </div>
              )}

              {faqs.length > 0 && (
                <section className="ui-card help-faq" aria-labelledby="faq-title">
                  <h2 id="faq-title">Common questions</h2>
                  {faqs.map(([question, answer]) => (
                    <details key={question}>
                      <summary>
                        {question}
                        <ChevronDown size={16} aria-hidden="true" />
                      </summary>
                      <p>{answer}</p>
                    </details>
                  ))}
                </section>
              )}
            </>
          )}
        </div>

        <aside className="help-side">
          <SystemStatus />
        </aside>
      </div>
    </div>
  )
}

function Guide({ guide }) {
  const Icon = guide.icon

  return (
    <section className="help-guide" aria-labelledby={`guide-${guide.id}`}>
      <header>
        <span className="help-guide-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <div>
          <h2 id={`guide-${guide.id}`}>{guide.title}</h2>
          <p>{guide.summary}</p>
        </div>
      </header>

      <ol>
        {guide.steps.map(([title, text, link]) => (
          <li key={title}>
            <strong>{title}</strong>
            <span>{text}</span>
            {link && <Link to={link}>Open</Link>}
          </li>
        ))}
      </ol>
    </section>
  )
}

function SystemStatus() {
  const { status } = useNotifications()
  const [api, setApi] = useState({ state: 'checking' })
  const [checkKey, setCheckKey] = useState(0)

  useEffect(() => {
    let ignore = false
    const started = performance.now()

    fetch(`${API_BASE}/health`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        if (!ignore) setApi({ state: 'ok', ms: Math.round(performance.now() - started), at: new Date() })
      })
      .catch(() => {
        if (!ignore) setApi({ state: 'down', at: new Date() })
      })

    return () => {
      ignore = true
    }
  }, [checkKey])

  const recheck = () => {
    setApi({ state: 'checking' })
    setCheckKey((key) => key + 1)
  }

  const rows = [
    {
      label: 'API server',
      state: api.state,
      detail: api.state === 'ok' ? `Responding in ${api.ms} ms` : api.state === 'down' ? 'Not reachable' : 'Checking…',
    },
    {
      label: 'Live updates',
      state: status === 'live' ? 'ok' : status === 'offline' ? 'down' : 'checking',
      detail: status === 'live' ? 'Connected' : status === 'offline' ? 'Disconnected, retrying' : 'Connecting…',
    },
  ]

  return (
    <section className="ui-card help-status" aria-labelledby="status-title" aria-live="polite">
      <div className="help-status-header">
        <h2 id="status-title">System status</h2>
        <button type="button" className="help-recheck" onClick={recheck} aria-label="Check again" title="Check again">
          <RefreshCw size={15} aria-hidden="true" />
        </button>
      </div>

      <ul>
        {rows.map((row) => (
          <li key={row.label}>
            <StatusIcon state={row.state} />
            <span>
              <strong>{row.label}</strong>
              <small>{row.detail}</small>
            </span>
          </li>
        ))}
      </ul>

      {api.at && (
        <p className="help-status-time">
          Checked at {api.at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
        </p>
      )}

      {api.state === 'down' && (
        <p className="help-status-hint">
          Start the backend with <code>npm run dev</code> in the <code>backend</code> folder and make sure MongoDB is running.
        </p>
      )}
    </section>
  )
}

function StatusIcon({ state }) {
  if (state === 'ok') return <CircleCheck className="status-ok" size={18} aria-label="Working" />
  if (state === 'down') return <CircleAlert className="status-down" size={18} aria-label="Problem" />
  return <LoaderCircle className="status-checking" size={18} aria-label="Checking" />
}

export default Help
