import Employee from '../models/Employee.js'
import { AppError } from '../middleware/errorHandler.js'
import { assignId } from '../services/idService.js'
import { assertDepartmentExists, propagateEmployeeChange } from '../services/employeeLink.js'
import { getEmployeeOverview } from '../services/employeeOverview.js'
import { publishChange } from '../services/activity.js'

export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message,
    })
  }
}

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      })
    }

    res.status(200).json({
      success: true,
      data: employee,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message,
    })
  }
}

export const createEmployee = async (req, res) => {
  const body = { ...req.body }

  await assertDepartmentExists(body.department)
  await assignId('employees', Employee, body)

  const employee = await Employee.create(body)
  publishChange('employees', 'created', null, employee)

  res.status(201).json({
    success: true,
    message: 'Employee created successfully',
    data: employee,
  })
}

export const updateEmployee = async (req, res) => {
  const body = { ...req.body }
  delete body.employeeId // the ID links every other module; it never changes

  const before = await Employee.findById(req.params.id).lean()

  if (!before) {
    throw new AppError(404, 'Employee not found')
  }

  if (body.department !== undefined && body.department !== before.department) {
    await assertDepartmentExists(body.department)
  }

  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  await propagateEmployeeChange(before, employee)

  publishChange('employees', 'updated', before, employee)

  res.status(200).json({
    success: true,
    message: 'Employee updated successfully',
    data: employee,
  })
}

/*
 * GET /api/employees/:id/overview
 * Everything about one person, from every module, in one request.
 * :id can be the business ID (EMP001) or the database _id.
 */
export const getEmployeeOverviewHandler = async (req, res) => {
  const overview = await getEmployeeOverview(req.params.id)

  if (!overview) {
    throw new AppError(404, 'Employee not found')
  }

  res.json({
    success: true,
    data: overview,
  })
}

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id)

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      })
    }

    publishChange('employees', 'deleted', employee, null)

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message,
    })
  }
}
