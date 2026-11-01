import Employee from '../models/Employee.js'
import Department from '../models/Department.js'
import Task from '../models/Task.js'
import Leave from '../models/Leave.js'
import Onboarding from '../models/Onboarding.js'
import { getOverdueSteps } from '../services/onboardingService.js'
import Offboarding from '../models/Offboarding.js'
import { getDocumentAlerts } from '../services/documentService.js'
import { leavingSoon } from '../services/offboardingService.js'
import { dayKey, startOfToday } from '../services/leaveRules.js'

const DAY_MS = 24 * 60 * 60 * 1000

/*
 * "Today at a glance": who is off, who is about to join, who is
 * about to leave. Short lists (a few names each) for the dashboard.
 */
export async function getToday(now = new Date(), { joinWindowDays = 30, limit = 6 } = {}) {
  const today = startOfToday(now)
  const joinUntil = new Date(today.getTime() + joinWindowDays * DAY_MS)

  const [onLeave, joiners, leavers] = await Promise.all([
    Leave.find({ status: 'Approved', from: { $lte: today }, to: { $gte: today } })
      .sort({ to: 1 })
      .lean(),
    Employee.find({
      $or: [{ status: 'Onboarding' }, { joiningDate: { $gte: today, $lte: joinUntil } }],
    })
      .sort({ joiningDate: 1 })
      .limit(limit)
      .lean(),
    Offboarding.find({ status: { $ne: 'Completed' } })
      .sort({ lastWorkingDay: 1 })
      .limit(limit)
      .lean(),
  ])

  return {
    date: dayKey(today),
    onLeave: onLeave.map((leave) => ({
      _id: leave._id,
      employeeId: leave.employeeId,
      name: leave.employee,
      department: leave.department,
      type: leave.type,
      from: leave.from,
      to: leave.to,
    })),
    joiners: joiners.map((employee) => ({
      _id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name,
      department: employee.department,
      role: employee.role,
      status: employee.status,
      joiningDate: employee.joiningDate,
    })),
    leavers: leavers.map((record) => ({
      _id: record._id,
      employeeId: record.employeeId,
      name: record.employeeName,
      department: record.department,
      reason: record.reason,
      lastWorkingDay: record.lastWorkingDay,
    })),
  }
}

export const getDashboard = async (req, res) => {
  try {
    // Employee statistics
    const totalEmployees = await Employee.countDocuments()

    const activeEmployees = await Employee.countDocuments({
      status: 'Active',
    })

    const employeesOnLeave = await Employee.countDocuments({
      status: 'On Leave',
    })

    // Department statistics
    const totalDepartments = await Department.countDocuments()

    // Task statistics
    const totalTasks = await Task.countDocuments()

    const todoTasks = await Task.countDocuments({
      status: 'To Do',
    })

    const inProgressTasks = await Task.countDocuments({
      status: 'In Progress',
    })

    const pendingTasks = await Task.countDocuments({
      status: 'Pending',
    })

    const completedTasks = await Task.countDocuments({
      status: 'Completed',
    })

    // Leave requests waiting for approval
    const pendingLeave = await Leave.countDocuments({ status: 'Pending' })

    // People still onboarding, and checklist steps past their due date
    const onboardingEmployees = await Employee.countDocuments({ status: 'Onboarding' })
    const openOnboarding = await Onboarding.countDocuments({ status: { $ne: 'Completed' } })
    const overdueSteps = (await getOverdueSteps()).length

    // People leaving, and documents that need someone
    const openOffboarding = await Offboarding.countDocuments({ status: { $ne: 'Completed' } })
    const leavingIn14Days = await leavingSoon(14)
    const documentAlerts = await getDocumentAlerts()
    const today = await getToday()

    // Overdue = due before today and not completed. A task due today
    // isn't late yet (same rule as the Tasks page).
    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: startOfToday() },
      status: { $ne: 'Completed' },
    })

    res.status(200).json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          onLeave: employeesOnLeave,
        },

        departments: {
          total: totalDepartments,
        },

        leave: {
          pending: pendingLeave,
        },

        // Same items as the Approvals inbox, counted.
        approvals: {
          waiting:
            pendingLeave +
            overdueSteps +
            documentAlerts.expiry.length +
            documentAlerts.unverified.length,
        },

        today,

        onboarding: {
          employees: onboardingEmployees,
          open: openOnboarding,
          overdueSteps,
        },

        offboarding: {
          open: openOffboarding,
          leavingSoon: leavingIn14Days,
        },

        documents: {
          expired: documentAlerts.expiry.filter((item) => item.state === 'expired').length,
          expiring: documentAlerts.expiry.filter((item) => item.state === 'expiring').length,
          unverified: documentAlerts.unverified.length,
        },

        tasks: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          pending: pendingTasks,
          completed: completedTasks,
          overdue: overdueTasks,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    })
  }
}