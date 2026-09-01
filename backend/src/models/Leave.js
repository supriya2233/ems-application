import mongoose from 'mongoose'

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },

    employee: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        'Annual',
        'Casual',
        'Medical',
        'Other',
      ],
      required: true,
    },

    from: {
      type: Date,
      required: true,
    },

    to: {
      type: Date,
      required: true,
    },

    days: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        'Pending',
        'Approved',
        'Rejected',
      ],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  },
)

leaveSchema.index({
  employeeId: 1,
  from: 1,
  to: 1,
})

const Leave =
  mongoose.model(
    'Leave',
    leaveSchema,
  )

export default Leave