import Performance from '../models/Performance.js'
import { AppError } from '../middleware/errorHandler.js'
import { assignId } from '../services/idService.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'
import { publishChange } from '../services/activity.js'

export const getPerformanceRecords = async (req, res) => {
  try {
    const records = await Performance.find().sort({
      createdAt: -1,
    })

    res.json({
      success: true,
      count: records.length,
      data: records,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getPerformanceById = async (req, res) => {
  try {
    const record = await Performance.findById(req.params.id)

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Performance record not found',
      })
    }

    res.json({
      success: true,
      data: record,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const createPerformance = async (req, res) => {
  const body = { ...req.body }
  await linkEmployee(body, getLink(Performance))
  await assignId('performance', Performance, body)

  const record = await Performance.create(body)
  publishChange('performance', 'created', null, record)

  res.status(201).json({
    success: true,
    message: 'Performance review created successfully',
    data: record,
  })
}

export const updatePerformance = async (req, res) => {
  const body = { ...req.body }
  delete body.reviewId // IDs never change after creation
  await linkEmployee(body, getLink(Performance), { isUpdate: true })

  const before = await Performance.findById(req.params.id).lean()

  const record = await Performance.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  if (!record) {
    throw new AppError(404, 'Performance review not found')
  }

  publishChange('performance', 'updated', before, record)

  res.json({
    success: true,
    message: 'Performance review updated successfully',
    data: record,
  })
}

export const deletePerformance = async (req, res) => {
  try {
    const record = await Performance.findByIdAndDelete(
      req.params.id,
    )

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Performance record not found',
      })
    }

    publishChange('performance', 'deleted', record, null)

    res.json({
      success: true,
      message: 'Performance record deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
