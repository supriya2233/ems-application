import Employee from '../models/Employee.js'
import Department from '../models/Department.js'
import Task from '../models/Task.js'

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