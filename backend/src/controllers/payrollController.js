import Payroll from '../models/Payroll.js'
import { AppError } from '../middleware/errorHandler.js'
import { getLink, linkEmployee } from '../services/employeeLink.js'
import { publishChange } from '../services/activity.js'
import { generatePayroll, getPayrollMonths, previewPayroll, recalculatePayroll } from '../services/payrollService.js'

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
  publishChange('payroll', 'created', null, payroll)

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
  delete body.breakdown // worked out by the server (Generate / Recalculate)
  await linkEmployee(body, getLink(Payroll), { isUpdate: true })

  const before = await Payroll.findById(req.params.id).lean()

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

  publishChange('payroll', 'updated', before, payroll)

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

    publishChange('payroll', 'deleted', payroll, null)

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

/* GET /api/payroll/months → ["December 2026", "November 2026", …] */
export const getPayrollMonthsHandler = async (req, res) => {
  res.json({ success: true, data: await getPayrollMonths() })
}

/*
 * POST /api/payroll/generate { month, preview, salaries }
 *   preview: true → the calculation for everyone, nothing saved
 *   otherwise     → Draft records for everyone who is ready
 */
export const generatePayrollHandler = async (req, res) => {
  const { month, preview = false, salaries = {} } = req.body || {}

  if (preview) {
    res.json({ success: true, data: await previewPayroll(month, { salaries }) })
    return
  }

  const result = await generatePayroll(month, { salaries })
  res.status(201).json({
    success: true,
    message: `Generated ${result.created.length} payroll record(s) for ${result.month}`,
    data: result,
  })
}

/* POST /api/payroll/:id/recalculate */
export const recalculatePayrollHandler = async (req, res) => {
  res.json({ success: true, message: 'Payroll recalculated', data: await recalculatePayroll(req.params.id) })
}
