import Employee from '../models/Employee.js'
import Task from '../models/Task.js'

/*
 * Department numbers are calculated, not typed in.
 *
 * Before: headcount and task counts were form fields, so they
 * drifted (Marketing said 25 people while 0 were in it).
 * Now they are counted from the Employee and Task collections
 * every time departments are read.
 */

/* Pure function (easy to test): attach counts to each department. */
export function mergeDepartmentCounts(departments, employeeGroups, taskGroups) {
  const people = new Map(employeeGroups.map((group) => [group._id, group]))
  const work = new Map(taskGroups.map((group) => [group._id, group]))

  return departments.map((department) => {
    const staff = people.get(department.name) || {}
    const tasks = work.get(department.name) || {}

    return {
      ...department,
      employees: staff.employees || 0,
      active: staff.active || 0,
      openTasks: tasks.open || 0,
      completedTasks: tasks.completed || 0,
    }
  })
}

export async function withLiveCounts(departments) {
  const [employeeGroups, taskGroups] = await Promise.all([
    Employee.aggregate([
      {
        $group: {
          _id: '$department',
          employees: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
        },
      },
    ]),
    Task.aggregate([
      {
        $group: {
          _id: '$department',
          open: { $sum: { $cond: [{ $ne: ['$status', 'Completed'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        },
      },
    ]),
  ])

  const plain = departments.map((department) =>
    typeof department.toObject === 'function' ? department.toObject() : department,
  )

  return mergeDepartmentCounts(plain, employeeGroups, taskGroups)
}

// Fields the server owns; ignored if a browser sends them.
export const COMPUTED_DEPARTMENT_FIELDS = ['employees', 'active', 'openTasks', 'completedTasks']
