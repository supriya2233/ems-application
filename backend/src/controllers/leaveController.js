import Leave from '../models/Leave.js'
import { AppError } from '../middleware/errorHandler.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'
import { publishChange } from '../services/activity.js'
import {
  afterLeaveChange,
  getBalances,
  getCoverage,
  prepareLeave,
  previewLeave,
} from '../services/leaveService.js'
import { INACTIVE_STATUSES, startOfToday } from '../services/leaveRules.js'

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

  // Working days, overlap check (never trusts `days` from the browser)
  await prepareLeave(body)

  const leave = await Leave.create(body)
  // Announce first, so the activity log reads in the right order
  // ("requested" before "status changed to On Leave").
  publishChange('leave', 'created', null, leave)
  await afterLeaveChange(leave)

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

  if (!before) {
    throw new AppError(404, 'Leave request not found')
  }

  // Re-check the dates when they change, or when a rejected /
  // cancelled request comes back to life.
  const datesChanged = ['from', 'to', 'employeeId'].some((field) => body[field] !== undefined)
  const reactivated =
    INACTIVE_STATUSES.includes(before.status) &&
    body.status !== undefined &&
    !INACTIVE_STATUSES.includes(body.status)

  if (datesChanged || reactivated) {
    await prepareLeave(body, before)
  } else {
    delete body.days
  }

  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  publishChange('leave', 'updated', before, leave)

  // Old attendance entries are removed and, if approved, recreated.
  await afterLeaveChange(leave)
  if (before.employeeId !== leave.employeeId) {
    await afterLeaveChange(before, { deleted: true })
  }

  res.json({
    success: true,
    message: 'Leave request updated successfully',
    data: leave,
  })
}

export const deleteLeave = async (req, res) => {
  const leave = await Leave.findByIdAndDelete(req.params.id)

  if (!leave) {
    throw new AppError(404, 'Leave request not found')
  }

  publishChange('leave', 'deleted', leave, null)
  await afterLeaveChange(leave, { deleted: true })

  res.status(200).json({
    success: true,
    message: 'Leave request deleted successfully',
  })
}

/*
 * POST /api/leaves/preview
 * { employeeId, type, from, to, excludeId? }
 * → { days, balance, warnings, error }   (nothing is saved)
 */
export const previewLeaveHandler = async (req, res) => {
  const { employeeId, type, from, to, excludeId } = req.body

  if (!employeeId || !type || !from || !to) {
    throw new AppError(400, 'employeeId, type, from and to are required')
  }

  const data = await previewLeave({ employeeId, type, from, to, excludeId })

  res.json({ success: true, data })
}

// GET /api/leaves/balances/:employeeId?year=2026
export const getLeaveBalances = async (req, res) => {
  const year = Number(req.query.year) || startOfToday().getUTCFullYear()
  const data = await getBalances(req.params.employeeId, year)

  res.json({ success: true, year, data })
}

// GET /api/leaves/:id/coverage
export const getLeaveCoverage = async (req, res) => {
  const leave = await Leave.findById(req.params.id).lean()

  if (!leave) {
    throw new AppError(404, 'Leave request not found')
  }

  res.json({ success: true, data: await getCoverage(leave) })
}
