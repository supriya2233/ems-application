import Attendance from '../models/Attendance.js'
import { AppError } from '../middleware/errorHandler.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'
import { publishChange } from '../services/activity.js'

export const getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find().sort({
      date: -1,
      createdAt: -1,
    })

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message,
    })
  }
}

export const getAttendanceById = async (req, res) => {
  try {
    const attendance =
      await Attendance.findById(req.params.id)

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      })
    }

    res.status(200).json({
      success: true,
      data: attendance,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance record',
      error: error.message,
    })
  }
}

export const createAttendance = async (req, res) => {
  const body = { ...req.body }
  await linkEmployee(body, getLink(Attendance))

  const attendance = await Attendance.create(body)
  publishChange('attendance', 'created', null, attendance)

  res.status(201).json({
    success: true,
    message: 'Attendance record created successfully',
    data: attendance,
  })
}

export const updateAttendance = async (req, res) => {
  const body = { ...req.body }
  await linkEmployee(body, getLink(Attendance), { isUpdate: true })

  const before = await Attendance.findById(req.params.id).lean()

  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  if (!attendance) {
    throw new AppError(404, 'Attendance record not found')
  }

  publishChange('attendance', 'updated', before, attendance)

  res.json({
    success: true,
    message: 'Attendance record updated successfully',
    data: attendance,
  })
}

export const deleteAttendance = async (req, res) => {
  try {
    const attendance =
      await Attendance.findByIdAndDelete(
        req.params.id,
      )

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      })
    }

    publishChange('attendance', 'deleted', attendance, null)

    res.status(200).json({
      success: true,
      message: 'Attendance deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance',
      error: error.message,
    })
  }
}
