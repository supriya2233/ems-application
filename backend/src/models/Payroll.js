import mongoose from 'mongoose'

const payrollSchema = new mongoose.Schema(
  {
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

    month: {
      type: String,
      required: true,
      trim: true,
    },

    basic: {
      type: Number,
      required: true,
      min: 0,
    },

    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },

    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },

    net: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        'Processed',
        'Pending',
        'Draft',
      ],
      default: 'Draft',
    },
  },
  {
    timestamps: true,
  },
)

const Payroll = mongoose.model(
  'Payroll',
  payrollSchema,
)

export default Payroll