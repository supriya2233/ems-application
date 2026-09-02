import express from 'express'

import {
  getRecruitments,
  getRecruitment,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
} from '../controllers/recruitmentController.js'

const router = express.Router()

router.get(
  '/',
  getRecruitments,
)

router.get(
  '/:id',
  getRecruitment,
)

router.post(
  '/',
  createRecruitment,
)

router.put(
  '/:id',
  updateRecruitment,
)

router.delete(
  '/:id',
  deleteRecruitment,
)

export default router