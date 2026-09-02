import { useEffect, useMemo, useState } from 'react'
import {
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
} from '../services/leaveService'
import { getEmployees } from '../services/employeeService'

const leaveTypes = [
  'Annual',
  'Casual',
  'Medical',
  'Other',
]

const statusOptions = [
  'All',
  'Pending',
  'Approved',
  'Rejected',
]

function LeaveManagement() {
  const [leaves, setLeaves] = useState([])
  const [employees, setEmployees] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('All')
  const [typeFilter, setTypeFilter] =
    useState('All')

  const [showModal, setShowModal] =
    useState(false)

  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    employeeId: '',
    employee: '',
    department: '',
    type: 'Annual',
    from: '',
    to: '',
    days: 1,
    reason: '',
    status: 'Pending',
  })

  // ==========================================
  // LOAD LEAVES + EMPLOYEES
  // ==========================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError('')

        const [leaveData, employeeData] =
          await Promise.all([
            getLeaves(),
            getEmployees(),
          ])

        setLeaves(leaveData)
        setEmployees(employeeData)
      } catch (error) {
        console.error(
          'Failed to load leave data:',
          error,
        )

        setError(
          error.message ||
            'Failed to load leave management data',
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // ==========================================
  // DATE HELPERS
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return '—'
    }

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
    )
  }

  const calculateDays = (from, to) => {
    if (!from || !to) {
      return 1
    }

    const start = new Date(from)
    const end = new Date(to)

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return 1
    }

    const difference =
      end.getTime() - start.getTime()

    const days =
      Math.floor(
        difference /
          (1000 * 60 * 60 * 24),
      ) + 1

    return Math.max(days, 1)
  }

  // ==========================================
  // FILTERED LEAVES
  // ==========================================

  const filteredLeaves = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase()

    return leaves.filter((leave) => {
      const matchesSearch =
        !searchValue ||
        leave.employee
          ?.toLowerCase()
          .includes(searchValue) ||
        leave.department
          ?.toLowerCase()
          .includes(searchValue) ||
        leave.reason
          ?.toLowerCase()
          .includes(searchValue)

      const matchesStatus =
        statusFilter === 'All' ||
        leave.status === statusFilter

      const matchesType =
        typeFilter === 'All' ||
        leave.type === typeFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      )
    })
  }, [
    leaves,
    search,
    statusFilter,
    typeFilter,
  ])

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    const total = leaves.length

    const pending = leaves.filter(
      (leave) =>
        leave.status === 'Pending',
    ).length

    const approved = leaves.filter(
      (leave) =>
        leave.status === 'Approved',
    ).length

    const totalDays = leaves.reduce(
      (sum, leave) =>
        sum + Number(leave.days || 0),
      0,
    )

    return {
      total,
      pending,
      approved,
      totalDays,
    }
  }, [leaves])

  // ==========================================
  // UPCOMING LEAVE
  // ==========================================

  const upcomingLeaves = useMemo(() => {
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    return [...leaves]
      .filter((leave) => {
        if (!leave.from) {
          return false
        }

        const startDate =
          new Date(leave.from)

        return (
          startDate >= today &&
          leave.status === 'Approved'
        )
      })
      .sort(
        (a, b) =>
          new Date(a.from) -
          new Date(b.from),
      )
      .slice(0, 5)
  }, [leaves])

  // ==========================================
  // EMPLOYEE SELECTION
  // ==========================================

  const handleEmployeeChange = (event) => {
    const employeeId =
      event.target.value

    const selectedEmployee =
      employees.find(
        (employee) =>
          employee.employeeId ===
          employeeId,
      )

    if (!selectedEmployee) {
      setForm((previous) => ({
        ...previous,
        employeeId: '',
        employee: '',
        department: '',
      }))

      return
    }

    setForm((previous) => ({
      ...previous,
      employeeId:
        selectedEmployee.employeeId,
      employee: selectedEmployee.name,
      department:
        selectedEmployee.department,
    }))
  }

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleFormChange = (event) => {
    const { name, value } =
      event.target

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      }

      if (
        name === 'from' ||
        name === 'to'
      ) {
        updated.days =
          calculateDays(
            name === 'from'
              ? value
              : previous.from,
            name === 'to'
              ? value
              : previous.to,
          )
      }

      return updated
    })
  }

  // ==========================================
  // OPEN MODAL
  // ==========================================

  const openRequestModal = () => {
    setForm({
      employeeId: '',
      employee: '',
      department: '',
      type: 'Annual',
      from: '',
      to: '',
      days: 1,
      reason: '',
      status: 'Pending',
    })

    setShowModal(true)
  }

  // ==========================================
  // CREATE LEAVE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.employeeId) {
      setError(
        'Please select an employee.',
      )

      return
    }

    try {
      setSaving(true)
      setError('')

      const created =
        await createLeave({
          employeeId:
            form.employeeId,

          employee:
            form.employee,

          department:
            form.department,

          type: form.type,

          from: form.from,

          to: form.to,

          days: Number(form.days),

          reason: form.reason,

          status: 'Pending',
        })

      setLeaves((previous) => [
        created,
        ...previous,
      ])

      setShowModal(false)
    } catch (error) {
      setError(
        error.message ||
          'Failed to submit leave request',
      )
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const handleStatusChange = async (
    id,
    status,
  ) => {
    try {
      setError('')

      const updated =
        await updateLeave(id, {
          status,
        })

      setLeaves((previous) =>
        previous.map((leave) =>
          leave._id === id
            ? updated
            : leave,
        ),
      )
    } catch (error) {
      setError(
        error.message ||
          'Failed to update leave request',
      )
    }
  }

  const handleApprove = (id) => {
    handleStatusChange(
      id,
      'Approved',
    )
  }

  const handleReject = (id) => {
    handleStatusChange(
      id,
      'Rejected',
    )
  }

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this leave request?',
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await deleteLeave(id)

      setLeaves((previous) =>
        previous.filter(
          (leave) =>
            leave._id !== id,
        ),
      )
    } catch (error) {
      setError(
        error.message ||
          'Failed to delete leave request',
      )
    }
  }

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    return `leave-status leave-status-${(
      status || ''
    ).toLowerCase()}`
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="module-page">

        <div className="module-header">

          <div>

            <span className="module-eyebrow">
              PEOPLE OPERATIONS
            </span>

            <h1>
              Leave Management
            </h1>

            <p>
              Manage leave requests,
              approvals and employee
              leave activity.
            </p>

          </div>

        </div>

        <div className="content-section">

          <p>
            Loading leave management...
          </p>

        </div>

      </div>
    )
  }

  return (
    <div className="module-page">

      {/* HEADER */}

      <div className="module-header">

        <div>

          <span className="module-eyebrow">
            PEOPLE OPERATIONS
          </span>

          <h1>
            Leave Management
          </h1>

          <p>
            Manage leave requests,
            approvals and employee
            leave activity.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={
            openRequestModal
          }
        >
          + Request Leave
        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="content-section">

          <p>{error}</p>

        </div>
      )}


      {/* SUMMARY */}

      <div className="stats-grid">

        <div className="info-card">

          <span>
            Total Requests
          </span>

          <strong>
            {summary.total}
          </strong>

          <small>
            All leave requests
          </small>

        </div>


        <div className="info-card">

          <span>
            Pending
          </span>

          <strong>
            {summary.pending}
          </strong>

          <small>
            Awaiting approval
          </small>

        </div>


        <div className="info-card">

          <span>
            Approved
          </span>

          <strong>
            {summary.approved}
          </strong>

          <small>
            Approved requests
          </small>

        </div>


        <div className="info-card">

          <span>
            Total Days
          </span>

          <strong>
            {summary.totalDays}
          </strong>

          <small>
            Across all requests
          </small>

        </div>

      </div>


      {/* REQUESTS */}

      <div className="content-section">

        <div className="section-header">

          <div>

            <h2>
              Leave Requests
            </h2>

            <p>
              Review and manage employee
              leave requests.
            </p>

          </div>

        </div>


        {/* FILTERS */}

        <div className="filters">

          <input
            type="search"
            placeholder="Search employee..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
          />


          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
          >

            {statusOptions.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ),
            )}

          </select>


          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value,
              )
            }
          >

            <option value="All">
              All Types
            </option>

            {leaveTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ),
            )}

          </select>

        </div>


        {/* TABLE */}

        <div className="ui-table-wrapper">

          <table className="ui-table">

            <thead>

              <tr>

                <th>
                  Employee
                </th>

                <th>
                  Type
                </th>

                <th>
                  From
                </th>

                <th>
                  To
                </th>

                <th>
                  Days
                </th>

                <th>
                  Reason
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

              {filteredLeaves.length ===
              0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="ui-table-empty"
                  >
                    No leave requests
                    found.
                  </td>

                </tr>

              ) : (

                filteredLeaves.map(
                  (leave) => (

                    <tr
                      key={leave._id}
                    >

                      <td>

                        <strong>
                          {leave.employee}
                        </strong>

                        <small>
                          {leave.department}
                        </small>

                      </td>


                      <td>
                        {leave.type}
                      </td>


                      <td>
                        {formatDate(
                          leave.from,
                        )}
                      </td>


                      <td>
                        {formatDate(
                          leave.to,
                        )}
                      </td>


                      <td>
                        {leave.days}
                      </td>


                      <td>
                        {leave.reason}
                      </td>


                      <td>

                        <span
                          className={getStatusClass(
                            leave.status,
                          )}
                        >
                          {leave.status}
                        </span>

                      </td>


                      <td>

                        <div className="leave-actions">

                          {leave.status ===
                            'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleApprove(
                                    leave._id,
                                  )
                                }
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleReject(
                                    leave._id,
                                  )
                                }
                              >
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                leave._id,
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ),
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* UPCOMING LEAVE */}

      <div className="content-section">

        <div className="section-header">

          <div>

            <h2>
              Upcoming Leave
            </h2>

            <p>
              Approved upcoming employee
              leave.
            </p>

          </div>

        </div>


        {upcomingLeaves.length === 0 ? (

          <p>
            No upcoming approved leave.
          </p>

        ) : (

          <div className="upcoming-leave-list">

            {upcomingLeaves.map(
              (leave) => (

                <div
                  className="upcoming-leave-item"
                  key={leave._id}
                >

                  <div>

                    <strong>
                      {leave.employee}
                    </strong>

                    <span>
                      {leave.department}
                    </span>

                  </div>


                  <div>

                    <strong>
                      {formatDate(
                        leave.from,
                      )}
                    </strong>

                    <span>
                      {leave.days}{' '}
                      {leave.days === 1
                        ? 'day'
                        : 'days'}
                    </span>

                  </div>


                  <span>
                    {leave.type}
                  </span>

                </div>

              ),
            )}

          </div>

        )}

      </div>


      {/* REQUEST LEAVE MODAL */}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="module-eyebrow">
                  PEOPLE OPERATIONS
                </span>

                <h2>
                  Request Leave
                </h2>

              </div>


              <button
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
              className="leave-form"
            >

              <div className="form-grid">

                {/* EMPLOYEE */}

                <div>

                  <label>
                    Employee
                  </label>

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
                          {employee.name} (
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

                  <label>
                    Employee ID
                  </label>

                  <input
                    value={
                      form.employeeId
                    }
                    readOnly
                    placeholder="Select employee"
                  />

                </div>


                {/* DEPARTMENT */}

                <div>

                  <label>
                    Department
                  </label>

                  <input
                    value={
                      form.department
                    }
                    readOnly
                    placeholder="Select employee"
                  />

                </div>


                {/* LEAVE TYPE */}

                <div>

                  <label>
                    Leave Type
                  </label>

                  <select
                    name="type"
                    value={form.type}
                    onChange={
                      handleFormChange
                    }
                  >

                    {leaveTypes.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      ),
                    )}

                  </select>

                </div>


                {/* FROM */}

                <div>

                  <label>
                    From
                  </label>

                  <input
                    type="date"
                    name="from"
                    value={
                      form.from
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>


                {/* TO */}

                <div>

                  <label>
                    To
                  </label>

                  <input
                    type="date"
                    name="to"
                    value={
                      form.to
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>


                {/* DAYS */}

                <div>

                  <label>
                    Days
                  </label>

                  <input
                    type="number"
                    value={
                      form.days
                    }
                    readOnly
                  />

                </div>


                {/* REASON */}

                <div className="form-full">

                  <label>
                    Reason
                  </label>

                  <textarea
                    name="reason"
                    value={
                      form.reason
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Reason for leave..."
                    rows="4"
                    required
                  />

                </div>

              </div>


              <div className="form-actions">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving ||
                    employees.length ===
                      0
                  }
                >
                  {saving
                    ? 'Submitting...'
                    : 'Submit Request'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

export default LeaveManagement