/*
 * Onboarding checklist rules as pure functions (no database).
 *
 * Each step is due a number of days from the joining date:
 *   documents     3 days before joining (paperwork first)
 *   systemAccess  on the joining day (accounts ready)
 *   equipment     on the joining day (laptop etc.)
 *   orientation   2 days after joining
 */
import { dayKey, fromDayKey, startOfToday } from './leaveRules.js'

const DAY_MS = 24 * 60 * 60 * 1000

export const ONBOARDING_STEPS = [
  { key: 'documents', label: 'Documents collected', offsetDays: -3 },
  { key: 'systemAccess', label: 'System access', offsetDays: 0 },
  { key: 'equipment', label: 'Equipment handed over', offsetDays: 0 },
  { key: 'orientation', label: 'Orientation', offsetDays: 2 },
]

export const STEP_KEYS = ONBOARDING_STEPS.map((step) => step.key)

export const stepLabel = (key) => ONBOARDING_STEPS.find((step) => step.key === key)?.label ?? key

/* { documents: Date, systemAccess: Date, … } from the joining date */
export function dueDatesFor(joiningDate) {
  const start = fromDayKey(dayKey(joiningDate)).getTime()

  return Object.fromEntries(
    ONBOARDING_STEPS.map((step) => [step.key, new Date(start + step.offsetDays * DAY_MS)]),
  )
}

/* Status always follows the checklist. */
export function deriveStatus(record) {
  const done = STEP_KEYS.filter((key) => Boolean(record[key])).length

  if (done === 0) return 'Not Started'
  if (done === STEP_KEYS.length) return 'Completed'
  return 'In Progress'
}

/* Steps not done whose due date is before today. */
export function overdueSteps(record, today = startOfToday()) {
  const todayKey = dayKey(today)
  const dueDates = stepDueDates(record)

  return ONBOARDING_STEPS
    .filter((step) => !record[step.key] && dayKey(dueDates[step.key]) < todayKey)
    .map((step) => ({ key: step.key, label: step.label, dueDate: dueDates[step.key] }))
}

/* Saved due dates, falling back to the joining date for older records. */
export function stepDueDates(record) {
  const fallback = dueDatesFor(record.joiningDate)
  const saved = record.stepDueDates || {}

  return Object.fromEntries(STEP_KEYS.map((key) => [key, saved[key] || fallback[key]]))
}

/*
 * Works out the checklist fields to save, given what the browser
 * sent (`body`) and the saved record (`before`, null when new):
 *  - due dates come from the joining date (recalculated if it changes)
 *  - a step that becomes done gets a completion time; undone clears it
 *  - status is derived, never taken from the browser
 * Returns the fields to merge into the update.
 */
export function applyChecklist(body, before = null, now = new Date()) {
  const merged = { ...(before || {}), ...body }
  const result = {}

  const joiningChanged = !before || (body.joiningDate !== undefined && dayKey(body.joiningDate) !== dayKey(before.joiningDate))

  if (merged.joiningDate && joiningChanged) {
    result.stepDueDates = dueDatesFor(merged.joiningDate)
    result.overdueNotified = [] // new dates: warn again if they slip
  }

  const completedAt = { ...(before?.stepCompletedAt || {}) }

  for (const key of STEP_KEYS) {
    const wasDone = Boolean(before?.[key])
    const isDone = Boolean(merged[key])

    if (isDone && !wasDone) completedAt[key] = now
    if (!isDone) delete completedAt[key]
  }

  result.stepCompletedAt = completedAt
  result.status = deriveStatus(merged)

  return result
}
