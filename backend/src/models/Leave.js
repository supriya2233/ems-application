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
        'Unpaid', // no allowance; payroll deducts it (Phase 6)
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
      // Working days, always counted by the server (services/leaveService.js)
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
        'Cancelled', // approved leave that was called off
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