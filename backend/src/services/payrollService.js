import Attendance from '../models/Attendance.js'
import Employee from '../models/Employee.js'
import Leave from '../models/Leave.js'
import Offboarding from '../models/Offboarding.js'
import Payroll from '../models/Payroll.js'
import { AppError } from '../middleware/errorHandler.js'
import { publishChange } from './activity.js'
import { publish } from './events.js'
import { dayKey, fromDayKey, startOfToday, workingDates } from './leaveRules.js'
import {
  absentDays,
  calculatePay,
  employedWorkingDays,
  monthBounds,
  monthOf,
  payrollMonths,
  unpaidLeaveDays,
} from './payrollRules.js'
import { getSettings } from './settingsService.js'

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

/* Months for the picker (newest first). */
export async function getPayrollMonths(today = startOfToday()) {
  const existing = await Payroll.distinct('month')
  return payrollMonths(today, existing)
}

/*
 * Salary to use when generating: what was typed into the Generate
 * form, otherwise the person's most recent payroll record.
 */
function salaryFor(employeeId, latest, typed) {
  if (typed && Number(typed.basic) > 0) {
    return {
      basic: Number(typed.basic),
      allowances: Number(typed.allowances || 0),
      otherDeductions: Number(typed.otherDeductions || 0),
      source: 'Entered now',
    }
  }

  if (!latest) return null

  return {
    basic: latest.basic,
    allowances: latest.allowances || 0,
    // Records made by hand have no breakdown: their deductions are
    // regular ones (tax etc.). Generated ones keep loss of pay apart.
    otherDeductions: latest.breakdown?.workingDays ? latest.breakdown.otherDeductions || 0 : latest.deductions || 0,
    source: `Same as ${latest.month}`,
  }
}

/* Everything one month's calculation needs, loaded in parallel. */
async function loadMonthData(bounds, employeeIds) {
  const start = fromDayKey(bounds.startKey)
  const end = fromDayKey(bounds.endKey)
  const inList = employeeIds ? { employeeId: { $in: employeeIds } } : {}

  const [settings, leaves, attendance, offboardings] = await Promise.all([
    getSettings(),
    Leave.find({ ...inList, type: 'Unpaid', status: 'Approved', from: { $lte: end }, to: { $gte: start } }).lean(),
    Attendance.find({ ...inList, status: 'Absent', date: { $gte: start, $lte: end } }).lean(),
    Offboarding.find(inList).sort({ createdAt: -1 }).lean(),
  ])

  const byEmployee = (records) =>
    records.reduce((map, record) => {
      map[record.employeeId] = map[record.employeeId] || []
      map[record.employeeId].push(record)
      return map
    }, {})

  return {
    settings,
    leaves: byEmployee(leaves),
    attendance: byEmployee(attendance),
    // The newest offboarding decides the last working day.
    lastDay: Object.fromEntries(
      [...offboardings].reverse().map((record) => [record.employeeId, record.lastWorkingDay]),
    ),
  }
}

/* The full calculation for one employee in one month. */
function calculateFor(employee, salary, bounds, data, { lastWorkingDay } = {}) {
  const lastDay = lastWorkingDay ?? data.lastDay[employee.employeeId]
  const monthDays = workingDates(bounds.startKey, bounds.endKey, data.settings)
  const employed = employedWorkingDays(bounds, data.settings, {
    joiningDate: employee.joiningDate,
    lastWorkingDay: lastDay,
  })
  const leaves = data.leaves[employee.employeeId] || []

  return calculatePay({
    ...salary,
    workingDays: monthDays.length,
    employedDays: employed.length,
    unpaidDays: unpaidLeaveDays(leaves, employed),
    absentDays: absentDays(data.attendance[employee.employeeId] || [], employed, leaves),
  })
}

/*
 * POST /api/payroll/generate { month, preview: true, salaries }
 * One row per employee: either the calculation, or why they are
 * skipped. Nothing is saved.
 */
export async function previewPayroll(month, { salaries = {} } = {}) {
  const bounds = monthBounds(month)
  if (!bounds) throw new AppError(400, 'Choose a month, e.g. "November 2026"')

  const [employees, existing, previous, data] = await Promise.all([
    Employee.find().sort({ employeeId: 1 }).lean(),
    Payroll.find({ month: bounds.label }).lean(),
    Payroll.find({ month: { $ne: bounds.label } }).sort({ createdAt: -1 }).lean(),
    loadMonthData(bounds),
  ])

  const already = new Map(existing.map((record) => [record.employeeId, record]))
  const latest = new Map()
  for (const record of previous) {
    if (!latest.has(record.employeeId)) latest.set(record.employeeId, record)
  }

  const rows = employees.map((employee) => {
    const base = {
      employeeId: employee.employeeId,
      name: employee.name,
      department: employee.department,
      status: employee.status,
    }
    const lastDay = data.lastDay[employee.employeeId]

    if (already.has(employee.employeeId)) {
      return { ...base, state: 'exists', reason: `Already has ${bounds.label} payroll (${formatMoney(already.get(employee.employeeId).net)})` }
    }
    if (dayKey(employee.joiningDate) > bounds.endKey) {
      return { ...base, state: 'skipped', reason: 'Joins after this month' }
    }
    if (lastDay && dayKey(lastDay) < bounds.startKey) {
      return { ...base, state: 'skipped', reason: 'Left before this month' }
    }
    if (employee.status === 'Inactive' && !lastDay) {
      return { ...base, state: 'skipped', reason: 'Inactive' }
    }

    const salary = salaryFor(employee.employeeId, latest.get(employee.employeeId), salaries[employee.employeeId])
    if (!salary) {
      return { ...base, state: 'needs-salary', reason: 'No earlier payroll to copy the salary from' }
    }

    const pay = calculateFor(employee, salary, bounds, data)

    return {
      ...base,
      state: 'ready',
      salarySource: salary.source,
      basic: salary.basic,
      allowances: salary.allowances,
      lastWorkingDay: lastDay && dayKey(lastDay) <= bounds.endKey ? lastDay : null,
      ...pay,
    }
  })

  const ready = rows.filter((row) => row.state === 'ready')

  return {
    month: bounds.label,
    workingDays: workingDates(bounds.startKey, bounds.endKey, data.settings).length,
    rows,
    totals: {
      people: ready.length,
      gross: ready.reduce((sum, row) => sum + row.gross, 0),
      deductions: ready.reduce((sum, row) => sum + row.deductions, 0),
      net: ready.reduce((sum, row) => sum + row.net, 0),
    },
  }
}

/* POST /api/payroll/generate { month, salaries } → creates Draft records */
export async function generatePayroll(month, options = {}) {
  const preview = await previewPayroll(month, options)
  const ready = preview.rows.filter((row) => row.state === 'ready')

  if (ready.length === 0) {
    throw new AppError(409, `Nobody to generate for ${preview.month}. Check the list for the reasons.`)
  }

  const created = await Payroll.insertMany(
    ready.map((row) => ({
      employeeId: row.employeeId,
      employeeName: row.name,
      department: row.department,
      month: preview.month,
      basic: row.basic,
      allowances: row.allowances,
      deductions: row.deductions,
      net: row.net,
      status: 'Draft',
      type: row.lastWorkingDay ? 'Final settlement' : 'Regular',
      breakdown: row.breakdown,
    })),
  )

  // One event for the batch instead of one per person.
  publish({
    type: 'payroll.generated',
    module: 'payroll',
    action: 'generated',
    summary: `Generated ${preview.month} payroll for ${created.length} ${created.length === 1 ? 'person' : 'people'} (${formatMoney(preview.totals.net)} net)`,
    link: '/payroll',
    notify: {
      title: 'Payroll generated',
      message: `${preview.month}: ${created.length} draft ${created.length === 1 ? 'record' : 'records'}, ${formatMoney(preview.totals.net)} net. Review, then run payroll.`,
      tone: 'info',
    },
  })

  return { month: preview.month, created, preview }
}

/*
 * POST /api/payroll/:id/recalculate
 * Re-reads leave and attendance (e.g. unpaid leave approved after
 * the record was generated). Processed records are final.
 */
export async function recalculatePayroll(id) {
  const before = await Payroll.findById(id).lean()
  if (!before) throw new AppError(404, 'Payroll record not found')
  if (before.status === 'Processed') {
    throw new AppError(409, 'This payroll is already processed, so it can’t change')
  }

  const employee = await Employee.findOne({ employeeId: before.employeeId }).lean()
  if (!employee) throw new AppError(409, `Employee ${before.employeeId} no longer exists`)

  const bounds = monthBounds(before.month)
  if (!bounds) throw new AppError(409, `“${before.month}” isn’t a month this page can calculate`)

  const data = await loadMonthData(bounds, [employee.employeeId])
  const otherDeductions = before.breakdown?.workingDays ? before.breakdown.otherDeductions || 0 : before.deductions || 0
  const pay = calculateFor(employee, { basic: before.basic, allowances: before.allowances, otherDeductions }, bounds, data)

  const after = await Payroll.findByIdAndUpdate(
    id,
    { deductions: pay.deductions, net: pay.net, breakdown: pay.breakdown },
    { returnDocument: 'after', runValidators: true },
  ).lean()

  publishChange('payroll', 'updated', before, after, { notify: false })
  return after
}

/*
 * The final, pro-rated pay of someone leaving: the month of their
 * last working day, counting only the days up to it. Re-uses that
 * month's record when there is one (unless already processed).
 */
export async function createFinalSettlement(employee, lastWorkingDay) {
  const month = monthOf(lastWorkingDay)
  const bounds = monthBounds(month)

  const existing = await Payroll.findOne({ employeeId: employee.employeeId, month }).lean()
  if (existing?.status === 'Processed') return existing

  const latest = existing ?? (await Payroll.findOne({ employeeId: employee.employeeId }).sort({ createdAt: -1 }).lean())
  const salary = salaryFor(employee.employeeId, latest, null)
  if (!salary) {
    throw new AppError(409, `${employee.name} has no payroll record to base the settlement on. Add one on the Payroll page first.`)
  }

  const data = await loadMonthData(bounds, [employee.employeeId])
  const pay = calculateFor(employee, salary, bounds, data, { lastWorkingDay })

  const fields = {
    basic: salary.basic,
    allowances: salary.allowances,
    deductions: pay.deductions,
    net: pay.net,
    breakdown: pay.breakdown,
    type: 'Final settlement',
  }

  if (existing) {
    const after = await Payroll.findByIdAndUpdate(existing._id, fields, { returnDocument: 'after' }).lean()
    publishChange('payroll', 'updated', existing, after, { notify: false })
    return after
  }

  const created = await Payroll.create({
    ...fields,
    employeeId: employee.employeeId,
    employeeName: employee.name,
    department: employee.department,
    month,
    status: 'Pending',
  })
  publishChange('payroll', 'created', null, created.toObject(), { notify: false })
  return created.toObject()
}
