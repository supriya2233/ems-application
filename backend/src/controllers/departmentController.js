import Department from '../models/Department.js'
import Employee from '../models/Employee.js'
import { AppError } from '../middleware/errorHandler.js'
import { assignId } from '../services/idService.js'
import { propagateDepartmentRename } from '../services/employeeLink.js'
import { COMPUTED_DEPARTMENT_FIELDS, withLiveCounts } from '../services/departmentStats.js'

export const getDepartments = async (req, res) => {
  const departments = await Department.find().sort({ createdAt: -1 })
  const data = await withLiveCounts(departments)

  res.status(200).json({
    success: true,
    count: data.length,
    data,
  })
}

export const getDepartmentById = async (req, res) => {
  const department = await Department.findById(req.params.id)

  if (!department) {
    throw new AppError(404, 'Department not found')
  }

  const [data] = await withLiveCounts([department])

  res.status(200).json({
    success: true,
    data,
  })
}

export const createDepartment = async (req, res) => {
  const body = { ...req.body }
  COMPUTED_DEPARTMENT_FIELDS.forEach((field) => delete body[field])

  await assignId('departments', Department, body)

  const department = await Department.create(body)
  const [data] = await withLiveCounts([department])

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data,
  })
}

export const updateDepartment = async (req, res) => {
  const body = { ...req.body }
  delete body.departmentId
  COMPUTED_DEPARTMENT_FIELDS.forEach((field) => delete body[field])

  const before = await Department.findById(req.params.id).lean()

  if (!before) {
    throw new AppError(404, 'Department not found')
  }

  const department = await Department.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  // Renaming "Design" to "Product Design" moves its people too.
  await propagateDepartmentRename(before.name, department.name)

  const [data] = await withLiveCounts([department])

  res.status(200).json({
    success: true,
    message: 'Department updated successfully',
    data,
  })
}

export const deleteDepartment = async (req, res) => {
  const department = await Department.findById(req.params.id)

  if (!department) {
    throw new AppError(404, 'Department not found')
  }

  const members = await Employee.countDocuments({ department: department.name })

  if (members > 0) {
    throw new AppError(
      409,
      `${department.name} still has ${members} employee${members === 1 ? '' : 's'}. Move them to another department first.`,
    )
  }

  await department.deleteOne()

  res.status(200).json({
    success: true,
    message: 'Department deleted successfully',
  })
}
