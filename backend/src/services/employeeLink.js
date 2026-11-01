import Employee from '../models/Employee.js'
import Department from '../models/Department.js'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import Payroll from '../models/Payroll.js'
import Onboarding from '../models/Onboarding.js'
import Performance from '../models/Performance.js'
import Document from '../models/Document.js'
import Asset from '../models/Asset.js'
import Task from '../models/Task.js'
import Recruitment from '../models/Recruitment.js'
import Offboarding from '../models/Offboarding.js'
import { AppError } from '../middleware/errorHandler.js'

/*
 * "One source of truth" for employee details.
 *
 * Other modules keep a copy of the employee's name (and sometimes
 * department) next to the employeeId, so lists can show them
 * without an extra lookup. This is called denormalisation.
 * The rules here keep those copies correct:
 *
 *   1. On save, the server looks the employee up by ID and copies
 *      the real name/department in. Whatever the browser sent
 *      for those fields is ignored.
 *   2. When an employee is renamed or moves department, every copy
 *      is updated.
 */

// For each module: which field holds the employee ID, and which
// fields hold the copied name and department (null = no copy).
export const EMPLOYEE_LINKS = [
  { model: Attendance, label: 'attendance', idField: 'employeeId', nameField: 'employeeName', departmentField: 'department' },
  { model: Leave, label: 'leave', idField: 'employeeId', nameField: 'employee', departmentField: 'department' },
  { model: Payroll, label: 'payroll', idField: 'employeeId', nameField: 'employeeName', departmentField: 'department' },
  { model: Onboarding, label: 'onboarding', idField: 'employeeId', nameField: 'employeeName', departmentField: 'department' },
  { model: Performance, label: 'performance', idField: 'employeeId', nameField: 'employeeName', departmentField: 'department' },
  { model: Document, label: 'documents', idField: 'employeeId', nameField: 'employeeName', departmentField: null },
  { model: Asset, label: 'assets', idField: 'employeeId', nameField: 'employeeName', departmentField: null, optional: true },
  { model: Task, label: 'tasks', idField: 'assigneeId', nameField: 'assignee', departmentField: 'department' },
  { model: Offboarding, label: 'offboarding', idField: 'employeeId', nameField: 'employeeName', departmentField: 'department' },
]

export function getLink(model) {
  return EMPLOYEE_LINKS.find((link) => link.model === model)
}

/* The copied fields for one employee, e.g. { employeeName, department } */
export function snapshotFields(employee, link) {
  const fields = { [link.nameField]: employee.name }

  if (link.departmentField) {
    fields[link.departmentField] = employee.department
  }

  return fields
}

/*
 * Check the employee in `body` exists and copy their details in.
 * On updates that don't touch the employee, nothing happens.
 */
export async function linkEmployee(body, link, { isUpdate = false } = {}) {
  if (!(link.idField in body)) {
    if (isUpdate || link.optional) return body
    throw new AppError(400, 'Please select an employee')
  }

  const employeeId = String(body[link.idField] ?? '').trim()

  if (!employeeId) {
    if (link.optional) {
      // e.g. an asset returned to stock: no holder any more
      body[link.idField] = ''
      body[link.nameField] = ''
      return body
    }

    throw new AppError(400, 'Please select an employee')
  }

  const employee = await Employee.findOne({ employeeId }).lean()

  if (!employee) {
    throw new AppError(400, `Employee "${employeeId}" does not exist`)
  }

  body[link.idField] = employeeId
  Object.assign(body, snapshotFields(employee, link))

  return body
}

/* Department names must match a department record (when any exist). */
export async function assertDepartmentExists(name) {
  if (name === undefined) return

  const count = await Department.estimatedDocumentCount()
  if (count === 0) return

  const exists = await Department.exists({ name })

  if (!exists) {
    throw new AppError(400, `Department "${name}" does not exist. Create it on the Departments page first.`)
  }
}

/* After an employee edit: refresh every copy of their name/department. */
export async function propagateEmployeeChange(before, after) {
  const nameChanged = before.name !== after.name
  const departmentChanged = before.department !== after.department

  if (!nameChanged && !departmentChanged) return

  await Promise.all(
    EMPLOYEE_LINKS.map((link) =>
      link.model.updateMany(
        { [link.idField]: after.employeeId },
        { $set: snapshotFields(after, link) },
      ),
    ),
  )
}

/* After a department rename: update employees and every copy. */
export async function propagateDepartmentRename(oldName, newName) {
  if (!oldName || oldName === newName) return

  const models = [
    { model: Employee, field: 'department' },
    { model: Recruitment, field: 'department' },
    ...EMPLOYEE_LINKS.filter((link) => link.departmentField).map((link) => ({
      model: link.model,
      field: link.departmentField,
    })),
  ]

  await Promise.all(
    models.map(({ model, field }) =>
      model.updateMany({ [field]: oldName }, { $set: { [field]: newName } }),
    ),
  )
}
