import Department from '../models/Department.js'

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({
      createdAt: -1,
    })

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message,
    })
  }
}

export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(
      req.params.id,
    )

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      })
    }

    res.status(200).json({
      success: true,
      data: department,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department',
      error: error.message,
    })
  }
}

export const createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body)

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create department',
      error: error.message,
    })
  }
}

export const updateDepartment = async (req, res) => {
  try {
    const department =
      await Department.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        },
      )

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update department',
      error: error.message,
    })
  }
}

export const deleteDepartment = async (req, res) => {
  try {
    const department =
      await Department.findByIdAndDelete(
        req.params.id,
      )

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message,
    })
  }
}