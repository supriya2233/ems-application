import Leave from '../models/Leave.js'

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
  try {
    const leave =
      await Leave.create(req.body)

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to submit leave request',
      error: error.message,
    })
  }
}

export const updateLeave = async (req, res) => {
  try {
    const leave =
      await Leave.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        },
      )

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Leave request updated successfully',
      data: leave,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update leave request',
      error: error.message,
    })
  }
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