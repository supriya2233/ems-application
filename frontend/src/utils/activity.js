/*
 * Helpers for showing the activity log.
 */

export const MODULE_LABELS = {
  employees: 'Employees',
  departments: 'Departments',
  tasks: 'Tasks',
  leave: 'Leave',
  attendance: 'Attendance',
  payroll: 'Payroll',
  recruitment: 'Recruitment',
  onboarding: 'Onboarding',
  offboarding: 'Offboarding',
  performance: 'Performance',
  documents: 'Documents',
  assets: 'Assets',
  settings: 'Settings',
}

export const moduleLabel = (module) =>
  MODULE_LABELS[module] || (module ? module.charAt(0).toUpperCase() + module.slice(1) : 'Other')

/* Date → "YYYY-MM-DD" in the browser's own time zone. */
export function localDayKey(value) {
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/*
 * "YYYY-MM-DD" → the ISO time when that day starts here.
 * Used for the From / To filters: "1 Nov" means 1 Nov in India,
 * which starts at 31 Oct 18:30 UTC.
 */
export function dayStartISO(key, addDays = 0) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day + addDays).toISOString()
}

/* "Today", "Yesterday", or "Friday, 30 October" (+ year if not this year) */
export function dayHeading(key, now = new Date()) {
  if (key === localDayKey(now)) return 'Today'

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (key === localDayKey(yesterday)) return 'Yesterday'

  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(year !== now.getFullYear() && { year: 'numeric' }),
  })
}

/* Entries (newest first) → [{ key, entries }] one group per day. */
export function groupByDay(entries) {
  const groups = []
  for (const entry of entries) {
    const key = localDayKey(entry.at)
    const last = groups.at(-1)
    if (last && last.key === key) last.entries.push(entry)
    else groups.push({ key, entries: [entry] })
  }
  return groups
}

/* "14:05" */
export const timeOfDay = (value) =>
  new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })

/* Does a live event belong in a list filtered like this? */
export function matchesFilters(event, { module, employeeId, from, to, q } = {}) {
  if (module && event.module !== module) return false
  if (employeeId && event.employeeId !== employeeId) return false
  const at = new Date(event.at).getTime()
  if (from && at < new Date(from).getTime()) return false
  if (to && at >= new Date(to).getTime()) return false
  if (q) {
    const text = `${event.summary} ${event.actor} ${event.employeeId}`.toLowerCase()
    if (!q.toLowerCase().split(/\s+/).filter(Boolean).every((word) => text.includes(word))) return false
  }
  return true
}
