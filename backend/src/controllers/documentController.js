import Document from '../models/Document.js'

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
  try {
    const document = await Document.create(req.body)

    res.status(201).json({
      success: true,
      data: document,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

export const updateDocument = async (req, res) => {
  try {
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        returnDocument: 'after',
        runValidators: true,
      },
    )

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
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
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