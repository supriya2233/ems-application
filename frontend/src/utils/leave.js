/*
 * Small shared helpers for leave screens.
 */

export const LEAVE_TYPES = ['Annual', 'Casual', 'Medical', 'Other', 'Unpaid']

export const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled']

export const plural = (count, word) => `${count} ${word}${Number(count) === 1 ? '' : 's'}`

/*
 * Dates are stored as whole days (UTC midnight), so format them in
 * UTC too; otherwise a browser west of London shows the day before.
 */
export const formatDay = (value, withYear = true) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        ...(withYear && { year: 'numeric' }),
        timeZone: 'UTC',
      })
    : '—'

export const formatRange = (from, to) => {
  const sameDay = String(from).slice(0, 10) === String(to).slice(0, 10)
  return sameDay ? formatDay(from) : `${formatDay(from, false)} – ${formatDay(to)}`
}

/* "2026-11-03" for <input type="date"> */
export const toInputDate = (value) => (value ? String(new Date(value).toISOString()).slice(0, 10) : '')

/* Today's date as "YYYY-MM-DD" in the user's own time zone. */
export const todayKey = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
