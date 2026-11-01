import mongoose from 'mongoose'

/*
 * Someone leaving the company. The checklist is built when
 * offboarding starts: one "return" item per asset they hold, then
 * the standard steps (services/offboardingRules.js).
 */
const itemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    kind: { type: String, enum: ['asset', 'task', 'settlement'], default: 'task' },
    assetId: { type: String, default: '' }, // Asset _id for "asset" items
    done: { type: Boolean, default: false },
    doneAt: Date,
    note: { type: String, trim: true, default: '' },
  },
  { _id: false },
)

const offboardingSchema = new mongoose.Schema(
  {
    offboardingId: { type: String, required: true, unique: true, trim: true },
    employeeId: { type: String, required: true, trim: true },
    employeeName: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },

    lastWorkingDay: { type: Date, required: true },

    reason: {
      type: String,
      enum: ['Resignation', 'Termination', 'Retirement', 'End of contract', 'Other'],
      default: 'Resignation',
    },

    // Always worked out from the items (never set by hand)
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },

    items: { type: [itemSchema], default: [] },

    // The final settlement payroll record, once created
    payrollId: { type: String, default: '' },

    completedAt: Date,
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
)

const Offboarding = mongoose.model('Offboarding', offboardingSchema)

export default Offboarding
