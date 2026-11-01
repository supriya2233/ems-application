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

    // "Final settlement" = the last, pro-rated pay of someone leaving
    type: {
      type: String,
      enum: ['Regular', 'Final settlement'],
      default: 'Regular',
    },

    // How the net was worked out (services/payrollRules.js).
    // Empty for records typed in by hand.
    breakdown: {
      workingDays: Number,
      employedDays: Number,
      notEmployedDays: Number,
      unpaidDays: Number,
      absentDays: Number,
      payableDays: Number,
      dayRate: Number,
      lossOfPay: Number,
      otherDeductions: Number,
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