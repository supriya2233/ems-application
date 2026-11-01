import Employee from '../models/Employee.js'
import Department from '../models/Department.js'
import Task from '../models/Task.js'
import Leave from '../models/Leave.js'
import Onboarding from '../models/Onboarding.js'
import { getOverdueSteps } from '../services/onboardingService.js'
import Offboarding from '../models/Offboarding.js'
import { getDocumentAlerts } from '../services/documentService.js'
import { leavingSoon } from '../services/offboardingService.js'

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

    // Overdue = due date has passed and task is not completed
    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: new Date() },
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