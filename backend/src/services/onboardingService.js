import Employee from '../models/Employee.js'
import Onboarding from '../models/Onboarding.js'
import { AppError } from '../middleware/errorHandler.js'
import { publishChange } from './activity.js'
import { assignAsset } from './assetService.js'
import { publish } from './events.js'
import { applyChecklist, overdueSteps, STEP_KEYS, stepLabel } from './onboardingRules.js'

const formatDay = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/* Before saving: due dates, completion times, derived status. */
export function prepareOnboarding(body, before = null) {
  delete body.status // always derived from the checklist
  delete body.stepDueDates
  delete body.stepCompletedAt
  delete body.overdueNotified

  Object.assign(body, applyChecklist(body, before))
  return body
}

/*
 * After a save. When the checklist is finished, an employee who is
 * still "Onboarding" becomes "Active" and gets a welcome notification.
 */
export async function afterOnboardingChange(before, after) {
  if (after.status !== 'Completed' || before?.status === 'Completed') return

  const employee = await Employee.findOne({ employeeId: after.employeeId }).lean()

  // Transfers / rehires: the person is already active.
  if (!employee || employee.status !== 'Onboarding') {
    publish({
      type: 'onboarding.finished',
      module: 'onboarding',
      action: 'finished',
      summary: `All onboarding steps done for ${after.employeeName}`,
      employeeId: after.employeeId,
      entityId: String(after._id),
      link: '/onboarding',
      notify: {
        title: 'Onboarding complete',
        message: `${after.employeeName} has finished onboarding.`,
        tone: 'success',
      },
    })
    return
  }

  const activated = await Employee.findByIdAndUpdate(
    employee._id,
    { status: 'Active' },
    { returnDocument: 'after' },
  ).lean()

  publishChange('employees', 'updated', employee, activated, { actor: 'System' })

  publish({
    type: 'employees.welcome',
    module: 'employees',
    action: 'welcome',
    summary: `${employee.name} finished onboarding and is now Active`,
    employeeId: employee.employeeId,
    entityId: String(employee._id),
    link: `/employees/${employee.employeeId}`,
    notify: {
      title: `Welcome aboard, ${employee.name.split(' ')[0]}!`,
      message: `${employee.name} finished onboarding and is now an active member of ${employee.department}.`,
      tone: 'success',
    },
  })
}

/*
 * PATCH /api/onboarding/:id/steps/:step  { done, assetId? }
 * Ticks (or unticks) one step. For the equipment step an available
 * asset can be handed over at the same time.
 */
export async function setStep(id, step, { done = true, assetId } = {}) {
  if (!STEP_KEYS.includes(step)) {
    throw new AppError(400, `Unknown onboarding step "${step}"`)
  }

  const before = await Onboarding.findById(id).lean()
  if (!before) throw new AppError(404, 'Onboarding record not found')

  const body = { [step]: Boolean(done) }

  if (step === 'equipment' && done && assetId) {
    await assignAsset(assetId, { employeeId: before.employeeId, note: 'Handed over during onboarding' })
    body.equipmentAssetId = assetId
  }

  prepareOnboarding(body, before)

  const after = await Onboarding.findByIdAndUpdate(id, body, { returnDocument: 'after', runValidators: true }).lean()

  // One activity line per tick; the status line only when it changes
  // (the welcome notification below covers "completed").
  if (before.status !== after.status) {
    publishChange('onboarding', 'updated', before, after, { notify: false })
  }
  if (before[step] !== after[step]) {
    publish({
      type: `onboarding.step-${done ? 'done' : 'reopened'}`,
      module: 'onboarding',
      action: done ? 'step-done' : 'step-reopened',
      summary: `${done ? 'Ticked off' : 'Reopened'} “${stepLabel(step)}” for ${after.employeeName}`,
      employeeId: after.employeeId,
      entityId: String(after._id),
      link: '/onboarding',
      notify: null,
    })
  }
  await afterOnboardingChange(before, after)

  return after
}

/* Every overdue step of unfinished onboarding (for the Approvals inbox). */
export async function getOverdueSteps(today = new Date()) {
  const records = await Onboarding.find({ status: { $ne: 'Completed' } }).lean()

  return records.flatMap((record) =>
    overdueSteps(record, today).map((step) => ({ record, step })),
  )
}

/*
 * Sends one "overdue" notification per step (remembered in
 * overdueNotified). Runs with the other scheduled jobs.
 */
export async function notifyOverdueSteps(today = new Date()) {
  const overdue = await getOverdueSteps(today)
  let sent = 0

  for (const { record, step } of overdue) {
    if ((record.overdueNotified || []).includes(step.key)) continue

    await Onboarding.updateOne({ _id: record._id }, { $addToSet: { overdueNotified: step.key } })

    publish({
      actor: 'System',
      type: 'onboarding.step-overdue',
      module: 'onboarding',
      action: 'step-overdue',
      summary: `“${step.label}” for ${record.employeeName} is overdue (was due ${formatDay(step.dueDate)})`,
      employeeId: record.employeeId,
      entityId: String(record._id),
      link: '/approvals',
      notify: {
        title: 'Onboarding step overdue',
        message: `“${step.label}” for ${record.employeeName} was due ${formatDay(step.dueDate)}.`,
        tone: 'warning',
      },
    })
    sent += 1
  }

  return sent
}
