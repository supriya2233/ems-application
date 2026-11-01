import { Link } from 'react-router-dom'
import { Check, Laptop, ReceiptIndianRupee } from 'lucide-react'

import Badge from '../common/Badge'
import Button from '../common/Button'
import { getAvatarColor, getInitials } from '../../utils/avatar'
import { formatDay, todayKey } from '../../utils/leave'

const dayOf = (value) => (value ? String(new Date(value).toISOString()).slice(0, 10) : '')

/*
 * One person's offboarding: progress plus the checklist built from
 * their assets. Ticking saves straight away (onToggle). Asset items
 * ask for the return condition first (handled by the page).
 */
function OffboardingCard({ record, busyKey, highlighted, onToggle, onEdit, onDelete }) {
  const done = record.items.filter((item) => item.done).length
  const total = record.items.length
  const finished = record.status === 'Completed'
  const lastDay = dayOf(record.lastWorkingDay)
  const today = todayKey()
  const daysLeft = Math.round((new Date(`${lastDay}T00:00:00Z`) - new Date(`${today}T00:00:00Z`)) / 86400000)

  const when = finished
    ? `Left ${formatDay(record.lastWorkingDay)}`
    : daysLeft > 0
      ? `Last day ${formatDay(record.lastWorkingDay)} · in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
      : daysLeft === 0
        ? 'Last day is today'
        : `Last day was ${formatDay(record.lastWorkingDay)}`

  return (
    <article
      id={`offboarding-${record._id}`}
      className={`onboarding-card ${highlighted ? 'onboarding-card-highlight' : ''}`}
      aria-labelledby={`offboarding-name-${record._id}`}
    >
      <header className="onboarding-card-header">
        <span
          className="pipeline-avatar"
          style={{ background: getAvatarColor(record.employeeName) }}
          aria-hidden="true"
        >
          {getInitials(record.employeeName)}
        </span>

        <div className="onboarding-card-title">
          <h3 id={`offboarding-name-${record._id}`}>
            <Link to={`/employees/${record.employeeId}`}>{record.employeeName}</Link>
          </h3>
          <p>
            {record.department} · {record.reason}
          </p>
          <p className={!finished && daysLeft < 0 ? 'offboarding-late' : undefined}>{when}</p>
        </div>

        <Badge>{record.status}</Badge>
      </header>

      <div className="onboarding-progress">
        <div className="onboarding-progress-label">
          <span>{done} of {total} done</span>
        </div>
        <div
          className="onboarding-progress-track"
          role="progressbar"
          aria-label={`${record.employeeName}’s offboarding`}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${done} of ${total} done`}
        >
          <span className="onboarding-progress-fill" style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }} />
        </div>
      </div>

      <ul className="onboarding-steps">
        {record.items.map((item) => {
          const id = `item-${record._id}-${item.key}`
          const locked = finished || busyKey === item.key || (item.kind === 'asset' && item.done)

          return (
            <li
              key={item.key}
              className={`onboarding-step ${item.done ? 'onboarding-step-done' : ''}`}
            >
              <input
                id={id}
                type="checkbox"
                checked={item.done}
                disabled={locked}
                aria-describedby={`${id}-when`}
                onChange={(event) => onToggle(record, item, event.target.checked)}
              />
              <label htmlFor={id}>
                <span className="onboarding-step-label">
                  {item.kind === 'asset' && <Laptop size={14} aria-hidden="true" />}
                  {item.kind === 'settlement' && <ReceiptIndianRupee size={14} aria-hidden="true" />}
                  {' '}{item.label}
                </span>
                <span id={`${id}-when`} className="onboarding-step-when">
                  {item.done
                    ? item.doneAt ? `Done ${formatDay(item.doneAt, false)}` : 'Done'
                    : item.kind === 'asset'
                      ? 'Ticking asks for its condition and puts it back in stock'
                      : item.kind === 'settlement'
                        ? 'Ticking creates the pro-rated last payroll'
                        : 'To do'}
                </span>
                {item.note && <span className="onboarding-step-asset">{item.note}</span>}
              </label>
              {item.done && <Check className="onboarding-step-check" size={16} aria-hidden="true" />}
            </li>
          )
        })}
      </ul>

      {record.notes && <p className="offboarding-notes">{record.notes}</p>}

      <footer className="onboarding-card-actions">
        {record.payrollId && (
          <Link className="ui-button ui-button-secondary ui-button-small" to="/payroll">Settlement in Payroll</Link>
        )}
        <Button size="small" variant="secondary" onClick={() => onEdit(record)}>Edit</Button>
        <Button
          size="small"
          variant="ghost"
          aria-label={`Delete offboarding for ${record.employeeName}`}
          onClick={() => onDelete(record)}
        >
          Delete
        </Button>
      </footer>
    </article>
  )
}

export default OffboardingCard
