import mongoose from 'mongoose'

const documentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    employeeId: {
      type: String,
      required: true,
      trim: true,
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
    },

    documentName: {
      type: String,
      required: true,
      trim: true,
    },

    documentType: {
      type: String,
      enum: [
        'Offer Letter',
        'Employment Contract',
        'Identity Proof',
        'Address Proof',
        'Education Certificate',
        'Experience Letter',
        'Payslip',
        'Other',
      ],
      default: 'Other',
    },

    issueDate: {
      type: Date,
    },

    expiryDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ['Active', 'Expired', 'Pending Verification'],
      default: 'Active',
    },

    fileName: {
      type: String,
      trim: true,
    },

    fileUrl: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
)

const Document = mongoose.model('Document', documentSchema)

export default Document