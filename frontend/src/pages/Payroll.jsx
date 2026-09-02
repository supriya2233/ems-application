import { useEffect, useMemo, useState } from 'react'
import {
  getPayroll,
  getPayrollSummary,
  createPayroll,
  updatePayroll,
  deletePayroll,
} from '../services/payrollService'
import { getEmployees } from '../services/employeeService'

const payrollMonths = [
  'August 2026',
  'July 2026',
  'June 2026',
  'May 2026',
]

const statusOptions = [
  'All',
  'Processed',
  'Pending',
  'Draft',
]

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString(
    'en-IN',
  )}`
}

function Payroll() {
  const [payrollEmployees, setPayrollEmployees] =
    useState([])

  const [employees, setEmployees] =
    useState([])

  const [summary, setSummary] =
    useState({
      totalPayroll: 0,
      grossSalary: 0,
      deductions: 0,
      netPayroll: 0,
    })

  const [month, setMonth] =
    useState(payrollMonths[0])

  const [search, setSearch] =
    useState('')

  const [department, setDepartment] =
    useState('All')

  const [status, setStatus] =
    useState('All')

  const [selectedEmployee, setSelectedEmployee] =
    useState(null)

  const [showModal, setShowModal] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [form, setForm] = useState({
    employeeId: '',
    employeeName: '',
    department: '',
    month: payrollMonths[0],
    basic: '',
    allowances: '',
    deductions: '',
    status: 'Draft',
  })

  // =================================================
  // LOAD PAYROLL + EMPLOYEES
  // =================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError('')

        const [
          payrollData,
          employeeData,
          summaryData,
        ] = await Promise.all([
          getPayroll({
            month,
          }),
          getEmployees(),
          getPayrollSummary(month),
        ])

        setPayrollEmployees(payrollData)
        setEmployees(employeeData)
        setSummary(summaryData)
      } catch (error) {
        console.error(
          'Failed to load payroll:',
          error,
        )

        setError(
          error.message ||
            'Failed to load payroll',
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [month])

  // =================================================
  // DEPARTMENTS
  // =================================================

  const departments = useMemo(() => {
    const values = payrollEmployees
      .map(
        (employee) =>
          employee.department,
      )
      .filter(Boolean)

    return [
      'All',
      ...new Set(values),
    ]
  }, [payrollEmployees])

  // =================================================
  // FILTER PAYROLL
  // =================================================

  const filteredEmployees = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase()

    return payrollEmployees.filter(
      (employee) => {
        const name =
          employee.employeeName ||
          ''

        const id =
          employee.employeeId ||
          ''

        const matchesSearch =
          !searchValue ||
          name
            .toLowerCase()
            .includes(searchValue) ||
          id
            .toLowerCase()
            .includes(searchValue)

        const matchesDepartment =
          department === 'All' ||
          employee.department ===
            department

        const matchesStatus =
          status === 'All' ||
          employee.status === status

        return (
          matchesSearch &&
          matchesDepartment &&
          matchesStatus
        )
      },
    )
  }, [
    payrollEmployees,
    search,
    department,
    status,
  ])

  // =================================================
  // EMPLOYEE CHANGE
  // =================================================

  const handleEmployeeChange = (
    event,
  ) => {
    const employeeId =
      event.target.value

    const selected =
      employees.find(
        (employee) =>
          employee.employeeId ===
          employeeId,
      )

    if (!selected) {
      setForm((previous) => ({
        ...previous,
        employeeId: '',
        employeeName: '',
        department: '',
      }))

      return
    }

    setForm((previous) => ({
      ...previous,
      employeeId:
        selected.employeeId,
      employeeName:
        selected.name,
      department:
        selected.department,
    }))
  }

  // =================================================
  // FORM CHANGE
  // =================================================

  const handleFormChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // =================================================
  // OPEN PAYROLL MODAL
  // =================================================

  const openPayrollModal = () => {
    setForm({
      employeeId: '',
      employeeName: '',
      department: '',
      month,
      basic: '',
      allowances: '',
      deductions: '',
      status: 'Draft',
    })

    setError('')
    setShowModal(true)
  }

  // =================================================
  // CREATE PAYROLL
  // =================================================

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault()

    if (!form.employeeId) {
      setError(
        'Please select an employee.',
      )

      return
    }

    if (!form.basic) {
      setError(
        'Please enter the basic salary.',
      )

      return
    }

    try {
      setSaving(true)
      setError('')

      const created =
        await createPayroll({
          employeeId:
            form.employeeId,

          employeeName:
            form.employeeName,

          department:
            form.department,

          month: form.month,

          basic: Number(
            form.basic,
          ),

          allowances: Number(
            form.allowances || 0,
          ),

          deductions: Number(
            form.deductions || 0,
          ),

          status:
            form.status,
        })

      if (
        created.month === month
      ) {
        setPayrollEmployees(
          (previous) => [
            created,
            ...previous,
          ],
        )
      }

      const updatedSummary =
        await getPayrollSummary(
          month,
        )

      setSummary(
        updatedSummary,
      )

      setShowModal(false)
    } catch (error) {
      setError(
        error.message ||
          'Failed to create payroll',
      )
    } finally {
      setSaving(false)
    }
  }

  // =================================================
  // RUN PAYROLL
  // =================================================

  const runPayroll = async () => {
    if (
      payrollEmployees.length ===
      0
    ) {
      setError(
        `No payroll records found for ${month}.`,
      )

      return
    }

    try {
      setSaving(true)
      setError('')

      const pendingRecords =
        payrollEmployees.filter(
          (employee) =>
            employee.status !==
            'Processed',
        )

      if (
        pendingRecords.length ===
        0
      ) {
        setError(
          `Payroll for ${month} is already processed.`,
        )

        return
      }

      const updatedRecords =
        await Promise.all(
          pendingRecords.map(
            (employee) =>
              updatePayroll(
                employee._id,
                {
                  status:
                    'Processed',
                },
              ),
          ),
        )

      setPayrollEmployees(
        (previous) =>
          previous.map(
            (employee) => {
              const updated =
                updatedRecords.find(
                  (item) =>
                    item._id ===
                    employee._id,
                )

              return updated ||
                employee
            },
          ),
      )

      const updatedSummary =
        await getPayrollSummary(
          month,
        )

      setSummary(
        updatedSummary,
      )
    } catch (error) {
      setError(
        error.message ||
          'Failed to process payroll',
      )
    } finally {
      setSaving(false)
    }
  }

  // =================================================
  // DELETE PAYROLL
  // =================================================

  const handleDelete = async (
    employee,
  ) => {
    const confirmed =
      window.confirm(
        `Delete payroll record for ${employee.employeeName}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await deletePayroll(
        employee._id,
      )

      setPayrollEmployees(
        (previous) =>
          previous.filter(
            (item) =>
              item._id !==
              employee._id,
          ),
      )

      setSelectedEmployee(null)

      const updatedSummary =
        await getPayrollSummary(
          month,
        )

      setSummary(
        updatedSummary,
      )
    } catch (error) {
      setError(
        error.message ||
          'Failed to delete payroll',
      )
    }
  }

  // =================================================
  // PAYSLIP
  // =================================================

  const downloadPayslip = (
    employee,
  ) => {
    const content = `
EMS - EMPLOYEE PAYSLIP

Employee: ${employee.employeeName}
Employee ID: ${employee.employeeId}
Department: ${employee.department}
Month: ${employee.month}

Basic Salary: ${formatCurrency(
      employee.basic,
    )}

Allowances: ${formatCurrency(
      employee.allowances,
    )}

Deductions: ${formatCurrency(
      employee.deductions,
    )}

Net Salary: ${formatCurrency(
      employee.net,
    )}

Status: ${employee.status}
`

    const blob =
      new Blob([content], {
        type: 'text/plain',
      })

    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement('a')

    link.href = url

    link.download =
      `${employee.employeeId}-${employee.month}-payslip.txt`

    link.click()

    URL.revokeObjectURL(url)
  }

  // =================================================
  // LOADING
  // =================================================

  if (loading) {
    return (
      <div className="module-page payroll-page">

        <div className="module-header">

          <div>

            <span className="module-eyebrow">
              FINANCE
            </span>

            <h1>
              Payroll
            </h1>

            <p>
              Manage employee salaries,
              deductions, payroll processing
              and payslips.
            </p>

          </div>

        </div>

        <div className="content-section">

          <p>
            Loading payroll...
          </p>

        </div>

      </div>
    )
  }

  // =================================================
  // PAGE
  // =================================================

  return (
    <div className="module-page payroll-page">

      {/* PAGE HEADER */}

      <div className="module-header">

        <div>

          <span className="module-eyebrow">
            FINANCE
          </span>

          <h1>
            Payroll
          </h1>

          <p>
            Manage employee salaries,
            deductions, payroll processing
            and payslips.
          </p>

        </div>


        <div className="payroll-header-actions">

          <select
            className="month-selector"
            value={month}
            onChange={(event) =>
              setMonth(
                event.target.value,
              )
            }
          >

            {payrollMonths.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ),
            )}

          </select>


          <button
            className="secondary-button"
            onClick={
              openPayrollModal
            }
          >
            + Add Payroll
          </button>


          <button
            className="primary-button"
            onClick={runPayroll}
            disabled={saving}
          >
            {saving
              ? 'Processing...'
              : 'Run Payroll'}
          </button>

        </div>

      </div>


      {/* ERROR */}

      {error && (
        <div className="content-section">

          <p>
            {error}
          </p>

        </div>
      )}


      {/* SUMMARY */}

      <section className="payroll-summary-grid">

        <div className="payroll-summary-card total">

          <div className="payroll-summary-top">

            <span>
              Total Payroll
            </span>

            <span className="payroll-summary-icon">
              ₹
            </span>

          </div>

          <strong>
            {formatCurrency(
              summary.totalPayroll,
            )}
          </strong>

          <small>
            Net payroll for {month}
          </small>

        </div>


        <div className="payroll-summary-card gross">

          <div className="payroll-summary-top">

            <span>
              Gross Salary
            </span>

            <span className="payroll-summary-icon">
              ₹
            </span>

          </div>

          <strong>
            {formatCurrency(
              summary.grossSalary,
            )}
          </strong>

          <small>
            Basic + allowances
          </small>

        </div>


        <div className="payroll-summary-card deductions">

          <div className="payroll-summary-top">

            <span>
              Deductions
            </span>

            <span className="payroll-summary-icon">
              ₹
            </span>

          </div>

          <strong>
            {formatCurrency(
              summary.deductions,
            )}
          </strong>

          <small>
            Total deductions
          </small>

        </div>


        <div className="payroll-summary-card net">

          <div className="payroll-summary-top">

            <span>
              Net Payroll
            </span>

            <span className="payroll-summary-icon">
              ₹
            </span>

          </div>

          <strong>
            {formatCurrency(
              summary.netPayroll,
            )}
          </strong>

          <small>
            Final employee payout
          </small>

        </div>

      </section>


      {/* PAYROLL TABLE */}

      <section className="content-card payroll-table-card">

        <div className="section-heading">

          <div>

            <h2>
              Employee Payroll
            </h2>

            <p>
              Salary breakdown for {month}.
            </p>

          </div>

          <span className="employee-count">
            {filteredEmployees.length}{' '}
            employees
          </span>

        </div>


        {/* FILTERS */}

        <div className="filter-bar payroll-filters">

          <input
            type="search"
            placeholder="Search employee or ID..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
          />


          <select
            value={department}
            onChange={(event) =>
              setDepartment(
                event.target.value,
              )
            }
          >

            {departments.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ),
            )}

          </select>


          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value,
              )
            }
          >

            {statusOptions.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ),
            )}

          </select>

        </div>


        {/* TABLE */}

        {filteredEmployees.length >
        0 ? (

          <div className="payroll-table-wrapper">

            <table className="payroll-table">

              <thead>

                <tr>

                  <th>
                    Employee
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Basic Salary
                  </th>

                  <th>
                    Allowances
                  </th>

                  <th>
                    Deductions
                  </th>

                  <th>
                    Net Salary
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredEmployees.map(
                  (employee) => (

                    <tr
                      key={
                        employee._id
                      }
                    >

                      <td>

                        <div className="employee-cell">

                          <div className="employee-avatar">
                            {(
                              employee.employeeName ||
                              'E'
                            ).charAt(0)}
                          </div>

                          <div>

                            <strong>
                              {
                                employee.employeeName
                              }
                            </strong>

                            <span>
                              {
                                employee.employeeId
                              }
                            </span>

                          </div>

                        </div>

                      </td>


                      <td>
                        {
                          employee.department
                        }
                      </td>


                      <td>
                        {formatCurrency(
                          employee.basic,
                        )}
                      </td>


                      <td className="salary-positive">
                        +
                        {formatCurrency(
                          employee.allowances,
                        )}
                      </td>


                      <td className="salary-negative">
                        -
                        {formatCurrency(
                          employee.deductions,
                        )}
                      </td>


                      <td>

                        <strong>
                          {formatCurrency(
                            employee.net,
                          )}
                        </strong>

                      </td>


                      <td>

                        <span
                          className={`payroll-status ${(
                            employee.status ||
                            ''
                          ).toLowerCase()}`}
                        >
                          {
                            employee.status
                          }
                        </span>

                      </td>


                      <td>

                        <div className="payroll-actions">

                          <button
                            className="table-action-button"
                            onClick={() =>
                              setSelectedEmployee(
                                employee,
                              )
                            }
                          >
                            View
                          </button>


                          <button
                            className="table-action-button"
                            onClick={() =>
                              downloadPayslip(
                                employee,
                              )
                            }
                          >
                            Payslip
                          </button>

                        </div>

                      </td>

                    </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>

        ) : (

          <div className="empty-state">

            <div className="empty-state-icon">
              ₹
            </div>

            <h3>
              No payroll records found
            </h3>

            <p>
              Try changing your search
              or filter options.
            </p>

            <button
              className="secondary-button"
              onClick={() => {
                setSearch('')
                setDepartment('All')
                setStatus('All')
              }}
            >
              Clear filters
            </button>

          </div>

        )}

      </section>


      {/* PAYROLL PROCESSING INFO */}

      <section className="payroll-info-grid">

        <div className="content-card payroll-info-card">

          <span className="module-eyebrow">
            PROCESS
          </span>

          <h2>
            Payroll processing
          </h2>

          <p>
            Review payroll records and
            process pending or draft
            salaries for {month}.
          </p>

          <div className="payroll-process-steps">

            <div className="process-step active">

              <span>
                01
              </span>

              <strong>
                Review
              </strong>

            </div>

            <div className="process-line" />

            <div className="process-step">

              <span>
                02
              </span>

              <strong>
                Process
              </strong>

            </div>

            <div className="process-line" />

            <div className="process-step">

              <span>
                03
              </span>

              <strong>
                Complete
              </strong>

            </div>

          </div>

        </div>


        <div className="content-card payroll-info-card">

          <span className="module-eyebrow">
            PAYSLIPS
          </span>

          <h2>
            Employee payslips
          </h2>

          <p>
            Generate a payslip for any
            processed payroll record.
          </p>

          <div className="payslip-placeholder">

            <span>
              PDF
            </span>

            <div>

              <strong>
                Payslip generation
              </strong>

              <small>
                Available from employee
                payroll records
              </small>

            </div>

          </div>

        </div>

      </section>


      {/* EMPLOYEE DETAIL MODAL */}

      {selectedEmployee && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedEmployee(null)
          }
        >

          <div
            className="leave-modal payroll-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="module-eyebrow">
                  PAYROLL DETAILS
                </span>

                <h2>
                  {
                    selectedEmployee.employeeName
                  }
                </h2>

              </div>


              <button
                className="modal-close"
                onClick={() =>
                  setSelectedEmployee(
                    null,
                  )
                }
              >
                ×
              </button>

            </div>


            <div className="payroll-detail-grid">

              <div>

                <span>
                  Employee ID
                </span>

                <strong>
                  {
                    selectedEmployee.employeeId
                  }
                </strong>

              </div>


              <div>

                <span>
                  Department
                </span>

                <strong>
                  {
                    selectedEmployee.department
                  }
                </strong>

              </div>


              <div>

                <span>
                  Month
                </span>

                <strong>
                  {
                    selectedEmployee.month
                  }
                </strong>

              </div>


              <div>

                <span>
                  Basic Salary
                </span>

                <strong>
                  {formatCurrency(
                    selectedEmployee.basic,
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Allowances
                </span>

                <strong className="salary-positive">
                  +
                  {formatCurrency(
                    selectedEmployee.allowances,
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Deductions
                </span>

                <strong className="salary-negative">
                  -
                  {formatCurrency(
                    selectedEmployee.deductions,
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Net Salary
                </span>

                <strong>
                  {formatCurrency(
                    selectedEmployee.net,
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Status
                </span>

                <strong>
                  {
                    selectedEmployee.status
                  }
                </strong>

              </div>

            </div>


            <div className="modal-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  handleDelete(
                    selectedEmployee,
                  )
                }
              >
                Delete
              </button>


              <button
                className="secondary-button"
                onClick={() =>
                  setSelectedEmployee(
                    null,
                  )
                }
              >
                Close
              </button>


              <button
                className="primary-button"
                onClick={() =>
                  downloadPayslip(
                    selectedEmployee,
                  )
                }
              >
                Download Payslip
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ADD PAYROLL MODAL */}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="leave-modal payroll-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="module-eyebrow">
                  FINANCE
                </span>

                <h2>
                  Add Payroll
                </h2>

              </div>


              <button
                className="modal-close"
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
            >

              <div className="payroll-detail-grid">

                {/* EMPLOYEE */}

                <div>

                  <span>
                    Employee
                  </span>

                  <select
                    value={
                      form.employeeId
                    }
                    onChange={
                      handleEmployeeChange
                    }
                    required
                  >

                    <option value="">
                      Select employee
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={
                            employee._id
                          }
                          value={
                            employee.employeeId
                          }
                        >
                          {
                            employee.name
                          } (
                          {
                            employee.employeeId
                          }
                          )
                        </option>
                      ),
                    )}

                  </select>

                </div>


                {/* EMPLOYEE ID */}

                <div>

                  <span>
                    Employee ID
                  </span>

                  <input
                    value={
                      form.employeeId
                    }
                    readOnly
                  />

                </div>


                {/* DEPARTMENT */}

                <div>

                  <span>
                    Department
                  </span>

                  <input
                    value={
                      form.department
                    }
                    readOnly
                  />

                </div>


                {/* MONTH */}

                <div>

                  <span>
                    Month
                  </span>

                  <select
                    name="month"
                    value={
                      form.month
                    }
                    onChange={
                      handleFormChange
                    }
                  >

                    {payrollMonths.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ),
                    )}

                  </select>

                </div>


                {/* BASIC */}

                <div>

                  <span>
                    Basic Salary
                  </span>

                  <input
                    type="number"
                    name="basic"
                    value={
                      form.basic
                    }
                    onChange={
                      handleFormChange
                    }
                    min="0"
                    required
                  />

                </div>


                {/* ALLOWANCES */}

                <div>

                  <span>
                    Allowances
                  </span>

                  <input
                    type="number"
                    name="allowances"
                    value={
                      form.allowances
                    }
                    onChange={
                      handleFormChange
                    }
                    min="0"
                  />

                </div>


                {/* DEDUCTIONS */}

                <div>

                  <span>
                    Deductions
                  </span>

                  <input
                    type="number"
                    name="deductions"
                    value={
                      form.deductions
                    }
                    onChange={
                      handleFormChange
                    }
                    min="0"
                  />

                </div>


                {/* STATUS */}

                <div>

                  <span>
                    Status
                  </span>

                  <select
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleFormChange
                    }
                  >

                    <option value="Draft">
                      Draft
                    </option>

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Processed">
                      Processed
                    </option>

                  </select>

                </div>

              </div>


              {/* PREVIEW */}

              <div className="payroll-detail-grid">

                <div>

                  <span>
                    Net Salary
                  </span>

                  <strong>
                    {formatCurrency(
                      Number(
                        form.basic || 0,
                      ) +
                        Number(
                          form.allowances ||
                            0,
                        ) -
                        Number(
                          form.deductions ||
                            0,
                        ),
                    )}
                  </strong>

                </div>

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowModal(
                      false,
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Payroll'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

export default Payroll