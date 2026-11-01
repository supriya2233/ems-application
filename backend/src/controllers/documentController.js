import Document from '../models/Document.js'
import { AppError } from '../middleware/errorHandler.js'
import { assignId } from '../services/idService.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'

export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({
      createdAt: -1,
    })

    res.json({
      success: true,
      count: documents.length,
      data: documents,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      })
    }

    res.json({
      success: true,
      data: document,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const createDocument = async (req, res) => {
  const body = { ...req.body }
  await linkEmployee(body, getLink(Document))
  await assignId('documents', Document, body)

  const document = await Document.create(body)

  res.status(201).json({
    success: true,
    message: 'Document created successfully',
    data: document,
  })
}

export const updateDocument = async (req, res) => {
  const body = { ...req.body }
  delete body.documentId // IDs never change after creation
  await linkEmployee(body, getLink(Document), { isUpdate: true })

  const document = await Document.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  if (!document) {
    throw new AppError(404, 'Document not found')
  }

  res.json({
    success: true,
    message: 'Document updated successfully',
    data: document,
  })
}

export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(
      req.params.id,
    )

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      })
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
