import Recruitment from '../models/Recruitment.js'
import { AppError } from '../middleware/errorHandler.js'
import { assignId } from '../services/idService.js'
import { publishChange } from '../services/activity.js'
import { hireCandidate } from '../services/hiringService.js'

export const getRecruitments = async (
  req,
  res,
) => {
  try {
    const {
      status,
      department,
      position,
    } = req.query

    const filter = {}

    if (status) {
      filter.status = status
    }

    if (department) {
      filter.department = department
    }

    if (position) {
      filter.position = position
    }

    const recruitments =
      await Recruitment.find(filter).sort({
        createdAt: -1,
      })

    res.json({
      success: true,
      count: recruitments.length,
      data: recruitments,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to fetch recruitment records',
      error: error.message,
    })
  }
}


export const getRecruitment = async (
  req,
  res,
) => {
  try {
    const recruitment =
      await Recruitment.findById(
        req.params.id,
      )

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        message:
          'Recruitment record not found',
      })
    }

    res.json({
      success: true,
      data: recruitment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to fetch recruitment record',
      error: error.message,
    })
  }
}


export const createRecruitment = async (req, res) => {
  const body = { ...req.body }
  await assignId('recruitment', Recruitment, body)

  delete body.employeeId // set only by the Hire action
  if (body.status === 'Hired') {
    throw new AppError(400, 'Add the candidate first, then use Hire to create their employee record')
  }

  const recruitment = await Recruitment.create(body)
  publishChange('recruitment', 'created', null, recruitment)

  res.status(201).json({
    success: true,
    message: 'Candidate created successfully',
    data: recruitment,
  })
}

export const updateRecruitment = async (req, res) => {
  const body = { ...req.body }
  delete body.candidateId // IDs never change after creation

  delete body.employeeId // set only by the Hire action
  delete body.hiredAt

  const before = await Recruitment.findById(req.params.id).lean()

  if (!before) {
    throw new AppError(404, 'Candidate not found')
  }

  // "Hired" needs an employee record, so it only comes from Hire.
  if (body.status === 'Hired' && before.status !== 'Hired') {
    throw new AppError(400, 'Use the Hire button on a selected candidate to hire them')
  }

  const recruitment = await Recruitment.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  if (!recruitment) {
    throw new AppError(404, 'Candidate not found')
  }

  publishChange('recruitment', 'updated', before, recruitment)

  res.json({
    success: true,
    message: 'Candidate updated successfully',
    data: recruitment,
  })
}

export const deleteRecruitment = async (
  req,
  res,
) => {
  try {
    const recruitment =
      await Recruitment.findByIdAndDelete(
        req.params.id,
      )

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        message:
          'Recruitment record not found',
      })
    }

    publishChange('recruitment', 'deleted', recruitment, null)

    res.json({
      success: true,
      message:
        'Recruitment record deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to delete recruitment record',
      error: error.message,
    })
  }
}


/*
 * POST /api/recruitment/:id/hire
 * { role, department, joiningDate, employmentType, email, phone?, manager? }
 * → { employee, onboarding, candidate }
 */
export const hireCandidateHandler = async (req, res) => {
  const data = await hireCandidate(req.params.id, req.body)

  res.status(201).json({
    success: true,
    message: `${data.employee.name} was hired as ${data.employee.employeeId}`,
    data,
  })
}
