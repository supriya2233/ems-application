/*
 * Payroll maths as pure functions (no database), so every rule
 * can be tested on its own (test/payroll.test.js).
 *
 * The idea: a monthly salary is earned per working day.
 *
 *   working days   Mon–Fri (or the Settings week) minus holidays
 *   employed days  working days the person was actually employed
 *                  (joined mid-month or left mid-month → fewer)
 *   payable days   employed days − unpaid leave − unexplained absences
 *   earned         gross × payable days ÷ working days
 *   loss of pay    gross − earned
 *   net            gross − loss of pay − other deductions (tax etc.)
 */
import { dayKey, workingDates } from './leaveRules.js'

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/* monthLabel(2026, 10) → "November 2026" (month is 0–11) */
export const monthLabel = (year, month) => `${MONTH_NAMES[month]} ${year}`

/* parseMonth("November 2026") or parseMonth("2026-11") → { year: 2026, month: 10 } */
export function parseMonth(value) {
  const text = String(value ?? '').trim()

  const iso = /^(\d{4})-(\d{2})$/.exec(text)
  if (iso) {
    const month = Number(iso[2]) - 1
    return month >= 0 && month < 12 ? { year: Number(iso[1]), month } : null
  }

  const named = /^([A-Za-z]+)\s+(\d{4})$/.exec(text)
  if (!named) return null

  const month = MONTH_NAMES.findIndex((name) => name.toLowerCase() === named[1].toLowerCase())
  return month === -1 ? null : { year: Number(named[2]), month }
}

/* First and last day of a month as "YYYY-MM-DD" keys. */
export function monthBounds(label) {
  const parsed = parseMonth(label)
  if (!parsed) return null

  const start = new Date(Date.UTC(parsed.year, parsed.month, 1))
  const end = new Date(Date.UTC(parsed.year, parsed.month + 1, 0))

  return { label: monthLabel(parsed.year, parsed.month), startKey: dayKey(start), endKey: dayKey(end) }
}

/* The month a date falls in: "2026-11-14" → "November 2026" */
export const monthOf = (date) => {
  const day = new Date(date)
  return monthLabel(day.getUTCFullYear(), day.getUTCMonth())
}

/*
 * Months to offer in the month picker, newest first: next month,
 * this month and the 10 before it, plus any month that already
 * has payroll records (older data stays reachable).
 */
export function payrollMonths(today = new Date(), existing = []) {
  const now = new Date(today)
  const labels = []

  for (let offset = 1; offset >= -10; offset -= 1) {
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1))
    labels.push(monthLabel(first.getUTCFullYear(), first.getUTCMonth()))
  }

  const sortKey = (label) => {
    const parsed = parseMonth(label)
    return parsed ? parsed.year * 12 + parsed.month : -1
  }

  return [...new Set([...labels, ...existing.filter((label) => parseMonth(label))])]
    .sort((a, b) => sortKey(b) - sortKey(a))
}

/*
 * Working days inside the month that the person was employed:
 * from the later of (month start, joining date) to the earlier of
 * (month end, last working day).
 */
export function employedWorkingDays(bounds, settings, { joiningDate, lastWorkingDay } = {}) {
  const from = [bounds.startKey, dayKey(joiningDate)].filter(Boolean).sort().at(-1)
  const to = [bounds.endKey, dayKey(lastWorkingDay)].filter(Boolean).sort()[0]

  if (from > to) return []
  return workingDates(from, to, settings)
}

/* Approved unpaid leave days that fall on the given working days. */
export function unpaidLeaveDays(leaves, employedDays) {
  const days = new Set(employedDays)
  const counted = new Set()

  for (const leave of leaves) {
    if (leave.type !== 'Unpaid' || leave.status !== 'Approved') continue
    for (const key of days) {
      if (key >= dayKey(leave.from) && key <= dayKey(leave.to)) counted.add(key)
    }
  }

  return counted.size
}

/*
 * "Unexplained" absences: attendance marked Absent on a working day
 * the person was employed (leave days are "On Leave", not Absent).
 * Days already counted as unpaid leave are not counted twice.
 */
export function absentDays(attendance, employedDays, leaves = []) {
  const days = new Set(employedDays)
  const onUnpaidLeave = (key) =>
    leaves.some((leave) => leave.type === 'Unpaid' && leave.status === 'Approved' &&
      key >= dayKey(leave.from) && key <= dayKey(leave.to))

  const absent = new Set(
    attendance
      .filter((entry) => entry.status === 'Absent')
      .map((entry) => dayKey(entry.date))
      .filter((key) => days.has(key) && !onUnpaidLeave(key)),
  )

  return absent.size
}

/*
 * The calculation itself. Every number the payslip shows comes
 * from here, so the page can explain how the net was reached.
 */
export function calculatePay({
  basic,
  allowances = 0,
  otherDeductions = 0,
  workingDays,
  employedDays = workingDays,
  unpaidDays = 0,
  absentDays: absences = 0,
}) {
  const gross = Number(basic || 0) + Number(allowances || 0)
  const payableDays = Math.max(0, employedDays - unpaidDays - absences)
  const dayRate = workingDays > 0 ? gross / workingDays : 0

  const earned = workingDays > 0 ? Math.round(gross * (payableDays / workingDays)) : 0
  const lossOfPay = gross - earned

  // Never pay below zero: extra deductions beyond the earned amount are capped.
  const other = Math.min(Number(otherDeductions || 0), earned)
  const net = earned - other

  return {
    gross,
    net,
    deductions: lossOfPay + other, // net = gross − deductions, as the Payroll model expects
    breakdown: {
      workingDays,
      employedDays,
      notEmployedDays: Math.max(0, workingDays - employedDays),
      unpaidDays,
      absentDays: absences,
      payableDays,
      dayRate: Math.round(dayRate * 100) / 100,
      lossOfPay,
      otherDeductions: other,
    },
  }
}
