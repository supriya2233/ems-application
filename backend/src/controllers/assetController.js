import Asset from '../models/Asset.js'
import { AppError } from '../middleware/errorHandler.js'
import { assignId } from '../services/idService.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'
import { publishChange } from '../services/activity.js'
import { assignAsset, recordAssignmentChange, returnAsset } from '../services/assetService.js'

export const getAssets = async (req, res) => {
  try {
    const { status, category, search } = req.query

    const filter = {}

    if (status) {
      filter.status = status
    }

    if (category) {
      filter.category = category
    }

    if (search) {
      filter.$or = [
        { assetId: { $regex: search, $options: 'i' } },
        { assetName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { employeeName: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
      ]
    }

    const assets = await Asset.find(filter).sort({ createdAt: -1 })

    res.json({
      success: true,
      count: assets.length,
      data: assets,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assets',
      error: error.message,
    })
  }
}

export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      })
    }

    res.json({
      success: true,
      data: asset,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset',
      error: error.message,
    })
  }
}

export const createAsset = async (req, res) => {
  const body = { ...req.body }
  await linkEmployee(body, getLink(Asset))
  await assignId('assets', Asset, body)

  delete body.history // kept by the server

  const asset = await Asset.create(body)
  await recordAssignmentChange(null, asset.toObject())
  publishChange('assets', 'created', null, asset)

  res.status(201).json({
    success: true,
    message: 'Asset created successfully',
    data: asset,
  })
}

export const updateAsset = async (req, res) => {
  const body = { ...req.body }
  delete body.assetId // IDs never change after creation
  delete body.history // kept by the server
  await linkEmployee(body, getLink(Asset), { isUpdate: true })

  const before = await Asset.findById(req.params.id).lean()

  const asset = await Asset.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  if (!asset) {
    throw new AppError(404, 'Asset not found')
  }

  // Changing the holder in the edit form is recorded in the history too.
  await recordAssignmentChange(before, asset.toObject())
  publishChange('assets', 'updated', before, asset)

  res.json({
    success: true,
    message: 'Asset updated successfully',
    data: asset,
  })
}

export const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id)

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      })
    }

    publishChange('assets', 'deleted', asset, null)

    res.json({
      success: true,
      message: 'Asset deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset',
      error: error.message,
    })
  }
}


// POST /api/assets/:id/assign   { employeeId, date?, condition?, note? }
export const assignAssetHandler = async (req, res) => {
  const data = await assignAsset(req.params.id, req.body)
  res.json({ success: true, message: `Assigned to ${data.employeeName}`, data })
}

// POST /api/assets/:id/return   { date?, condition?, note? }
export const returnAssetHandler = async (req, res) => {
  const data = await returnAsset(req.params.id, req.body)
  res.json({ success: true, message: 'Asset returned', data })
}
