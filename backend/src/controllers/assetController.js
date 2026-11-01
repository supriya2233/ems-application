import Asset from '../models/Asset.js'
import { AppError } from '../middleware/errorHandler.js'
import { assignId } from '../services/idService.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'

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

  const asset = await Asset.create(body)

  res.status(201).json({
    success: true,
    message: 'Asset created successfully',
    data: asset,
  })
}

export const updateAsset = async (req, res) => {
  const body = { ...req.body }
  delete body.assetId // IDs never change after creation
  await linkEmployee(body, getLink(Asset), { isUpdate: true })

  const asset = await Asset.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  if (!asset) {
    throw new AppError(404, 'Asset not found')
  }

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
