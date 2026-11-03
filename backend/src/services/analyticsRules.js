/*
 * Workforce analytics as pure functions (no database), so every
 * number on the Analytics page can be unit-tested.
 *
 * Months are keyed "YYYY-MM". Dates are stored as calendar days at
 * UTC midnight (see leaveRules.js), so UTC getters are correct here.
 */
import { dayKey, workingDates } from './leaveRules.js'
import { MONTH_NAMES } from './payrollRules.js'

const SHORT = MONTH_NAMES.map((name) => name.slice(0, 3))
const WORKED = ['Present', 'Late', 'WFH']

export const monthKeyOf = (value) => dayKey(value).slice(0, 7)

/* The last `count` months up to and including today's, oldest first. */
export function monthRange(today, count) {
  const months = []
  const year = today.getUTCFullYear()
  const month = today.getUTCMonth()

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const first = new Date(Date.UTC(year, month - offset, 1))
    const last = new Date(Date.UTC(year, month - offset + 1, 0))
    const key = first.toISOString().slice(0, 7)
    months.push({
      key,
      label: `${SHORT[first.getUTCMonth()]} ${String(first.getUTCFullYear()).slice(2)}`,
      long: `${MONTH_NAMES[first.getUTCMonth()]} ${first.getUTCFullYear()}`,
      startKey: `${key}-01`,
      endKey: dayKey(last),
    })
  }

  return months
}

/*
 * When each person left: the last working day of a completed
 * offboarding. People marked Inactive without one count as leaving
 * on the day their record last changed (best information we have).
 */
export function leavingDates(employees, offboardings = []) {
  const byEmployee = new Map()

  for (const record of offboardings) {
    if (record.status === 'Completed' && record.lastWorkingDay) {
      byEmployee.set(record.employeeId, dayKey(record.lastWorkingDay))
    }
  }

  for (const person of employees) {
    if (person.status === 'Inactive' && !byEmployee.has(person.employeeId)) {
      byEmployee.set(person.employeeId, dayKey(person.updatedAt || person.joiningDate))
    }
  }

  return byEmployee
}

/* Headcount at the end of each month, plus hires and exits in it. */
export function headcountTrend(employees, left, months) {
  return months.map((month) => {
    let headcount = 0
    let hires = 0
    let exits = 0

    for (const person of employees) {
      const joined = dayKey(person.joiningDate)
      const leftOn = left.get(person.employeeId)
      if (!joined) continue

      if (joined <= month.endKey && (!leftOn || leftOn > month.endKey)) headcount += 1
      if (joined >= month.startKey && joined <= month.endKey) hires += 1
      if (leftOn && leftOn >= month.startKey && leftOn <= month.endKey) exits += 1
    }

    return { month: month.key, label: month.label, headcount, hires, exits }
  })
}

/* Exits in the period as a % of the average headcount. */
export function attritionRate(trend) {
  if (trend.length === 0) return 0
  const exits = trend.reduce((sum, item) => sum + item.exits, 0)
  const average = trend.reduce((sum, item) => sum + item.headcount, 0) / trend.length
  return average > 0 ? Math.round((exits / average) * 1000) / 10 : 0
}

/* Count of `items` per value of `field`, largest first. */
export function countBy(items, field, order = null) {
  const counts = new Map()
  for (const item of items) {
    const key = item[field] || 'Not set'
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  const rows = [...counts].map(([name, count]) => ({ name, count }))
  if (order) return order.map((name) => ({ name, count: counts.get(name) || 0 }))
  return rows.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/*
 * Approved leave, as working days per month and type. A leave that
 * spans two months is split by the working days in each.
 */
export function leaveByMonth(leaves, months, settings, types) {
  const rows = months.map((month) => ({
    month: month.key,
    label: month.label,
    total: 0,
    ...Object.fromEntries(types.map((type) => [type, 0])),
  }))
  const index = new Map(rows.map((row, position) => [row.month, position]))
  const first = months[0]?.startKey
  const last = months.at(-1)?.endKey

  for (const leave of leaves) {
    if (leave.status !== 'Approved') continue
    const from = dayKey(leave.from)
    const to = dayKey(leave.to)
    if (!from || !to || to < first || from > last) continue

    for (const key of workingDates(from, to, settings)) {
      const position = index.get(key.slice(0, 7))
      if (position === undefined) continue
      const type = types.includes(leave.type) ? leave.type : 'Other'
      rows[position][type] += 1
      rows[position].total += 1
    }
  }

  return rows
}

/* Attendance status counts and the share of marked days worked. */
export function attendanceSummary(records, statuses) {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0]))
  for (const record of records) {
    if (counts[record.status] !== undefined) counts[record.status] += 1
  }

  const worked = WORKED.reduce((sum, status) => sum + (counts[status] || 0), 0)
  const expected = worked + (counts.Absent || 0) // leave days are excused
  return {
    marked: records.length,
    rate: expected > 0 ? Math.round((worked / expected) * 1000) / 10 : null,
    byStatus: statuses.map((status) => ({ name: status, count: counts[status] })),
  }
}

/* Attendance rate per month (null when nothing was marked). */
export function attendanceByMonth(records, months) {
  return months.map((month) => {
    const inMonth = records.filter((record) => monthKeyOf(record.date) === month.key)
    const worked = inMonth.filter((record) => WORKED.includes(record.status)).length
    const expected = worked + inMonth.filter((record) => record.status === 'Absent').length
    return {
      month: month.key,
      label: month.label,
      rate: expected > 0 ? Math.round((worked / expected) * 1000) / 10 : null,
    }
  })
}

/* Net pay per month, from payroll records labelled "October 2026". */
export function payrollByMonth(records, months) {
  return months.map((month) => {
    const inMonth = records.filter((record) => record.month === month.long)
    return {
      month: month.key,
      label: month.label,
      net: inMonth.reduce((sum, record) => sum + (Number(record.net) || 0), 0),
      people: new Set(inMonth.map((record) => record.employeeId)).size,
    }
  })
}

/* Open, overdue and completed tasks per department. */
export function tasksByDepartment(tasks, todayKey) {
  const rows = new Map()

  for (const task of tasks) {
    const name = task.department || 'Not set'
    const row = rows.get(name) || { name, open: 0, overdue: 0, completed: 0, total: 0 }
    row.total += 1
    if (task.status === 'Completed') row.completed += 1
    else {
      row.open += 1
      if (task.dueDate && dayKey(task.dueDate) < todayKey) row.overdue += 1
    }
    rows.set(name, row)
  }

  return [...rows.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
}

/* Average time at the company, in years, for current people. */
export function averageTenure(employees, todayKey) {
  const current = employees.filter((person) => person.status !== 'Inactive' && person.joiningDate)
  if (current.length === 0) return 0
  const today = new Date(`${todayKey}T00:00:00Z`).getTime()
  const days = current.reduce((sum, person) => sum + (today - new Date(dayKey(person.joiningDate)).getTime()) / 864e5, 0)
  return Math.round((days / current.length / 365.25) * 10) / 10
}
