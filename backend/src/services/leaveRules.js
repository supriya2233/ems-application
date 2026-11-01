/*
 * Leave business rules as pure functions (no database), so they
 * are easy to test and reuse.
 *
 * Dates are handled as calendar days in UTC: a date picked in the
 * browser ("2026-11-03") is stored as 2026-11-03T00:00:00Z, and
 * dayKey() turns any date back into "2026-11-03".
 */

const DAY_MS = 24 * 60 * 60 * 1000

export const LEAVE_TYPES = ['Annual', 'Casual', 'Medical', 'Other', 'Unpaid']

// Leave in these states does not use up days or block other requests.
export const INACTIVE_STATUSES = ['Rejected', 'Cancelled']

/* Any date (Date, ISO string, "YYYY-MM-DD") → "YYYY-MM-DD" */
export function dayKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

/* "YYYY-MM-DD" → Date at UTC midnight */
export function fromDayKey(key) {
  return new Date(`${key}T00:00:00.000Z`)
}

/* Every calendar day from `from` to `to`, inclusive, as day keys. */
export function listDays(from, to) {
  const start = fromDayKey(dayKey(from))
  const end = fromDayKey(dayKey(to))
  const days = []

  for (let time = start.getTime(); time <= end.getTime(); time += DAY_MS) {
    days.push(new Date(time).toISOString().slice(0, 10))
  }

  return days
}

/*
 * Working days in a range: the configured weekdays
 * (0 = Sunday … 6 = Saturday) minus company holidays.
 */
export function workingDates(from, to, { workingDays = [1, 2, 3, 4, 5], holidays = [] } = {}) {
  const holidayKeys = new Set(holidays.map((holiday) => dayKey(holiday.date ?? holiday)))

  return listDays(from, to).filter((key) => {
    const weekday = fromDayKey(key).getUTCDay()
    return workingDays.includes(weekday) && !holidayKeys.has(key)
  })
}

export function countWorkingDays(from, to, settings) {
  return workingDates(from, to, settings).length
}

/* Two inclusive date ranges share at least one day. */
export function rangesOverlap(aFrom, aTo, bFrom, bTo) {
  return dayKey(aFrom) <= dayKey(bTo) && dayKey(bFrom) <= dayKey(aTo)
}

/* Leave that still counts (not rejected / cancelled). */
export const isActiveLeave = (leave) => !INACTIVE_STATUSES.includes(leave.status)

/*
 * The first of `leaves` that overlaps the range, ignoring the
 * request being edited and rejected / cancelled ones.
 */
export function findOverlap(leaves, from, to, excludeId = null) {
  return (
    leaves.find(
      (leave) =>
        String(leave._id) !== String(excludeId) &&
        isActiveLeave(leave) &&
        rangesOverlap(leave.from, leave.to, from, to),
    ) || null
  )
}

/*
 * Balance per leave type for one employee and year.
 *
 *   allowances: { Annual: 18, Casual: 12, …, Unpaid: null }
 *               null = no limit
 *   leaves:     that employee's leave records
 *
 * A request counts towards the year in which it starts.
 * → [{ type, allowance, used, pending, remaining }]
 *   remaining is null when there is no limit.
 */
export function calculateBalances(leaves, allowances, year) {
  return LEAVE_TYPES.map((type) => {
    const ofType = leaves.filter(
      (leave) => leave.type === type && new Date(leave.from).getUTCFullYear() === Number(year),
    )

    const sum = (status) =>
      ofType
        .filter((leave) => leave.status === status)
        .reduce((total, leave) => total + Number(leave.days || 0), 0)

    const used = sum('Approved')
    const pending = sum('Pending')
    const allowance = allowances?.[type] ?? null

    return {
      type,
      allowance,
      used,
      pending,
      remaining: allowance === null ? null : allowance - used,
    }
  })
}

/*
 * Who else in the department is off during a leave.
 *
 *   members:     employees of the department (not Inactive)
 *   otherLeaves: approved leave of the department overlapping
 *
 * → { teamSize, othersOff: [names], message }
 *   message is '' when nobody else is off.
 */
export function describeCoverage(leave, members, otherLeaves) {
  const names = [
    ...new Set(
      otherLeaves
        .filter(
          (other) =>
            other.employeeId !== leave.employeeId &&
            String(other._id) !== String(leave._id) &&
            other.status === 'Approved' &&
            rangesOverlap(other.from, other.to, leave.from, leave.to),
        )
        .map((other) => other.employee),
    ),
  ]

  const teamSize = members.length

  return {
    teamSize,
    othersOff: names,
    message:
      names.length === 0
        ? ''
        : `${names.length} of ${teamSize} ${leave.department} team members ${
            names.length === 1 ? 'is' : 'are'
          } already off during this time (${names.join(', ')}).`,
  }
}

/* A warning when a request would go over the allowance, or ''. */
export function balanceWarning(balance, days) {
  if (!balance || balance.remaining === null) return ''

  const after = balance.remaining - balance.pending - days

  if (after >= 0) return ''

  return `This request is ${-after} day${after === -1 ? '' : 's'} over ${balance.type} leave balance (${balance.remaining} left, ${balance.pending} already requested).`
}
