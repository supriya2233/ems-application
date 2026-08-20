import mongoose from 'mongoose'

const departmentSchema = new mongoose.Schema(
  {
    departmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      trim: true,
    },

    manager: {
      type: String,
      trim: true,
    },

    color: {
      type: String,
      default: 'blue',
      trim: true,
    },

    employees: {
      type: Number,
      default: 0,
      min: 0,
    },

    active: {
      type: Number,
      default: 0,
      min: 0,
    },

    openTasks: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
)

const Department = mongoose.model(
  'Department',
  departmentSchema,
)

export default Department