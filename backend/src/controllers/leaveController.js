import Leave from '../models/Leave.js'
import { AppError } from '../middleware/errorHandler.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'
import { publishChange } from '../services/activity.js'

export const getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().sort({
      from: 1,
      createdAt: -1,
    })

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message,
    })
  }
}

export const getLeaveById = async (req, res) => {
  try {
    const leave =
      await Leave.findById(req.params.id)

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      })
    }

    res.status(200).json({
      success: true,
      data: leave,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave request',
      error: error.message,
    })
  }
}

export const createLeave = async (req, res) => {
  const body = { ...req.body }
  await linkEmployee(body, getLink(Leave))

  const leave = await Leave.create(body)
  publishChange('leave', 'created', null, leave)

  res.status(201).json({
    success: true,
    message: 'Leave request created successfully',
    data: leave,
  })
}

export const updateLeave = async (req, res) => {
  const body = { ...req.body }
  await linkEmployee(body, getLink(Leave), { isUpdate: true })

  const before = await Leave.findById(req.params.id).lean()

  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  if (!leave) {
    throw new AppError(404, 'Leave request not found')
  }

  publishChange('leave', 'updated', before, leave)

  res.json({
    success: true,
    message: 'Leave request updated successfully',
    data: leave,
  })
}

export const deleteLeave = async (req, res) => {
  try {
    const leave =
      await Leave.findByIdAndDelete(
        req.params.id,
      )

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      })
    }

    publishChange('leave', 'deleted', leave, null)

    res.status(200).json({
      success: true,
      message: 'Leave request deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave request',
      error: error.message,
    })
  }
}
