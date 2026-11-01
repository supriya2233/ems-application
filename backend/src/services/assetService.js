import Asset from '../models/Asset.js'
import Employee from '../models/Employee.js'
import { AppError } from '../middleware/errorHandler.js'
import { publishChange } from './activity.js'

/*
 * Pure (tested): the new history after an asset changes hands.
 *   - the open entry (no returnedAt) of the previous holder is closed
 *   - a new open entry is added for the new holder
 * `before` is null for a new asset.
 */
export function nextHistory(history = [], before, after, { at = new Date(), note = '' } = {}) {
  const previousHolder = before?.employeeId || ''
  const newHolder = after.employeeId || ''

  if (previousHolder === newHolder) return history

  const next = history.map((entry) =>
    !entry.returnedAt && entry.employeeId === previousHolder
      ? { ...entry, returnedAt: at, conditionIn: after.condition, ...(note && !newHolder && { note }) }
      : entry,
  )

  if (newHolder) {
    next.push({
      employeeId: newHolder,
      employeeName: after.employeeName,
      assignedAt: after.assignedDate || at,
      conditionOut: after.condition,
      ...(note && { note }),
    })
  }

  return next
}

/*
 * Keeps the history right however the holder changed: through
 * assign/return below, or through the normal edit form.
 */
export async function recordAssignmentChange(before, after, options) {
  const history = nextHistory(after.history || before?.history || [], before, after, options)

  if (history !== (after.history || before?.history || [])) {
    await Asset.updateOne({ _id: after._id }, { $set: { history } })
  }

  return history
}

const toDate = (value) => (value ? new Date(value) : new Date())

/* Hand an available asset to an employee. */
export async function assignAsset(id, { employeeId, date, condition, note = '' } = {}) {
  const before = await Asset.findById(id).lean()
  if (!before) throw new AppError(404, 'Asset not found')

  if (before.status !== 'Available' || before.employeeId) {
    throw new AppError(
      409,
      before.employeeId
        ? `${before.assetName} is already with ${before.employeeName}. Return it first.`
        : `${before.assetName} is ${before.status.toLowerCase()} and can’t be assigned.`,
    )
  }

  const employee = await Employee.findOne({ employeeId }).lean()
  if (!employee) throw new AppError(400, `No employee with ID "${employeeId}"`)

  const update = {
    employeeId: employee.employeeId,
    employeeName: employee.name,
    assignedDate: toDate(date),
    status: 'Assigned',
    ...(condition && { condition }),
  }

  const after = await Asset.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true }).lean()
  after.history = await recordAssignmentChange(before, after, { at: update.assignedDate, note })

  publishChange('assets', 'updated', before, after)
  return after
}

/* Take an asset back. Damaged assets go to maintenance. */
export async function returnAsset(id, { date, condition, note = '' } = {}) {
  const before = await Asset.findById(id).lean()
  if (!before) throw new AppError(404, 'Asset not found')

  if (!before.employeeId) {
    throw new AppError(409, `${before.assetName} isn’t assigned to anyone.`)
  }

  const finalCondition = condition || before.condition

  const after = await Asset.findByIdAndUpdate(
    id,
    {
      employeeId: '',
      employeeName: '',
      $unset: { assignedDate: 1 },
      condition: finalCondition,
      status: ['Damaged', 'Poor'].includes(finalCondition) ? 'Under Maintenance' : 'Available',
    },
    { returnDocument: 'after', runValidators: true },
  ).lean()

  after.history = await recordAssignmentChange(before, after, { at: toDate(date), note })

  publishChange('assets', 'updated', before, after)
  return after
}
