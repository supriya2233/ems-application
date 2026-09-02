import Onboarding from '../models/Onboarding.js'

export const getOnboardingRecords = async (req, res) => {
  try {
    const records = await Onboarding.find().sort({ createdAt: -1 })

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

export const getOnboardingById = async (req, res) => {
  try {
    const record = await Onboarding.findById(req.params.id)

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding record not found',
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

export const createOnboarding = async (req, res) => {
  try {
    const record = await Onboarding.create(req.body)

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

export const updateOnboarding = async (req, res) => {
  try {
    const record = await Onboarding.findByIdAndUpdate(
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
        message: 'Onboarding record not found',
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

export const deleteOnboarding = async (req, res) => {
  try {
    const record = await Onboarding.findByIdAndDelete(req.params.id)

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding record not found',
      })
    }

    res.json({
      success: true,
      message: 'Onboarding record deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}