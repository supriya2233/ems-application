import Performance from '../models/Performance.js'

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
  try {
    const record = await Performance.create(req.body)

    res.status(201).json({
      success: true,
      data: record,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

export const updatePerformance = async (req, res) => {
  try {
    const record = await Performance.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        returnDocument: 'after',
        runValidators: true,
      },
    )

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
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
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