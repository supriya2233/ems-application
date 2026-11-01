import Asset from '../models/Asset.js'
import Employee from '../models/Employee.js'
import Offboarding from '../models/Offboarding.js'
import { AppError } from '../middleware/errorHandler.js'
import { publishChange } from './activity.js'
import { returnAsset } from './assetService.js'
import { publish } from './events.js'
import { assignId } from './idService.js'
import { dayKey, fromDayKey, startOfToday } from './leaveRules.js'
import {
  buildChecklist,
  deriveOffboardingStatus,
  OFFBOARDING_REASONS,
  withAssetItems,
} from './offboardingRules.js'
import { createFinalSettlement } from './payrollService.js'

const formatDay = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

function checkReason(reason) {
  if (reason && !OFFBOARDING_REASONS.includes(reason)) {
    throw new AppError(400, `Reason must be one of: ${OFFBOARDING_REASONS.join(', ')}`)
  }
}

/*
 * POST /api/offboarding { employeeId, lastWorkingDay, reason, notes }
 * Builds the checklist from the assets the person holds right now.
 */
export async function startOffboarding({ employeeId, lastWorkingDay, reason = 'Resignation', notes = '' } = {}) {
  const employee = await Employee.findOne({ employeeId }).lean()
  if (!employee) throw new AppError(400, `No employee with ID "${employeeId}"`)
  if (employee.status === 'Inactive') throw new AppError(409, `${employee.name} is already inactive`)

  const lastKey = dayKey(lastWorkingDay)
  if (!lastKey) throw new AppError(400, 'Choose the last working day')
  if (lastKey < dayKey(employee.joiningDate)) {
    throw new AppError(400, 'The last working day can’t be before the joining date')
  }
  checkReason(reason)

  const open = await Offboarding.findOne({ employeeId, status: { $ne: 'Completed' } }).lean()
  if (open) throw new AppError(409, `${employee.name} is already being offboarded (${open.offboardingId})`)

  const assets = await Asset.find({ employeeId }).sort({ assetId: 1 }).lean()
  const items = buildChecklist(assets)

  const body = {
    employeeId,
    employeeName: employee.name,
    department: employee.department,
    lastWorkingDay: fromDayKey(lastKey),
    reason,
    notes: String(notes || '').trim(),
    items,
    status: deriveOffboardingStatus(items),
  }
  await assignId('offboarding', Offboarding, body)

  const record = (await Offboarding.create(body)).toObject()
  publishChange('offboarding', 'created', null, record)
  return record
}

/* PUT /api/offboarding/:id: last day, reason and notes only. */
export async function updateOffboarding(id, input = {}) {
  const before = await Offboarding.findById(id).lean()
  if (!before) throw new AppError(404, 'Offboarding record not found')

  const update = {}
  if (input.notes !== undefined) update.notes = String(input.notes || '').trim()

  if (before.status !== 'Completed') {
    if (input.reason !== undefined) {
      checkReason(input.reason)
      update.reason = input.reason
    }
    if (input.lastWorkingDay !== undefined) {
      const lastKey = dayKey(input.lastWorkingDay)
      if (!lastKey) throw new AppError(400, 'Choose the last working day')
      update.lastWorkingDay = fromDayKey(lastKey)
    }
  } else if (input.lastWorkingDay !== undefined || input.reason !== undefined) {
    throw new AppError(409, 'This offboarding is finished; only the notes can change')
  }

  const after = await Offboarding.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true }).lean()
  publishChange('offboarding', 'updated', before, after)
  return after
}

/*
 * List / one record. Assets handed over after offboarding started
 * are added to open checklists as new "return" items.
 */
async function withCurrentAssets(record) {
  if (record.status === 'Completed') return record

  const assets = await Asset.find({ employeeId: record.employeeId }).lean()
  const items = withAssetItems(record.items, assets)
  if (items === record.items) return record

  return Offboarding.findByIdAndUpdate(
    record._id,
    { items, status: deriveOffboardingStatus(items) },
    { returnDocument: 'after' },
  ).lean()
}

export async function listOffboardings() {
  const records = await Offboarding.find().sort({ lastWorkingDay: 1 }).lean()
  return Promise.all(records.map(withCurrentAssets))
}

export async function getOffboarding(id) {
  const record = await Offboarding.findById(id).lean()
  if (!record) throw new AppError(404, 'Offboarding record not found')
  return withCurrentAssets(record)
}

/*
 * PATCH /api/offboarding/:id/items/:key { done, condition, note }
 *   asset item       → the asset is returned (condition decides
 *                      Available or Under Maintenance)
 *   final settlement → the pro-rated last payroll is created
 * Ticking the last item finishes the offboarding.
 */
export async function setItem(id, key, { done = true, condition, note = '' } = {}) {
  const before = await getOffboarding(id)
  if (before.status === 'Completed') {
    throw new AppError(409, 'This offboarding is finished; the checklist can’t change any more')
  }

  const item = before.items.find((entry) => entry.key === key)
  if (!item) throw new AppError(404, `No checklist item "${key}"`)
  if (item.done === Boolean(done)) return before

  const patch = { done: Boolean(done), doneAt: done ? new Date() : undefined, note: String(note || '').trim() || item.note }
  let payrollId = before.payrollId

  if (done && item.kind === 'asset') {
    const asset = await Asset.findById(item.assetId).lean()
    // Only take it back if they still have it (it may have been returned on the Assets page).
    if (asset && asset.employeeId === before.employeeId) {
      await returnAsset(item.assetId, { condition, note: note || 'Returned at offboarding' })
    }
  }

  if (!done && item.kind === 'asset') {
    throw new AppError(409, 'The asset is already back in stock. To hand it out again, use Assign on the Assets page.')
  }

  if (done && item.kind === 'settlement') {
    const employee = await Employee.findOne({ employeeId: before.employeeId }).lean()
    if (!employee) throw new AppError(409, `Employee ${before.employeeId} no longer exists`)
    const payroll = await createFinalSettlement(employee, before.lastWorkingDay)
    payrollId = String(payroll._id)
    patch.note = patch.note || `${payroll.month}: ₹${Number(payroll.net).toLocaleString('en-IN')} net (${payroll.breakdown?.payableDays ?? '?'} of ${payroll.breakdown?.workingDays ?? '?'} working days)`
  }

  const items = before.items.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry))
  const status = deriveOffboardingStatus(items)

  const after = await Offboarding.findByIdAndUpdate(
    id,
    { items, status, payrollId },
    { returnDocument: 'after', runValidators: true },
  ).lean()

  publish({
    type: `offboarding.item-${done ? 'done' : 'reopened'}`,
    module: 'offboarding',
    action: done ? 'item-done' : 'item-reopened',
    summary: `${done ? 'Ticked off' : 'Reopened'} “${item.label}” for ${after.employeeName}`,
    employeeId: after.employeeId,
    entityId: String(after._id),
    link: '/offboarding',
    notify: null,
  })

  if (status === 'Completed') return completeOffboarding(after)
  return after
}

/*
 * The checklist is done: any asset still with the person goes back
 * to stock, the employee becomes Inactive, and everyone is told.
 */
async function completeOffboarding(record) {
  const leftover = await Asset.find({ employeeId: record.employeeId }).lean()
  for (const asset of leftover) {
    await returnAsset(asset._id, { note: 'Returned automatically when offboarding finished' })
  }

  const employee = await Employee.findOne({ employeeId: record.employeeId }).lean()
  if (employee && employee.status !== 'Inactive') {
    const inactive = await Employee.findByIdAndUpdate(employee._id, { status: 'Inactive' }, { returnDocument: 'after' }).lean()
    publishChange('employees', 'updated', employee, inactive, { actor: 'System' })
  }

  const after = await Offboarding.findByIdAndUpdate(record._id, { completedAt: new Date() }, { returnDocument: 'after' }).lean()

  publish({
    type: 'offboarding.completed',
    module: 'offboarding',
    action: 'completed',
    summary: `Finished offboarding ${record.employeeName}; now Inactive`,
    employeeId: record.employeeId,
    entityId: String(record._id),
    link: `/employees/${record.employeeId}`,
    notify: {
      title: 'Offboarding complete',
      message: `${record.employeeName} (${record.department}) has left. Last working day ${formatDay(record.lastWorkingDay)}${leftover.length ? `; ${leftover.length} more asset(s) returned to stock` : ''}.`,
      tone: 'info',
    },
  })

  return after
}

/* Unfinished offboardings whose last day is close (dashboard). */
export async function leavingSoon(days = 14, today = startOfToday()) {
  const start = fromDayKey(dayKey(today))
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000)
  return Offboarding.countDocuments({ status: { $ne: 'Completed' }, lastWorkingDay: { $gte: start, $lte: end } })
}
