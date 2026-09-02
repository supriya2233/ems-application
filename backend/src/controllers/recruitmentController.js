import Recruitment from '../models/Recruitment.js'

export const getRecruitments = async (
  req,
  res,
) => {
  try {
    const {
      status,
      department,
      position,
    } = req.query

    const filter = {}

    if (status) {
      filter.status = status
    }

    if (department) {
      filter.department = department
    }

    if (position) {
      filter.position = position
    }

    const recruitments =
      await Recruitment.find(filter).sort({
        createdAt: -1,
      })

    res.json({
      success: true,
      count: recruitments.length,
      data: recruitments,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to fetch recruitment records',
      error: error.message,
    })
  }
}


export const getRecruitment = async (
  req,
  res,
) => {
  try {
    const recruitment =
      await Recruitment.findById(
        req.params.id,
      )

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        message:
          'Recruitment record not found',
      })
    }

    res.json({
      success: true,
      data: recruitment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to fetch recruitment record',
      error: error.message,
    })
  }
}


export const createRecruitment = async (
  req,
  res,
) => {
  try {
    const recruitment =
      await Recruitment.create(
        req.body,
      )

    res.status(201).json({
      success: true,
      message:
        'Recruitment candidate created successfully',
      data: recruitment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to create recruitment candidate',
      error: error.message,
    })
  }
}


export const updateRecruitment = async (
  req,
  res,
) => {
  try {
    const recruitment =
      await Recruitment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { returnDocument: 'after', runValidators: true },
      )

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        message:
          'Recruitment record not found',
      })
    }

    res.json({
      success: true,
      message:
        'Recruitment record updated successfully',
      data: recruitment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to update recruitment record',
      error: error.message,
    })
  }
}


export const deleteRecruitment = async (
  req,
  res,
) => {
  try {
    const recruitment =
      await Recruitment.findByIdAndDelete(
        req.params.id,
      )

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        message:
          'Recruitment record not found',
      })
    }

    res.json({
      success: true,
      message:
        'Recruitment record deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to delete recruitment record',
      error: error.message,
    })
  }
}