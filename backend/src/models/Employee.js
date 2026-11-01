import mongoose from 'mongoose'

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    initials: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    joiningDate: {
      type: Date,
      required: true,
    },

    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
      default: 'Full-time',
    },

    status: {
      type: String,
      // Onboarding: hired, checklist not finished yet (becomes Active after)
      enum: ['Active', 'On Leave', 'Inactive', 'Onboarding'],
      default: 'Active',
    },

    // Set when the employee was hired through Recruitment
    candidateId: {
      type: String,
      trim: true,
      default: '',
    },

    manager: {
      type: String,
      trim: true,
    },

    leaveType: {
      type: String,
      trim: true,
    },

    leaveFrom: {
      type: Date,
    },

    leaveTo: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

const Employee = mongoose.model('Employee', employeeSchema)

export default Employee