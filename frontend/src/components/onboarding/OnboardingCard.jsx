import { Link } from 'react-router-dom'
import { Check, CircleAlert, Laptop } from 'lucide-react'

import Badge from '../common/Badge'
import Button from '../common/Button'
import { getAvatarColor, getInitials } from '../../utils/avatar'
import { formatDay } from '../../utils/leave'
import { checklistOf, doneCount, ONBOARDING_STEPS } from '../../utils/onboarding'

/*
 * One person's onboarding: progress bar plus the dated checklist.
 * Ticking a step saves straight away (onToggle). The status badge
 * follows the checklist, so it can't be set by hand.
 */
function OnboardingCard({ record, asset, busyStep, highlighted, onToggle, onView, onEdit, onDelete }) {
  const steps = checklistOf(record)
  const done = doneCount(record)
  const total = ONBOARDING_STEPS.length
  const overdue = steps.filter((step) => step.overdue).length
  const percent = Math.round((done / total) * 100)

  return (
    <article
      id={`onboarding-${record._id}`}
      className={`onboarding-card ${highlighted ? 'onboarding-card-highlight' : ''}`}
      aria-labelledby={`onboarding-name-${record._id}`}
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
          <h3 id={`onboarding-name-${record._id}`}>
            <Link to={`/employees/${record.employeeId}`}>{record.employeeName}</Link>
          </h3>
          <p>
            {record.department} · {record.onboardingType} · joins {formatDay(record.joiningDate)}
          </p>
        </div>

        <Badge>{record.status}</Badge>
      </header>

      <div className="onboarding-progress">
        <div className="onboarding-progress-label">
          <span>{done} of {total} steps done</span>
          {overdue > 0 && (
            <span className="onboarding-overdue-count">
              <CircleAlert size={14} aria-hidden="true" /> {overdue} overdue
            </span>
          )}
        </div>
        <div
          className="onboarding-progress-track"
          role="progressbar"
          aria-label={`${record.employeeName}’s onboarding`}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${done} of ${total} steps done`}
        >
          <span className="onboarding-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <ul className="onboarding-steps">
        {steps.map((step) => {
          const id = `step-${record._id}-${step.key}`
          const busy = busyStep === step.key

          return (
            <li
              key={step.key}
              className={[
                'onboarding-step',
                step.done && 'onboarding-step-done',
                step.overdue && 'onboarding-step-overdue',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                id={id}
                type="checkbox"
                checked={step.done}
                disabled={busy}
                aria-describedby={`${id}-when`}
                onChange={(event) => onToggle(record, step.key, event.target.checked)}
              />
              <label htmlFor={id}>
                <span className="onboarding-step-label">{step.label}</span>
                <span id={`${id}-when`} className="onboarding-step-when">
                  {step.done
                    ? step.completedAt
                      ? `Done ${formatDay(step.completedAt, false)}`
                      : 'Done'
                    : step.overdue
                      ? `Overdue · was due ${formatDay(step.dueKey, false)}`
                      : step.dueKey
                        ? `Due ${formatDay(step.dueKey, false)}`
                        : step.hint}
                </span>
                {step.key === 'equipment' && step.done && asset && (
                  <span className="onboarding-step-asset">
                    <Laptop size={14} aria-hidden="true" /> {asset.assetName} ({asset.assetId})
                  </span>
                )}
              </label>
              {step.done && <Check className="onboarding-step-check" size={16} aria-hidden="true" />}
            </li>
          )
        })}
      </ul>

      <footer className="onboarding-card-actions">
        <Button size="small" variant="secondary" onClick={() => onView(record)}>View</Button>
        <Button size="small" variant="secondary" onClick={() => onEdit(record)}>Edit</Button>
        <Button
          size="small"
          variant="ghost"
          aria-label={`Delete onboarding for ${record.employeeName}`}
          onClick={() => onDelete(record)}
        >
          Delete
        </Button>
      </footer>
    </article>
  )
}

export default OnboardingCard
