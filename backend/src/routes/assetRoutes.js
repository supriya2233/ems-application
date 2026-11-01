import express from 'express'

import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAssetHandler,
  returnAssetHandler,
} from '../controllers/assetController.js'

const router = express.Router()

router.get('/', getAssets)

router.get('/:id', getAssetById)

router.post('/', createAsset)

router.put('/:id', updateAsset)

router.delete('/:id', deleteAsset)
router.post('/:id/assign', assignAssetHandler)
router.post('/:id/return', returnAssetHandler)

export default router