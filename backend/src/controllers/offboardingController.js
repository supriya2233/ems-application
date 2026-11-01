import Offboarding from '../models/Offboarding.js'
import { AppError } from '../middleware/errorHandler.js'
import { publishChange } from '../services/activity.js'
import {
  getOffboarding,
  listOffboardings,
  setItem,
  startOffboarding,
  updateOffboarding,
} from '../services/offboardingService.js'

export const getOffboardings = async (req, res) => {
  const records = await listOffboardings()
  res.json({ success: true, count: records.length, data: records })
}

export const getOffboardingById = async (req, res) => {
  res.json({ success: true, data: await getOffboarding(req.params.id) })
}

export const createOffboarding = async (req, res) => {
  const record = await startOffboarding(req.body)
  res.status(201).json({ success: true, message: `Offboarding started for ${record.employeeName}`, data: record })
}

export const updateOffboardingHandler = async (req, res) => {
  res.json({ success: true, message: 'Offboarding updated', data: await updateOffboarding(req.params.id, req.body) })
}

export const updateOffboardingItem = async (req, res) => {
  const record = await setItem(req.params.id, req.params.key, req.body)
  res.json({ success: true, message: 'Checklist updated', data: record })
}

/* Cancels an offboarding. Nothing that already happened is undone. */
export const deleteOffboarding = async (req, res) => {
  const record = await Offboarding.findByIdAndDelete(req.params.id).lean()
  if (!record) throw new AppError(404, 'Offboarding record not found')

  publishChange('offboarding', 'deleted', record, null)
  res.json({ success: true, message: 'Offboarding deleted' })
}
