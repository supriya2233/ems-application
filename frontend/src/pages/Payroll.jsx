import { useMemo, useState } from 'react'
import {
  payrollEmployees,
  payrollMonths,
  payrollSummary,
} from '../data/payroll'

function formatCurrency(value) {
  return `₹${value.toLocaleString('en-IN')}`
}

function Payroll() {
  const [month, setMonth] = useState(payrollMonths[0])
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('All')
  const [status, setStatus] = useState('All')
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  const departments = [
    'All',
    ...new Set(payrollEmployees.map((employee) => employee.department)),
  ]

  const filteredEmployees = useMemo(() => {
    return payrollEmployees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(search.toLowerCase()) ||
        employee.id.toLowerCase().includes(search.toLowerCase())

      const matchesDepartment =
        department === 'All' ||
        employee.department === department

      const matchesStatus =
        status === 'All' ||
        employee.status === status

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus
      )
    })
  }, [search, department, status])

  const runPayroll = () => {
    alert(
      `Payroll processing for ${month} will be connected to the backend later.`,
    )
  }

  const downloadPayslip = (employee) => {
    alert(
      `Payslip generation for ${employee.name} will be connected to the backend later.`,
    )
  }

  return (
    <div className="module-page payroll-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="module-header">

        <div>
          <span className="module-eyebrow">
            FINANCE
          </span>

          <h1>
            Payroll
          </h1>

          <p>
            Manage employee salaries, deductions, payroll processing
            and payslips.
          </p>
        </div>


        <div className="payroll-header-actions">

          <select
            className="month-selector"
            value={month}
            onChange={(event) =>
              setMonth(event.target.value)
            }
          >
            {payrollMonths.map((item) => (
              <option key={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            className="primary-button"
            onClick={runPayroll}
          >
            Run Payroll
          </button>

        </div>

      </div>


      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="payroll-summary-grid">

        {payrollSummary.map((item) => (
          <div
            className={`payroll-summary-card ${item.type}`}
            key={item.title}
          >

            <div className="payroll-summary-top">

              <span>
                {item.title}
              </span>

              <span className="payroll-summary-icon">
                ₹
              </span>

            </div>

            <strong>
              {item.value}
            </strong>

            <small>
              {item.subtitle}
            </small>

          </div>
        ))}

      </section>


      {/* =================================================
          PAYROLL TABLE
      ================================================= */}

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
            {filteredEmployees.length} employees
          </span>

        </div>


        {/* Filters */}

        <div className="filter-bar payroll-filters">

          <input
            type="search"
            placeholder="Search employee or ID..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            value={department}
            onChange={(event) =>
              setDepartment(event.target.value)
            }
          >
            {departments.map((item) => (
              <option key={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option>All</option>
            <option>Processed</option>
            <option>Pending</option>
            <option>Draft</option>
          </select>

        </div>


        {/* Table */}

        {filteredEmployees.length > 0 ? (

          <div className="payroll-table-wrapper">

            <table className="payroll-table">

              <thead>

                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>

              </thead>


              <tbody>

                {filteredEmployees.map((employee) => (

                  <tr key={employee.id}>

                    <td>

                      <div className="employee-cell">

                        <div className="employee-avatar">
                          {employee.name.charAt(0)}
                        </div>

                        <div>

                          <strong>
                            {employee.name}
                          </strong>

                          <span>
                            {employee.id}
                          </span>

                        </div>

                      </div>

                    </td>


                    <td>
                      {employee.department}
                    </td>


                    <td>
                      {formatCurrency(employee.basic)}
                    </td>


                    <td className="salary-positive">
                      +{formatCurrency(employee.allowances)}
                    </td>


                    <td className="salary-negative">
                      -{formatCurrency(employee.deductions)}
                    </td>


                    <td>
                      <strong>
                        {formatCurrency(employee.net)}
                      </strong>
                    </td>


                    <td>

                      <span
                        className={`payroll-status ${employee.status.toLowerCase()}`}
                      >
                        {employee.status}
                      </span>

                    </td>


                    <td>

                      <div className="payroll-actions">

                        <button
                          className="table-action-button"
                          onClick={() =>
                            setSelectedEmployee(employee)
                          }
                        >
                          View
                        </button>

                        <button
                          className="table-action-button"
                          onClick={() =>
                            downloadPayslip(employee)
                          }
                        >
                          Payslip
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

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
              Try changing your search or filter options.
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


      {/* =================================================
          PAYROLL PROCESSING INFO
      ================================================= */}

      <section className="payroll-info-grid">

        <div className="content-card payroll-info-card">

          <span className="module-eyebrow">
            PROCESS
          </span>

          <h2>
            Payroll processing
          </h2>

          <p>
            Payroll processing will calculate employee earnings,
            allowances, deductions and final net salary automatically
            once the backend is connected.
          </p>

          <div className="payroll-process-steps">

            <div className="process-step active">
              <span>01</span>
              <strong>Review</strong>
            </div>

            <div className="process-line" />

            <div className="process-step">
              <span>02</span>
              <strong>Process</strong>
            </div>

            <div className="process-line" />

            <div className="process-step">
              <span>03</span>
              <strong>Complete</strong>
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
            Employees will be able to access their generated monthly
            payslips after payroll processing is completed.
          </p>

          <div className="payslip-placeholder">
            <span>PDF</span>
            <div>
              <strong>
                Payslip generation
              </strong>
              <small>
                Backend integration pending
              </small>
            </div>
          </div>

        </div>

      </section>


      {/* =================================================
          EMPLOYEE DETAIL MODAL
      ================================================= */}

      {selectedEmployee && (

        <div
          className="modal-overlay"
          onClick={() => setSelectedEmployee(null)}
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
                  {selectedEmployee.name}
                </h2>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedEmployee(null)
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
                  {selectedEmployee.id}
                </strong>
              </div>

              <div>
                <span>
                  Department
                </span>

                <strong>
                  {selectedEmployee.department}
                </strong>
              </div>

              <div>
                <span>
                  Basic Salary
                </span>

                <strong>
                  {formatCurrency(selectedEmployee.basic)}
                </strong>
              </div>

              <div>
                <span>
                  Allowances
                </span>

                <strong className="salary-positive">
                  +{formatCurrency(selectedEmployee.allowances)}
                </strong>
              </div>

              <div>
                <span>
                  Deductions
                </span>

                <strong className="salary-negative">
                  -{formatCurrency(selectedEmployee.deductions)}
                </strong>
              </div>

              <div>
                <span>
                  Net Salary
                </span>

                <strong>
                  {formatCurrency(selectedEmployee.net)}
                </strong>
              </div>

            </div>


            <div className="modal-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  setSelectedEmployee(null)
                }
              >
                Close
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  downloadPayslip(selectedEmployee)
                }
              >
                Download Payslip
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default Payroll