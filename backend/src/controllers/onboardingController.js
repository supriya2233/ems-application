import Onboarding from '../models/Onboarding.js'
import { AppError } from '../middleware/errorHandler.js'
import { assignId } from '../services/idService.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'

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
  const body = { ...req.body }
  await linkEmployee(body, getLink(Onboarding))
  await assignId('onboarding', Onboarding, body)

  const record = await Onboarding.create(body)

  res.status(201).json({
    success: true,
    message: 'Onboarding record created successfully',
    data: record,
  })
}

export const updateOnboarding = async (req, res) => {
  const body = { ...req.body }
  delete body.onboardingId // IDs never change after creation
  await linkEmployee(body, getLink(Onboarding), { isUpdate: true })

  const record = await Onboarding.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  if (!record) {
    throw new AppError(404, 'Onboarding record not found')
  }

  res.json({
    success: true,
    message: 'Onboarding record updated successfully',
    data: record,
  })
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
