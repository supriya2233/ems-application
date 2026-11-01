import Task from '../models/Task.js'
import { AppError } from '../middleware/errorHandler.js'
import { assignId } from '../services/idService.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'
import { publishChange } from '../services/activity.js'

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({
      createdAt: -1,
    })

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message,
    })
  }
}

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      })
    }

    res.status(200).json({
      success: true,
      data: task,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: error.message,
    })
  }
}

export const createTask = async (req, res) => {
  const body = { ...req.body }
  await linkEmployee(body, getLink(Task))
  await assignId('tasks', Task, body)

  const task = await Task.create(body)
  publishChange('tasks', 'created', null, task)

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: task,
  })
}

export const updateTask = async (req, res) => {
  const body = { ...req.body }
  delete body.taskId // IDs never change after creation
  await linkEmployee(body, getLink(Task), { isUpdate: true })

  const before = await Task.findById(req.params.id).lean()

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  if (!task) {
    throw new AppError(404, 'Task not found')
  }

  publishChange('tasks', 'updated', before, task)

  res.json({
    success: true,
    message: 'Task updated successfully',
    data: task,
  })
}

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      })
    }

    publishChange('tasks', 'deleted', task, null)

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message,
    })
  }
}
