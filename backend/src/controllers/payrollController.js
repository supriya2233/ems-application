import Payroll from '../models/Payroll.js'
import { AppError } from '../middleware/errorHandler.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'

export const getPayroll = async (req, res) => {
  try {
    const {
      month,
      employeeId,
      department,
      status,
    } = req.query

    const filter = {}

    if (month) {
      filter.month = month
    }

    if (employeeId) {
      filter.employeeId = employeeId
    }

    if (department) {
      filter.department = department
    }

    if (status) {
      filter.status = status
    }

    const payroll = await Payroll.find(filter)
      .sort({
        createdAt: -1,
      })

    res.json({
      success: true,
      count: payroll.length,
      data: payroll,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll',
      error: error.message,
    })
  }
}


export const getPayrollSummary = async (
  req,
  res,
) => {
  try {
    const { month } = req.query

    const filter = {}

    if (month) {
      filter.month = month
    }

    const payroll = await Payroll.find(
      filter,
    )

    const totalPayroll =
      payroll.reduce(
        (sum, item) =>
          sum + Number(item.net || 0),
        0,
      )

    const grossSalary =
      payroll.reduce(
        (sum, item) =>
          sum +
          Number(item.basic || 0) +
          Number(item.allowances || 0),
        0,
      )

    const deductions =
      payroll.reduce(
        (sum, item) =>
          sum +
          Number(item.deductions || 0),
        0,
      )

    const netPayroll = totalPayroll

    res.json({
      success: true,
      data: {
        totalPayroll,
        grossSalary,
        deductions,
        netPayroll,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to calculate payroll summary',
      error: error.message,
    })
  }
}


export const createPayroll = async (req, res) => {
  const { employeeId, month, basic, allowances, deductions, status } = req.body

  const body = { employeeId, month, basic, allowances, deductions, status }
  await linkEmployee(body, getLink(Payroll))

  body.net = calculateNet(body)

  const payroll = await Payroll.create(body)

  res.status(201).json({
    success: true,
    message: 'Payroll record created successfully',
    data: payroll,
  })
}

// net = basic + allowances - deductions (never trusted from the browser)
export const calculateNet = ({ basic, allowances, deductions }) =>
  Number(basic || 0) + Number(allowances || 0) - Number(deductions || 0)

export const updatePayroll = async (req, res) => {
  const body = { ...req.body }
  delete body.net
  await linkEmployee(body, getLink(Payroll), { isUpdate: true })

  const payroll = await Payroll.findByIdAndUpdate(
    req.params.id,
    body,
    { returnDocument: 'after', runValidators: true },
  )

  if (!payroll) {
    throw new AppError(404, 'Payroll record not found')
  }

  payroll.net = calculateNet(payroll)
  await payroll.save()

  res.json({
    success: true,
    message: 'Payroll record updated successfully',
    data: payroll,
  })
}

export const deletePayroll = async (
  req,
  res,
) => {
  try {
    const payroll =
      await Payroll.findByIdAndDelete(
        req.params.id,
      )

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      })
    }

    res.json({
      success: true,
      message:
        'Payroll record deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to delete payroll record',
      error: error.message,
    })
  }
}
