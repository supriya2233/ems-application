/*
 * Onboarding checklist helpers for the screens.
 * The same four steps and due-date rules as the server
 * (backend/src/services/onboardingRules.js).
 */
import { todayKey } from './leave'

export const ONBOARDING_STEPS = [
  { key: 'documents', label: 'Documents collected', hint: '3 days before joining' },
  { key: 'systemAccess', label: 'System access', hint: 'on the joining day' },
  { key: 'equipment', label: 'Equipment handed over', hint: 'on the joining day' },
  { key: 'orientation', label: 'Orientation', hint: '2 days after joining' },
]

export const ONBOARDING_STATUSES = ['Not Started', 'In Progress', 'Completed']

export const ONBOARDING_TYPES = ['New Hire', 'Internal Transfer', 'Rehire']

const OFFSET_DAYS = { documents: -3, systemAccess: 0, equipment: 0, orientation: 2 }

const dayOf = (value) => (value ? String(new Date(value).toISOString()).slice(0, 10) : '')

/* Saved due date, or worked out from the joining date for older records. */
function dueKey(record, key) {
  const saved = record.stepDueDates?.[key]
  if (saved) return dayOf(saved)
  if (!record.joiningDate) return ''

  const date = new Date(`${dayOf(record.joiningDate)}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + OFFSET_DAYS[key])
  return dayOf(date)
}

/*
 * The checklist of one record, ready to display:
 * [{ key, label, done, dueKey, completedAt, overdue }]
 */
export function checklistOf(record, today = todayKey()) {
  return ONBOARDING_STEPS.map((step) => {
    const done = Boolean(record[step.key])
    const due = dueKey(record, step.key)

    return {
      ...step,
      done,
      dueKey: due,
      completedAt: record.stepCompletedAt?.[step.key] || null,
      overdue: !done && Boolean(due) && due < today,
    }
  })
}

export const doneCount = (record) => ONBOARDING_STEPS.filter((step) => record[step.key]).length
