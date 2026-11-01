import Employee from '../models/Employee.js'
import Onboarding from '../models/Onboarding.js'
import Recruitment from '../models/Recruitment.js'
import { AppError } from '../middleware/errorHandler.js'
import { publishChange } from './activity.js'
import { assertDepartmentExists } from './employeeLink.js'
import { publish } from './events.js'
import { assignId } from './idService.js'
import { dayKey, fromDayKey } from './leaveRules.js'
import { prepareOnboarding } from './onboardingService.js'

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern']

const formatDay = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/* Pure (tested): checks the Hire form and fills in defaults. */
export function hireDetails(candidate, input = {}) {
  const role = String(input.role || candidate.position || '').trim()
  const department = String(input.department || candidate.department || '').trim()
  const email = String(input.email || candidate.email || '').trim().toLowerCase()
  const joiningKey = dayKey(input.joiningDate)
  const employmentType = input.employmentType || 'Full-time'

  if (!role) throw new AppError(400, 'Enter the role the candidate is hired for')
  if (!department) throw new AppError(400, 'Choose a department')
  if (!joiningKey) throw new AppError(400, 'Choose a joining date')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError(400, 'Enter a valid work email')
  if (!EMPLOYMENT_TYPES.includes(employmentType)) {
    throw new AppError(400, `Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}`)
  }

  return {
    name: candidate.candidateName,
    role,
    department,
    email,
    phone: String(input.phone ?? candidate.phone ?? '').trim(),
    manager: String(input.manager || '').trim(),
    joiningDate: fromDayKey(joiningKey),
    employmentType,
  }
}

/*
 * The "Hire" action: one click does four things.
 *   1. creates the Employee (status "Onboarding")
 *   2. creates their Onboarding record with the dated checklist
 *   3. marks the candidate Hired and links the new employee
 *   4. sends one "New hire" notification
 *
 * MongoDB transactions need a replica set, which a local install
 * usually isn't, so if a later step fails the earlier ones are
 * undone by hand ("compensation").
 */
export async function hireCandidate(candidateId, input) {
  const candidate = await Recruitment.findById(candidateId).lean()
  if (!candidate) throw new AppError(404, 'Candidate not found')

  if (candidate.status === 'Hired') {
    throw new AppError(409, `${candidate.candidateName} has already been hired${candidate.employeeId ? ` (${candidate.employeeId})` : ''}.`)
  }
  if (candidate.status !== 'Selected') {
    throw new AppError(409, `Only selected candidates can be hired. ${candidate.candidateName} is at “${candidate.status}”.`)
  }

  const details = hireDetails(candidate, input)
  await assertDepartmentExists(details.department)

  if (await Employee.exists({ email: details.email })) {
    throw new AppError(409, `An employee with the email ${details.email} already exists`)
  }

  let employee = null
  let onboarding = null

  try {
    // 1. Employee
    const employeeBody = { ...details, status: 'Onboarding', candidateId: candidate.candidateId }
    await assignId('employees', Employee, employeeBody)
    employee = await Employee.create(employeeBody)

    // 2. Onboarding checklist
    const onboardingBody = prepareOnboarding({
      employeeId: employee.employeeId,
      employeeName: employee.name,
      department: employee.department,
      joiningDate: employee.joiningDate,
      onboardingType: 'New Hire',
      candidateId: candidate.candidateId,
      notes: `Hired from recruitment (${candidate.candidateId}) for ${details.role}.`,
    })
    await assignId('onboarding', Onboarding, onboardingBody)
    onboarding = await Onboarding.create(onboardingBody)

    // 3. Candidate
    const hiredCandidate = await Recruitment.findByIdAndUpdate(
      candidate._id,
      { status: 'Hired', employeeId: employee.employeeId, hiredAt: new Date() },
      { returnDocument: 'after' },
    ).lean()

    // 4. One notification for the whole action; the individual
    //    records go to the activity log only.
    publish({
      type: 'recruitment.hired',
      module: 'recruitment',
      action: 'hired',
      summary: `Hired ${employee.name} as ${employee.role} in ${employee.department}, joining ${formatDay(employee.joiningDate)}`,
      employeeId: employee.employeeId,
      entityId: String(candidate._id),
      link: `/employees/${employee.employeeId}`,
      notify: {
        title: 'New hire',
        message: `${employee.name} joins ${employee.department} as ${employee.role} on ${formatDay(employee.joiningDate)}. Onboarding has started.`,
        tone: 'success',
      },
    })
    publishChange('employees', 'created', null, employee, { notify: false })
    publishChange('onboarding', 'created', null, onboarding, { notify: false })

    return { employee: employee.toObject(), onboarding: onboarding.toObject(), candidate: hiredCandidate }
  } catch (error) {
    // Undo what was created so nothing is left half-done.
    if (onboarding) await Onboarding.deleteOne({ _id: onboarding._id }).catch(() => {})
    if (employee) await Employee.deleteOne({ _id: employee._id }).catch(() => {})
    throw error
  }
}
