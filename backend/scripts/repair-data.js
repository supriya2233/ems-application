/*
 * One-time data check & repair for Phase 2.
 *
 *   npm run repair-data              report only (changes nothing)
 *   npm run repair-data -- --apply   also applies the safe fixes
 *
 * Safe fixes (applied with --apply):
 *   - copied employee names/departments that differ from the employee
 *   - tasks that only have an assignee *name* get the matching
 *     employee ID, when exactly one employee has that name
 *
 * Reported only (need a person to decide):
 *   - records pointing to an employee ID that does not exist
 *   - employees whose department is not a department record
 *   - task assignees that match no employee
 */
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import Employee from '../src/models/Employee.js'
import Department from '../src/models/Department.js'
import Task from '../src/models/Task.js'
import { EMPLOYEE_LINKS, snapshotFields } from '../src/services/employeeLink.js'
import { withLiveCounts } from '../src/services/departmentStats.js'

dotenv.config()

const APPLY = process.argv.includes('--apply')

const line = (text = '') => console.log(text)
const heading = (text) => line(`\n=== ${text} ===`)

async function main() {
  await mongoose.connect(process.env.MONGO_URI)

  line(APPLY ? 'Mode: APPLY (safe fixes will be saved)' : 'Mode: REPORT ONLY (nothing will be changed)')

  const employees = await Employee.find().lean()
  const byId = new Map(employees.map((employee) => [employee.employeeId, employee]))
  const departments = await Department.find().lean()
  const departmentNames = new Set(departments.map((department) => department.name))

  let fixable = 0
  let manual = 0

  // 1. Employees in a department that doesn't exist -------------
  heading('Employees whose department is not a department record')
  for (const employee of employees) {
    if (departmentNames.has(employee.department)) continue

    manual += 1
    const guess = departments.find((department) =>
      department.name.toLowerCase().startsWith(employee.department.toLowerCase().slice(0, 4)),
    )
    line(`- ${employee.employeeId} ${employee.name}: "${employee.department}"` +
      (guess ? `  (did you mean "${guess.name}"?)` : ''))
  }
  line('  → Fix on the Employees page by choosing a department from the list.')

  // 2 & 3. Each linked module ------------------------------------
  for (const link of EMPLOYEE_LINKS) {
    const records = await link.model.find().lean()
    const missing = []
    const stale = []

    for (const record of records) {
      const id = record[link.idField]
      if (!id) continue // tasks without an ID are handled below; unassigned assets are fine

      const employee = byId.get(id)
      if (!employee) {
        missing.push(record)
        continue
      }

      const expected = snapshotFields(employee, link)
      const differs = Object.entries(expected).some(([field, value]) => record[field] !== value)
      if (differs) stale.push({ record, expected })
    }

    if (missing.length === 0 && stale.length === 0) continue

    heading(`${link.label}`)

    for (const record of missing) {
      manual += 1
      line(`- unknown employee "${record[link.idField]}" on record ${record._id}`)
    }

    for (const { record, expected } of stale) {
      fixable += 1
      const changes = Object.entries(expected)
        .filter(([field, value]) => record[field] !== value)
        .map(([field, value]) => `${field}: "${record[field]}" → "${value}"`)
        .join(', ')
      line(`- ${record[link.idField]} (${record._id}): ${changes}`)

      if (APPLY) {
        await link.model.updateOne({ _id: record._id }, { $set: expected })
      }
    }
  }

  // 4. Tasks that only have an assignee name ---------------------
  heading('Tasks without an assignee ID')
  const tasks = await Task.find({ assigneeId: { $in: [null, ''] } }).lean()

  for (const task of tasks) {
    const matches = employees.filter(
      (employee) => employee.name.trim().toLowerCase() === String(task.assignee).trim().toLowerCase(),
    )

    if (matches.length === 1) {
      fixable += 1
      const [employee] = matches
      line(`- ${task.taskId} "${task.title}": "${task.assignee}" → ${employee.employeeId} ${employee.name}`)

      if (APPLY) {
        await Task.updateOne(
          { _id: task._id },
          { $set: { assigneeId: employee.employeeId, assignee: employee.name, department: employee.department } },
        )
      }
    } else {
      manual += 1
      line(`- ${task.taskId} "${task.title}": "${task.assignee}" matches ${matches.length === 0 ? 'no employee' : 'several employees'}` +
        ' → reassign it on the Tasks page')
    }
  }

  // 5. Department numbers (information only) ---------------------
  heading('Department numbers: typed-in vs calculated')
  const live = await withLiveCounts(departments)
  for (const department of live) {
    const stored = departments.find((item) => item._id.equals(department._id))
    line(`- ${department.name}: employees ${stored.employees} → ${department.employees}, ` +
      `open tasks ${stored.openTasks} → ${department.openTasks}`)
  }
  line('  → No action needed: the API now always returns the calculated numbers.')

  heading('Summary')
  line(`${fixable} safe fix(es) ${APPLY ? 'applied' : 'available (run with --apply)'}`)
  line(`${manual} item(s) need a decision in the app`)

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await mongoose.disconnect()
  process.exit(1)
})
