import Payroll from '../models/Payroll.js'

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


export const createPayroll = async (
  req,
  res,
) => {
  try {
    const {
      employeeId,
      employeeName,
      department,
      month,
      basic,
      allowances,
      deductions,
      status,
    } = req.body

    const calculatedNet =
      Number(basic || 0) +
      Number(allowances || 0) -
      Number(deductions || 0)

    const payroll =
      await Payroll.create({
        employeeId,
        employeeName,
        department,
        month,
        basic,
        allowances,
        deductions,
        net: calculatedNet,
        status,
      })

    res.status(201).json({
      success: true,
      message:
        'Payroll record created successfully',
      data: payroll,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to create payroll record',
      error: error.message,
    })
  }
}


export const updatePayroll = async (
  req,
  res,
) => {
  try {
    const payroll =
      await Payroll.findByIdAndUpdate(
        req.params.id,
        req.body,
        { returnDocument: 'after', runValidators: true },
      )

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      })
    }

    const basic =
      Number(payroll.basic || 0)

    const allowances =
      Number(payroll.allowances || 0)

    const deductions =
      Number(payroll.deductions || 0)

    payroll.net =
      basic +
      allowances -
      deductions

    await payroll.save()

    res.json({
      success: true,
      message:
        'Payroll record updated successfully',
      data: payroll,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        'Failed to update payroll record',
      error: error.message,
    })
  }
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