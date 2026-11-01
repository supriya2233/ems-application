import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Employee ID of the assignee (e.g. EMP001). Older tasks may
    // only have the name below; the repair script can fill this in.
    assigneeId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },

    assignee: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },

    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Pending', 'Completed'],
      default: 'To Do',
    },

    dueDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

const Task = mongoose.model('Task', taskSchema)

export default Task