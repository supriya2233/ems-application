import { Link } from 'react-router-dom'
import { ArrowRight, Inbox, LogIn, LogOut, Plane } from 'lucide-react'

import { getAvatarColor, getInitials } from '../../utils/avatar'

/*
 * "Today at a glance": who is off, who joins soon, who leaves soon,
 * and how many things wait in the Approvals inbox.
 * Data: `today` and `approvals` from GET /api/dashboard.
 */

const DAY_MS = 24 * 60 * 60 * 1000

const shortDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

// Dates are stored as UTC midnight of the day ("2026-11-13T00:00Z").
function daysFrom(todayKey, value) {
  return Math.round((new Date(value) - new Date(`${todayKey}T00:00:00Z`)) / DAY_MS)
}

function inDays(days) {
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} ago`
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

function Person({ person, children }) {
  return (
    <li className="today-person">
      <span className="today-avatar" style={{ background: getAvatarColor(person.name) }} aria-hidden="true">
        {getInitials(person.name)}
      </span>
      <span className="today-person-text">
        <Link to={`/employees/${person.employeeId}`}>{person.name}</Link>
        <small>{children}</small>
      </span>
    </li>
  )
}

function Column({ icon: Icon, title, count, to, empty, children }) {
  return (
    <section className="today-column" aria-label={title}>
      <h3>
        <Icon size={15} aria-hidden="true" />
        {title}
        <span className="today-count">{count}</span>
      </h3>
      {count === 0 ? <p className="today-empty">{empty}</p> : <ul className="today-list">{children}</ul>}
      {count > 0 && to && (
        <Link className="today-more" to={to}>
          Open <ArrowRight size={13} aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}

function TodayPanel({ today, approvalsWaiting = 0 }) {
  if (!today) return null

  const { date, onLeave = [], joiners = [], leavers = [] } = today
  const heading = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })

  return (
    <section className="dash-panel today-panel" aria-labelledby="today-title">
      <header className="dash-panel-header">
        <div>
          <h2 id="today-title">Today at a glance</h2>
          <p>{heading}</p>
        </div>

        <Link
          to="/approvals"
          className={`today-approvals${approvalsWaiting > 0 ? ' today-approvals-waiting' : ''}`}
        >
          <Inbox size={15} aria-hidden="true" />
          {approvalsWaiting > 0
            ? `${approvalsWaiting} waiting for approval`
            : 'Approvals all clear'}
        </Link>
      </header>

      <div className="today-columns">
        <Column icon={Plane} title="On leave today" count={onLeave.length} to="/calendar" empty="Everyone is in.">
          {onLeave.map((leave) => (
            <Person key={leave._id} person={leave}>
              {leave.type} · back after {shortDate(leave.to)}
            </Person>
          ))}
        </Column>

        <Column icon={LogIn} title="Joining" count={joiners.length} to="/onboarding" empty="No one joining in the next 30 days.">
          {joiners.map((person) => {
            const days = person.joiningDate ? daysFrom(date, person.joiningDate) : null
            return (
              <Person key={person._id} person={person}>
                {person.role || person.department}
                {days === null ? '' : days > 0 ? ` · joins ${shortDate(person.joiningDate)}` : ' · onboarding'}
              </Person>
            )
          })}
        </Column>

        <Column icon={LogOut} title="Leaving" count={leavers.length} to="/offboarding" empty="No one is leaving.">
          {leavers.map((person) => {
            const days = daysFrom(date, person.lastWorkingDay)
            return (
              <Person key={person._id} person={person}>
                Last day {shortDate(person.lastWorkingDay)}{' '}
                <span className={days < 0 ? 'today-late' : undefined}>({inDays(days)})</span>
              </Person>
            )
          })}
        </Column>
      </div>
    </section>
  )
}

export default TodayPanel
