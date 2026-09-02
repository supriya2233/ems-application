import mongoose from 'mongoose'

const performanceSchema = new mongoose.Schema(
  {
    reviewId: {
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

    department: {
      type: String,
      required: true,
      trim: true,
    },

    reviewPeriod: {
      type: String,
      required: true,
      trim: true,
    },

    reviewDate: {
      type: Date,
      required: true,
    },

    reviewer: {
      type: String,
      required: true,
      trim: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    status: {
      type: String,
      enum: ['Draft', 'In Review', 'Completed'],
      default: 'Draft',
    },

    strengths: {
      type: String,
      trim: true,
    },

    improvements: {
      type: String,
      trim: true,
    },

    goals: {
      type: String,
      trim: true,
    },

    comments: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
)

const Performance = mongoose.model(
  'Performance',
  performanceSchema,
)

export default Performance