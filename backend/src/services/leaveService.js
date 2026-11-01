import Attendance from '../models/Attendance.js'
import Employee from '../models/Employee.js'
import Leave from '../models/Leave.js'
import { AppError } from '../middleware/errorHandler.js'
import { publishChange } from './activity.js'
import {
  balanceWarning,
  calculateBalances,
  countWorkingDays,
  dayKey,
  describeCoverage,
  findOverlap,
  fromDayKey,
  startOfToday,
  workingDates,
} from './leaveRules.js'
import { getSettings } from './settingsService.js'

const formatDay = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/*
 * Called before a leave request is saved (create or edit).
 *  - dates are cleaned to whole days and `from` must not be after `to`
 *  - `days` is always counted here: working days only
 *  - an employee can't have two overlapping requests
 *
 * `current` is the saved record when editing (so missing fields
 * in an edit fall back to the saved values).
 */
export async function prepareLeave(body, current = null) {
  const employeeId = body.employeeId ?? current?.employeeId
  const fromKey = dayKey(body.from ?? current?.from)
  const toKey = dayKey(body.to ?? current?.to)

  if (!fromKey || !toKey) {
    throw new AppError(400, 'Choose a start and an end date')
  }

  if (fromKey > toKey) {
    throw new AppError(400, 'The end date can’t be before the start date')
  }

  const settings = await getSettings()
  const days = countWorkingDays(fromKey, toKey, settings)

  if (days === 0) {
    throw new AppError(400, 'Those dates are all weekends or holidays, so no leave is needed')
  }

  const existing = await Leave.find({ employeeId }).lean()
  const overlap = findOverlap(existing, fromKey, toKey, current?._id)

  if (overlap) {
    throw new AppError(
      409,
      `This overlaps another ${overlap.status.toLowerCase()} ${overlap.type} leave (${formatDay(overlap.from)} – ${formatDay(overlap.to)})`,
    )
  }

  body.from = fromDayKey(fromKey)
  body.to = fromDayKey(toKey)
  body.days = days
  delete body.workingDays

  return body
}

/* Leave balances for one employee and year. */
export async function getBalances(employeeId, year = startOfToday().getUTCFullYear(), { excludeId } = {}) {
  const [settings, leaves] = await Promise.all([
    getSettings(),
    Leave.find({ employeeId }).lean(),
  ])

  const counted = excludeId ? leaves.filter((leave) => String(leave._id) !== String(excludeId)) : leaves

  return calculateBalances(counted, settings.leaveAllowances, year)
}

/* Who else in the department is already off during this leave. */
export async function getCoverage(leave) {
  const [members, others] = await Promise.all([
    Employee.find({ department: leave.department, status: { $ne: 'Inactive' } }, { name: 1 }).lean(),
    Leave.find({
      department: leave.department,
      status: 'Approved',
      from: { $lte: new Date(leave.to) },
      to: { $gte: new Date(leave.from) },
    }).lean(),
  ])

  return describeCoverage(leave, members, others)
}

/*
 * Everything the request form shows while it is filled in:
 * working days, the balance, and any warnings. Nothing is saved.
 * Problems that would block saving come back as `error`.
 */
export async function previewLeave({ employeeId, type, from, to, excludeId }) {
  const employee = await Employee.findOne({ employeeId }).lean()

  if (!employee) {
    throw new AppError(400, `No employee with ID "${employeeId}"`)
  }

  const result = { days: 0, balance: null, warnings: [], error: '' }

  try {
    const body = await prepareLeave({ employeeId, type, from, to }, excludeId ? { _id: excludeId, employeeId } : null)
    result.days = body.days
  } catch (error) {
    if (!(error instanceof AppError)) throw error
    result.error = error.message
    return result
  }

  const year = new Date(from).getUTCFullYear()
  const balances = await getBalances(employeeId, year, { excludeId })
  result.balance = balances.find((balance) => balance.type === type) || null

  const overBalance = balanceWarning(result.balance, result.days)
  if (overBalance) result.warnings.push(overBalance)

  const coverage = await getCoverage({
    _id: excludeId,
    employeeId,
    department: employee.department,
    from,
    to,
  })
  if (coverage.message) result.warnings.push(coverage.message)

  return result
}

/*
 * Approved leave fills the attendance sheet with "On Leave" for
 * each working day. When the leave stops being approved (rejected,
 * cancelled, deleted, or its dates change) those entries go away.
 *
 * Days that already have a real attendance entry (e.g. "Present")
 * are left untouched.
 */
export async function syncLeaveAttendance(leave, { deleted = false } = {}) {
  const leaveId = String(leave._id)

  await Attendance.deleteMany({ leaveId })

  if (deleted || leave.status !== 'Approved') return 0

  const settings = await getSettings()
  const dates = workingDates(leave.from, leave.to, settings)

  const taken = await Attendance.find(
    { employeeId: leave.employeeId, date: { $in: dates.map(fromDayKey) } },
    { date: 1 },
  ).lean()
  const takenKeys = new Set(taken.map((entry) => dayKey(entry.date)))

  const entries = dates
    .filter((key) => !takenKeys.has(key))
    .map((key) => ({
      employeeId: leave.employeeId,
      employeeName: leave.employee,
      department: leave.department,
      date: fromDayKey(key),
      status: 'On Leave',
      leaveId,
    }))

  if (entries.length > 0) {
    await Attendance.insertMany(entries, { ordered: false })
  }

  return entries.length
}

/*
 * Employee status follows approved leave:
 *   Active   → On Leave  when approved leave covers today
 *   On Leave → Active    when it no longer does
 * Inactive employees are never touched.
 *
 * Pass an employeeId to check one person, or nothing for everyone.
 * Returns the number of employees whose status changed.
 */
export async function syncEmployeeLeaveStatus({ employeeId, today = startOfToday() } = {}) {
  const todayDate = fromDayKey(dayKey(today))

  const filter = { status: { $in: ['Active', 'On Leave'] } }
  if (employeeId) filter.employeeId = employeeId

  const [employees, onLeaveToday] = await Promise.all([
    Employee.find(filter).lean(),
    Leave.find({
      status: 'Approved',
      from: { $lte: todayDate },
      to: { $gte: todayDate },
      ...(employeeId && { employeeId }),
    }).distinct('employeeId'),
  ])

  const away = new Set(onLeaveToday)
  let changed = 0

  for (const employee of employees) {
    const shouldBe = away.has(employee.employeeId) ? 'On Leave' : 'Active'
    if (employee.status === shouldBe) continue

    const after = await Employee.findByIdAndUpdate(
      employee._id,
      { status: shouldBe },
      { returnDocument: 'after' },
    ).lean()

    publishChange('employees', 'updated', employee, after, { actor: 'System' })
    changed += 1
  }

  return changed
}

/* Everything that follows a leave change, in one place. */
export async function afterLeaveChange(leave, { deleted = false } = {}) {
  await syncLeaveAttendance(leave, { deleted })
  await syncEmployeeLeaveStatus({ employeeId: leave.employeeId })
}
