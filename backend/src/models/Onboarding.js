import mongoose from 'mongoose'

const onboardingSchema = new mongoose.Schema(
  {
    onboardingId: {
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

    joiningDate: {
      type: Date,
      required: true,
    },

    onboardingType: {
      type: String,
      enum: ['New Hire', 'Internal Transfer', 'Rehire'],
      default: 'New Hire',
    },

    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },

    documents: {
      type: Boolean,
      default: false,
    },

    orientation: {
      type: Boolean,
      default: false,
    },

    equipment: {
      type: Boolean,
      default: false,
    },

    systemAccess: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      trim: true,
    },

    // The four booleans above say whether a step is done. These add
    // when each step is due and when it was done (services/onboardingRules.js).
    stepDueDates: {
      documents: Date,
      orientation: Date,
      equipment: Date,
      systemAccess: Date,
    },

    stepCompletedAt: {
      documents: Date,
      orientation: Date,
      equipment: Date,
      systemAccess: Date,
    },

    // Steps we already sent an "overdue" notification for
    overdueNotified: {
      type: [String],
      default: [],
    },

    // Asset handed over in the equipment step
    equipmentAssetId: {
      type: String,
      trim: true,
      default: '',
    },

    candidateId: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
)

const Onboarding = mongoose.model('Onboarding', onboardingSchema)

export default Onboarding