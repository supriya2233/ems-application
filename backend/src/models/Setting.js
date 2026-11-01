import mongoose from 'mongoose'

/*
 * Company-wide settings. There is exactly one document, with the
 * fixed _id "company" (see services/settingsService.js).
 */

const holidaySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false },
)

// Days per year; null means "no limit" (used for Unpaid).
const allowanceField = { type: Number, min: 0, default: null }

const settingSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'company' },

    leaveAllowances: {
      Annual: { ...allowanceField, default: 18 },
      Casual: { ...allowanceField, default: 12 },
      Medical: { ...allowanceField, default: 10 },
      Other: { ...allowanceField, default: 5 },
      Unpaid: allowanceField,
    },

    // 0 = Sunday … 6 = Saturday
    workingDays: {
      type: [{ type: Number, min: 0, max: 6 }],
      default: [1, 2, 3, 4, 5],
    },

    holidays: {
      type: [holidaySchema],
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
)

const Setting = mongoose.model('Setting', settingSchema)

export default Setting
