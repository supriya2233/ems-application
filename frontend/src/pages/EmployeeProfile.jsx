import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Laptop,
  ListChecks,
  LogOut,
  Mail,
  Phone,
  Star,
  Wallet,
} from 'lucide-react'

import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import LeaveBalances from '../components/leave/LeaveBalances'
import StartOffboardingModal from '../components/offboarding/StartOffboardingModal'
import EmptyState from '../components/common/EmptyState'
import { getEmployeeOverview } from '../services/employeeService'
import { useLiveEvents } from '../components/live/liveEventsContext'
import { getAvatarColor, getInitials } from '../utils/avatar'

/*
 * Employee 360°: one page with everything about a person.
 * All data comes from a single request: GET /api/employees/:id/overview
 */

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

/* A titled box with a link to the full module page */
function Section({ title, icon: Icon, to, linkLabel, count, children }) {
  return (
    <section className="p360-section" aria-labelledby={`p360-${title}`}>
      <header className="p360-section-header">
        <h2 id={`p360-${title}`}>
          <Icon size={16} aria-hidden="true" />
          {title}
          {count !== undefined && <span className="p360-count">{count}</span>}
        </h2>

        {to && (
          <Link to={to} className="p360-section-link">
            {linkLabel}
          </Link>
        )}
      </header>

      {children}
    </section>
  )
}

/* Rows of "main text / secondary text / badge" */
function RecordList({ items, empty, render }) {
  if (items.length === 0) {
    return <p className="p360-empty">{empty}</p>
  }

  return <ul className="p360-list">{items.map(render)}</ul>
}

function Row({ title, meta, badge, aside }) {
  return (
    <li className="p360-row">
      <div className="p360-row-text">
        <strong>{title}</strong>
        {meta && <span>{meta}</span>}
      </div>
      {aside && <span className="p360-row-aside">{aside}</span>}
      {badge && <Badge>{badge}</Badge>}
    </li>
  )
}

function EmployeeProfile() {
  const { employeeId } = useParams()

  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showOffboard, setShowOffboard] = useState(false)
  const navigate = useNavigate()

  // Something about this person changed (here or in another tab):
  // fetch the overview again without showing the loading state.
  useLiveEvents((event) => {
    if (event.employeeId !== employeeId) return
    getEmployeeOverview(employeeId)
      .then(setOverview)
      .catch(() => {})
  })

  useEffect(() => {
    let ignore = false

    setLoading(true)
    setError('')

    getEmployeeOverview(employeeId)
      .then((data) => {
        if (!ignore) setOverview(data)
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [employeeId])

  const backLink = (
    <Link to="/employees" className="p360-back">
      <ArrowLeft size={16} aria-hidden="true" />
      Employees
    </Link>
  )

  if (loading) {
    return (
      <div className="p360-page" aria-busy="true">
        {backLink}
        <div className="p360-header">
          <span className="p360-avatar ui-skeleton" />
          <div className="p360-header-text">
            <span className="ui-skeleton" style={{ width: 220, height: 28 }} />
            <span className="ui-skeleton" style={{ width: 160, marginTop: 12 }} />
          </div>
        </div>
        <span className="visually-hidden">Loading employee…</span>
      </div>
    )
  }

  if (error || !overview) {
    return (
      <div className="p360-page">
        {backLink}
        <EmptyState
          title="Employee not found"
          description={
            error === 'Employee not found'
              ? `There is no employee with the ID ${employeeId}.`
              : error || 'Something went wrong.'
          }
          action={
            <Link to="/employees" className="ui-button ui-button-primary">
              Back to Employees
            </Link>
          }
        />
      </div>
    )
  }

  const {
    employee,
    attendance,
    leave,
    payroll,
    onboarding,
    offboarding = [],
    reviews,
    documents,
    assets,
    tasks,
  } = overview

  // Leaving: an unfinished offboarding, or the finished one of a leaver.
  const openOffboarding = offboarding.find((record) => record.status !== 'Completed')
  const pastOffboarding = !openOffboarding && employee.status === 'Inactive' ? offboarding[0] : null

  const openTasks = tasks.filter((task) => task.status !== 'Completed')
  const latestPay = payroll[0]
  const latestReview = reviews[0]
  const currentOnboarding = onboarding[0]

  const stats = [
    { label: 'Leave taken', value: plural(leave.summary.approvedDays, 'day'), hint: leave.summary.pendingDays > 0 ? `${leave.summary.pendingDays} pending` : 'No pending requests' },
    { label: 'Open tasks', value: openTasks.length, hint: `${tasks.length} in total` },
    { label: 'Assets held', value: assets.length, hint: assets.length ? assets.map((asset) => asset.category).join(', ') : 'None assigned' },
    { label: 'Latest pay', value: latestPay ? formatMoney(latestPay.net) : '—', hint: latestPay ? latestPay.month : 'No payslips yet' },
    { label: 'Last rating', value: latestReview ? `${latestReview.rating} / 5` : '—', hint: latestReview ? latestReview.reviewPeriod : 'Not reviewed yet' },
  ]

  const details = [
    { label: 'Employee ID', value: employee.employeeId },
    { label: 'Joined', value: formatDate(employee.joiningDate) },
    { label: 'Employment', value: employee.employmentType },
    { label: 'Manager', value: employee.manager || '—' },
  ]

  return (
    <div className="p360-page">
      {backLink}

      {/* =============== HEADER =============== */}
      <header className="p360-header">
        <span
          className="p360-avatar"
          style={{ background: getAvatarColor(employee.name) }}
          aria-hidden="true"
        >
          {getInitials(employee.name)}
        </span>

        <div className="p360-header-text">
          <div className="p360-title-row">
            <h1>{employee.name}</h1>
            <Badge>{employee.status}</Badge>
          </div>

          <p className="p360-subtitle">
            {employee.role} · {employee.department}
          </p>

          <ul className="p360-contact">
            <li>
              <Mail size={14} aria-hidden="true" />
              <a href={`mailto:${employee.email}`}>{employee.email}</a>
            </li>
            {employee.phone && (
              <li>
                <Phone size={14} aria-hidden="true" />
                <a href={`tel:${employee.phone.replace(/\s/g, '')}`}>{employee.phone}</a>
              </li>
            )}
          </ul>

          {openOffboarding ? (
            <p className="p360-leaving">
              <LogOut size={14} aria-hidden="true" />
              <span>
                Leaving on <strong>{formatDate(openOffboarding.lastWorkingDay)}</strong> ({openOffboarding.reason}) ·{' '}
                {openOffboarding.items.filter((item) => item.done).length} of {openOffboarding.items.length} offboarding items done ·{' '}
                <Link to={`/offboarding?focus=${openOffboarding._id}`}>Open checklist</Link>
              </span>
            </p>
          ) : pastOffboarding ? (
            <p className="p360-leaving p360-left">
              <LogOut size={14} aria-hidden="true" />
              <span>Left on {formatDate(pastOffboarding.lastWorkingDay)} ({pastOffboarding.reason})</span>
            </p>
          ) : (
            employee.status !== 'Inactive' && (
              <div className="p360-header-actions">
                <Button
                  size="small"
                  variant="secondary"
                  icon={<LogOut size={14} aria-hidden="true" />}
                  onClick={() => setShowOffboard(true)}
                >
                  Start offboarding
                </Button>
              </div>
            )
          )}
        </div>

        <dl className="p360-details">
          {details.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* =============== AT A GLANCE =============== */}
      <section className="p360-stats" aria-label="At a glance">
        {stats.map((stat) => (
          <div className="p360-stat" key={stat.label}>
            <span className="p360-stat-label">{stat.label}</span>
            <strong>{stat.value}</strong>
            <span className="p360-stat-hint">{stat.hint}</span>
          </div>
        ))}
      </section>

      {/* =============== MODULES =============== */}
      <div className="p360-grid">
        <Section title="Tasks" icon={ListChecks} to="/tasks" linkLabel="All tasks" count={tasks.length}>
          <RecordList
            items={tasks}
            empty="No tasks assigned."
            render={(task) => (
              <Row
                key={task._id}
                title={task.title}
                meta={`${task.priority} priority · due ${formatDate(task.dueDate)}`}
                badge={task.status}
              />
            )}
          />
        </Section>

        <Section title="Leave" icon={CalendarDays} to="/leave" linkLabel="Leave management" count={leave.records.length}>
          {leave.balances && (
            <div className="p360-balances">
              <LeaveBalances balances={leave.balances} />
            </div>
          )}
          {Object.keys(leave.summary.byType).length > 0 && (
            <p className="p360-note">
              Approved:{' '}
              {Object.entries(leave.summary.byType)
                .map(([type, days]) => `${type} ${days}d`)
                .join(' · ')}
            </p>
          )}
          <RecordList
            items={leave.records.slice(0, 6)}
            empty="No leave requests."
            render={(item) => (
              <Row
                key={item._id}
                title={`${item.type} leave`}
                meta={`${formatDate(item.from)} – ${formatDate(item.to)} · ${plural(item.days, 'day')}`}
                badge={item.status}
              />
            )}
          />
        </Section>

        <Section title="Attendance" icon={ClipboardCheck} to="/attendance" linkLabel="Attendance" count={attendance.recent.length}>
          {attendance.recent.length > 0 && (
            <div className="p360-badges" aria-label="Last 30 records by status">
              {Object.entries(attendance.summary).map(([status, count]) => (
                <Badge key={status}>{`${status} ${count}`}</Badge>
              ))}
            </div>
          )}
          <RecordList
            items={attendance.recent.slice(0, 5)}
            empty="No attendance recorded."
            render={(item) => (
              <Row
                key={item._id}
                title={formatDate(item.date)}
                meta={item.checkIn ? `${item.checkIn} – ${item.checkOut || '…'}` : undefined}
                badge={item.status}
              />
            )}
          />
        </Section>

        <Section title="Payslips" icon={Wallet} to="/payroll" linkLabel="Payroll" count={payroll.length}>
          <RecordList
            items={payroll}
            empty="No payroll records."
            render={(item) => (
              <Row
                key={item._id}
                title={item.month}
                meta={`Basic ${formatMoney(item.basic)} · deductions ${formatMoney(item.deductions)}`}
                aside={formatMoney(item.net)}
                badge={item.status}
              />
            )}
          />
        </Section>

        <Section title="Assets" icon={Laptop} to="/assets" linkLabel="Assets" count={assets.length}>
          <RecordList
            items={assets}
            empty="No assets assigned."
            render={(asset) => (
              <Row
                key={asset._id}
                title={asset.assetName}
                meta={`${asset.assetId} · ${asset.category} · since ${formatDate(asset.assignedDate)}`}
                badge={asset.condition}
              />
            )}
          />
        </Section>

        <Section title="Documents" icon={FileText} to="/documents" linkLabel="Documents" count={documents.length}>
          <RecordList
            items={documents}
            empty="No documents on file."
            render={(item) => (
              <Row
                key={item._id}
                title={item.documentName}
                meta={`${item.documentType}${item.expiryDate ? ` · expires ${formatDate(item.expiryDate)}` : ''}`}
                badge={item.status}
              />
            )}
          />
        </Section>

        <Section title="Reviews" icon={Star} to="/performance" linkLabel="Performance" count={reviews.length}>
          <RecordList
            items={reviews}
            empty="No performance reviews yet."
            render={(review) => (
              <Row
                key={review._id}
                title={review.reviewPeriod}
                meta={`Reviewed by ${review.reviewer} · ${formatDate(review.reviewDate)}`}
                aside={`${review.rating} / 5`}
                badge={review.status}
              />
            )}
          />
        </Section>

        <Section title="Onboarding" icon={ClipboardCheck} to="/onboarding" linkLabel="Onboarding">
          {currentOnboarding ? (
            <>
              <p className="p360-note">
                {currentOnboarding.onboardingType} · started {formatDate(currentOnboarding.joiningDate)}{' '}
                <Badge>{currentOnboarding.status}</Badge>
              </p>
              <ul className="p360-checklist">
                {[
                  ['documents', 'Documents collected'],
                  ['orientation', 'Orientation'],
                  ['equipment', 'Equipment'],
                  ['systemAccess', 'System access'],
                ].map(([field, label]) => (
                  <li key={field} data-done={Boolean(currentOnboarding[field])}>
                    {label}
                    <span className="visually-hidden">
                      {currentOnboarding[field] ? ' (done)' : ' (to do)'}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="p360-empty">No onboarding record.</p>
          )}
        </Section>
      </div>

      {showOffboard && (
        <StartOffboardingModal
          employee={employee}
          onClose={() => setShowOffboard(false)}
          onStarted={(record) => navigate(`/offboarding?focus=${record._id}`)}
        />
      )}
    </div>
  )
}

export default EmployeeProfile
