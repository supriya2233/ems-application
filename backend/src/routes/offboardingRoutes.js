import express from 'express'

import {
  createOffboarding,
  deleteOffboarding,
  getOffboardingById,
  getOffboardings,
  updateOffboardingHandler,
  updateOffboardingItem,
} from '../controllers/offboardingController.js'

const router = express.Router()

router.get('/', getOffboardings)
router.get('/:id', getOffboardingById)
router.post('/', createOffboarding)
router.put('/:id', updateOffboardingHandler)
router.patch('/:id/items/:key', updateOffboardingItem)
router.delete('/:id', deleteOffboarding)

export default router
