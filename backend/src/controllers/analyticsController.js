import Employee from '../models/Employee.js'
import Offboarding from '../models/Offboarding.js'
import Leave from '../models/Leave.js'
import Attendance from '../models/Attendance.js'
import Payroll from '../models/Payroll.js'
import Task from '../models/Task.js'
import { LEAVE_TYPES, fromDayKey, startOfToday, todayKey } from '../services/leaveRules.js'
import { getSettings } from '../services/settingsService.js'
import {
  attendanceByMonth,
  attendanceSummary,
  attritionRate,
  averageTenure,
  countBy,
  headcountTrend,
  leaveByMonth,
  leavingDates,
  monthRange,
  payrollByMonth,
  tasksByDepartment,
} from '../services/analyticsRules.js'

export const PERIODS = [3, 6, 12]
const ATTENDANCE_STATUSES = ['Present', 'WFH', 'Late', 'Absent', 'On Leave']
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern']

/*
 * GET /api/analytics?months=12
 * Everything the Analytics page shows, for the last N months.
 */
export const getAnalytics = async (req, res) => {
  const months = PERIODS.includes(Number(req.query.months)) ? Number(req.query.months) : 12
  const today = startOfToday()
  const range = monthRange(today, months)
  const from = fromDayKey(range[0].startKey)
  const to = fromDayKey(range.at(-1).endKey)

  const [employees, offboardings, leaves, attendance, payrolls, tasks, settings] = await Promise.all([
    Employee.find().lean(),
    Offboarding.find().lean(),
    Leave.find({ status: 'Approved', from: { $lte: to }, to: { $gte: from } }).lean(),
    Attendance.find({ date: { $gte: from, $lte: to } }).lean(),
    Payroll.find({ month: { $in: range.map((month) => month.long) } }).lean(),
    Task.find().lean(),
    getSettings(),
  ])

  const left = leavingDates(employees, offboardings)
  const trend = headcountTrend(employees, left, range)
  const current = employees.filter((person) => person.status !== 'Inactive')
  const leave = leaveByMonth(leaves, range, settings, LEAVE_TYPES)
  const payroll = payrollByMonth(payrolls, range)
  const lastPaid = [...payroll].reverse().find((item) => item.net > 0) || null

  res.status(200).json({
    success: true,
    data: {
      period: { months, from: range[0].startKey, to: range.at(-1).endKey, today: todayKey() },
      summary: {
        headcount: current.length,
        active: employees.filter((person) => person.status === 'Active').length,
        onboarding: employees.filter((person) => person.status === 'Onboarding').length,
        hires: trend.reduce((sum, item) => sum + item.hires, 0),
        exits: trend.reduce((sum, item) => sum + item.exits, 0),
        attritionRate: attritionRate(trend),
        averageTenureYears: averageTenure(employees, todayKey()),
        leaveDays: leave.reduce((sum, item) => sum + item.total, 0),
        attendanceRate: attendanceSummary(attendance, ATTENDANCE_STATUSES).rate,
        lastPayroll: lastPaid && { month: lastPaid.month, label: lastPaid.label, net: lastPaid.net, people: lastPaid.people },
      },
      headcount: trend,
      departments: countBy(current, 'department'),
      employmentTypes: countBy(current, 'employmentType', EMPLOYMENT_TYPES),
      leave: { types: LEAVE_TYPES, months: leave },
      attendance: {
        ...attendanceSummary(attendance, ATTENDANCE_STATUSES),
        months: attendanceByMonth(attendance, range),
      },
      payroll,
      tasks: tasksByDepartment(tasks, todayKey()),
    },
  })
}
