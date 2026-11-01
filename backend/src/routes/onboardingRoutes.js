import express from 'express'

import {
  getOnboardingRecords,
  getOnboardingById,
  createOnboarding,
  updateOnboarding,
  deleteOnboarding,
  updateOnboardingStep,
} from '../controllers/onboardingController.js'

const router = express.Router()

router.get('/', getOnboardingRecords)

router.get('/:id', getOnboardingById)

router.post('/', createOnboarding)

router.put('/:id', updateOnboarding)

router.delete('/:id', deleteOnboarding)
router.patch('/:id/steps/:step', updateOnboardingStep)

export default router