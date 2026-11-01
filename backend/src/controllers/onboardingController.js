import Onboarding from '../models/Onboarding.js'
import { AppError } from '../middleware/errorHandler.js'
import { assignId } from '../services/idService.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'
import { publishChange } from '../services/activity.js'
import { afterOnboardingChange, prepareOnboarding, setStep } from '../services/onboardingService.js'

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

  // Due dates from the joining date; status from the checklist
  prepareOnboarding(body)

  const record = await Onboarding.create(body)
  publishChange('onboarding', 'created', null, record)
  await afterOnboardingChange(null, record)

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

  const before = await Onboarding.findById(req.params.id).lean()

  if (!before) {
    throw new AppError(404, 'Onboarding record not found')
  }

  prepareOnboarding(body, before)

  const record = await Onboarding.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  if (!record) {
    throw new AppError(404, 'Onboarding record not found')
  }

  publishChange('onboarding', 'updated', before, record)
  await afterOnboardingChange(before, record)

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

    publishChange('onboarding', 'deleted', record, null)

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


/*
 * PATCH /api/onboarding/:id/steps/:step   { done: true, assetId? }
 * Tick or untick one checklist step. For "equipment", an available
 * asset can be handed over in the same request.
 */
export const updateOnboardingStep = async (req, res) => {
  const record = await setStep(req.params.id, req.params.step, req.body)

  res.json({
    success: true,
    message: 'Onboarding step updated',
    data: record,
  })
}
