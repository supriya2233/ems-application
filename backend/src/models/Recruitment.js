import mongoose from 'mongoose'

const recruitmentSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    candidateName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    position: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: String,
      trim: true,
    },

    source: {
      type: String,
      trim: true,
    },

    appliedDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        'Applied',
        'Screening',
        'Interview',
        'Selected',
        'Rejected',
        'Hired',
      ],
      default: 'Applied',
    },

    notes: {
      type: String,
      trim: true,
    },

    // Filled in by the Hire action (services/hiringService.js)
    employeeId: {
      type: String,
      trim: true,
      default: '',
    },

    hiredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

const Recruitment = mongoose.model(
  'Recruitment',
  recruitmentSchema,
)

export default Recruitment