import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import Button from '../components/common/Button'
import PageHeader from '../components/common/PageHeader'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import { getEmployees } from '../services/employeeService'
import { getLeaves } from '../services/leaveService'
import { getSettings } from '../services/settingsService'
import { todayKey } from '../utils/leave'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const keyOf = (value) => String(value || '').slice(0, 10)

/* "2026-11-03" for a UTC year / month (0-based) / day */
const makeKey = (year, month, day) => new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)

const weekdayOf = (key) => new Date(`${key}T00:00:00Z`).getUTCDay()

/*
 * Month view of who is away and what is happening:
 * company holidays, approved (and pending) leave, joining dates.
 */
function Calendar() {
  const today = todayKey()
  const [cursor, setCursor] = useState(() => ({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)) - 1,
  }))

  const [leaves, setLeaves] = useState([])
  const [employees, setEmployees] = useState([])
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState('')

  const refreshKey = useLiveRefresh(['leave', 'employees', 'settings'])

  useEffect(() => {
    let ignore = false

    Promise.all([getLeaves(), getEmployees(), getSettings()])
      .then(([leaveData, employeeData, settingsData]) => {
        if (ignore) return
        setLeaves(leaveData)
        setEmployees(employeeData)
        setSettings(settingsData)
        setError('')
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load the calendar')
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  const { year, month } = cursor
  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  const workingDays = useMemo(() => settings?.workingDays ?? [1, 2, 3, 4, 5], [settings])

  /* All events of this month, grouped by day key */
  const eventsByDay = useMemo(() => {
    const map = new Map()
    const add = (key, event) => {
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(event)
    }

    const first = makeKey(year, month, 1)
    const last = makeKey(year, month + 1, 0)
    const holidayKeys = new Set()

    for (const holiday of settings?.holidays ?? []) {
      const key = keyOf(holiday.date)
      holidayKeys.add(key)
      if (key >= first && key <= last) {
        add(key, { kind: 'holiday', label: holiday.name, sort: 0 })
      }
    }

    for (const leave of leaves) {
      if (!['Approved', 'Pending'].includes(leave.status)) continue

      const from = keyOf(leave.from) < first ? first : keyOf(leave.from)
      const to = keyOf(leave.to) > last ? last : keyOf(leave.to)

      for (let day = Number(from.slice(8)); from <= to && day <= Number(to.slice(8)); day += 1) {
        const key = makeKey(year, month, day)
        // Leave only covers working days
        if (!workingDays.includes(weekdayOf(key)) || holidayKeys.has(key)) continue

        add(key, {
          kind: leave.status === 'Approved' ? 'leave' : 'pending',
          label: leave.employee,
          detail: `${leave.type} leave${leave.status === 'Pending' ? ' (pending)' : ''}`,
          link: `/employees/${leave.employeeId}`,
          sort: leave.status === 'Approved' ? 1 : 2,
        })
      }
    }

    for (const employee of employees) {
      const key = keyOf(employee.joiningDate)
      if (key >= first && key <= last) {
        add(key, {
          kind: 'joining',
          label: employee.name,
          detail: `Joins as ${employee.role}`,
          link: `/employees/${employee.employeeId}`,
          sort: 3,
        })
      }
    }

    map.forEach((list) => list.sort((a, b) => a.sort - b.sort))
    return map
  }, [year, month, leaves, employees, settings, workingDays])

  /* Grid cells: Monday-first weeks, blanks before the 1st */
  const cells = useMemo(() => {
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const lead = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7

    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => makeKey(year, month, index + 1)),
    ]
  }, [year, month])

  const move = (step) =>
    setCursor(({ year: y, month: m }) => {
      const next = new Date(Date.UTC(y, m + step, 1))
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() }
    })

  const goToday = () =>
    setCursor({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 })

  const agendaDays = cells.filter((key) => key && eventsByDay.has(key))

  const dayName = (key, options) =>
    new Date(`${key}T00:00:00Z`).toLocaleDateString('en-IN', { ...options, timeZone: 'UTC' })

  const renderEvent = (event, index) => (
    <li key={`${event.kind}-${event.label}-${index}`} className={`cal-event cal-event-${event.kind}`}>
      {event.link ? (
        <Link to={event.link} title={event.detail}>
          {event.label}
        </Link>
      ) : (
        <span>{event.label}</span>
      )}
      {event.detail && <span className="visually-hidden">, {event.detail}</span>}
    </li>
  )

  return (
    <div className="calendar-page">
      <PageHeader
        title="Calendar"
        description="Holidays, leave and joining dates. Leave is shown on working days only."
        action={
          <Link to="/settings" className="ui-button ui-button-secondary">
            Manage holidays
          </Link>
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      <div className="cal-toolbar">
        <div className="cal-nav">
          <Button variant="secondary" size="small" onClick={() => move(-1)} aria-label="Previous month">
            <ChevronLeft size={16} aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="small" onClick={goToday}>
            Today
          </Button>
          <Button variant="secondary" size="small" onClick={() => move(1)} aria-label="Next month">
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>

        <h2 className="cal-month" aria-live="polite">{monthLabel}</h2>

        <ul className="cal-legend" aria-label="Legend">
          <li className="cal-event-holiday">Holiday</li>
          <li className="cal-event-leave">On leave</li>
          <li className="cal-event-pending">Leave pending</li>
          <li className="cal-event-joining">Joining</li>
        </ul>
      </div>

      {/* Month grid (tablet and desktop) */}
      <div className="cal-grid" role="grid" aria-label={monthLabel}>
        <div className="cal-row cal-head" role="row">
          {WEEKDAYS.map((day) => (
            <span key={day} role="columnheader" className="cal-weekday">{day}</span>
          ))}
        </div>

        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, week) => (
          <div className="cal-row" role="row" key={week}>
            {Array.from({ length: 7 }, (_, column) => {
              const key = cells[week * 7 + column]

              if (!key) return <span key={column} role="gridcell" className="cal-cell cal-cell-blank" />

              const events = eventsByDay.get(key) ?? []
              const offDay = !workingDays.includes(weekdayOf(key))

              return (
                <div
                  key={key}
                  role="gridcell"
                  aria-label={`${dayName(key, { weekday: 'long', day: 'numeric', month: 'long' })}${events.length ? `, ${events.length} event${events.length === 1 ? '' : 's'}` : ''}`}
                  className={['cal-cell', offDay && 'cal-cell-off', key === today && 'cal-cell-today'].filter(Boolean).join(' ')}
                >
                  <span className="cal-date" aria-hidden="true">{Number(key.slice(8))}</span>
                  {events.length > 0 && <ul className="cal-events">{events.map(renderEvent)}</ul>}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Agenda list (phones) */}
      <div className="cal-agenda">
        {agendaDays.length === 0 ? (
          <p className="leave-muted">Nothing planned in {monthLabel}.</p>
        ) : (
          <ol>
            {agendaDays.map((key) => (
              <li key={key} className={key === today ? 'cal-agenda-today' : undefined}>
                <span className="cal-agenda-date">
                  <strong>{Number(key.slice(8))}</strong>
                  {dayName(key, { weekday: 'short' })}
                </span>
                <ul className="cal-events">
                  {eventsByDay.get(key).map((event, index) => (
                    <li key={`${event.kind}-${event.label}-${index}`} className={`cal-event cal-event-${event.kind}`}>
                      {event.link ? <Link to={event.link}>{event.label}</Link> : <span>{event.label}</span>}
                      {event.detail && <small>{event.detail}</small>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

export default Calendar
