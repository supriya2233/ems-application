import mongoose from 'mongoose'
import Employee from '../models/Employee.js'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import Payroll from '../models/Payroll.js'
import Onboarding from '../models/Onboarding.js'
import Performance from '../models/Performance.js'
import Document from '../models/Document.js'
import Asset from '../models/Asset.js'
import Task from '../models/Task.js'
import { calculateBalances } from './leaveRules.js'
import { getSettings } from './settingsService.js'

/*
 * Employee 360°: gather one person's records from every module.
 * The queries run in parallel (Promise.all), so the page needs one
 * request instead of nine.
 */

/* Pure helper (tested): count records by their status value. */
export function countBy(records, field) {
  return records.reduce((totals, record) => {
    const key = record[field] || 'Unknown'
    totals[key] = (totals[key] || 0) + 1
    return totals
  }, {})
}

/* Pure helper (tested): leave days per type and status. */
export function summariseLeave(leaves) {
  const summary = { approvedDays: 0, pendingDays: 0, byType: {} }

  for (const leave of leaves) {
    const days = Number(leave.days || 0)

    if (leave.status === 'Approved') {
      summary.approvedDays += days
      summary.byType[leave.type] = (summary.byType[leave.type] || 0) + days
    } else if (leave.status === 'Pending') {
      summary.pendingDays += days
    }
  }

  return summary
}

export async function getEmployeeOverview(idOrEmployeeId) {
  const query = mongoose.isValidObjectId(idOrEmployeeId)
    ? { _id: idOrEmployeeId }
    : { employeeId: idOrEmployeeId }

  const employee = await Employee.findOne(query).lean()

  if (!employee) return null

  const { employeeId } = employee
  const newestFirst = { createdAt: -1 }

  const [attendance, leaves, payroll, onboarding, reviews, documents, assets, tasks, settings] =
    await Promise.all([
      Attendance.find({ employeeId }).sort({ date: -1 }).limit(30).lean(),
      Leave.find({ employeeId }).sort({ from: -1 }).lean(),
      Payroll.find({ employeeId }).sort(newestFirst).lean(),
      Onboarding.find({ employeeId }).sort(newestFirst).lean(),
      Performance.find({ employeeId }).sort({ reviewDate: -1 }).lean(),
      Document.find({ employeeId }).sort(newestFirst).lean(),
      Asset.find({ employeeId }).sort(newestFirst).lean(),
      // Older tasks only stored the assignee's name, so match either.
      Task.find({
        $or: [{ assigneeId: employeeId }, { assigneeId: { $in: [null, ''] }, assignee: employee.name }],
      })
        .sort({ dueDate: 1 })
        .lean(),
      getSettings(),
    ])

  return {
    employee,
    attendance: {
      recent: attendance,
      summary: countBy(attendance, 'status'),
    },
    leave: {
      records: leaves,
      summary: summariseLeave(leaves),
      balances: calculateBalances(leaves, settings.leaveAllowances, new Date().getUTCFullYear()),
    },
    payroll,
    onboarding,
    reviews,
    documents,
    assets,
    tasks,
  }
}
