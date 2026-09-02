import Attendance from '../models/Attendance.js'

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
  try {
    const attendance =
      await Attendance.create(req.body)

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message,
    })
  }
}

export const updateAttendance = async (req, res) => {
  try {
    const attendance =
      await Attendance.findByIdAndUpdate(
        req.params.id,
        req.body,
        { returnDocument: 'after', runValidators: true },
      )

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update attendance',
      error: error.message,
    })
  }
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