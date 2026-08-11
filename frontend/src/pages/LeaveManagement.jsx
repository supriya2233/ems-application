import { useMemo, useState } from 'react'
import {
  leaveBalances,
  leaveRequests,
  leaveCalendar,
} from '../data/leaves'

function LeaveManagement() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const matchesStatus =
        statusFilter === 'All' || request.status === statusFilter

      const matchesType =
        typeFilter === 'All' || request.type === typeFilter

      const matchesSearch =
        request.employee.toLowerCase().includes(search.toLowerCase())

      return matchesStatus && matchesType && matchesSearch
    })
  }, [statusFilter, typeFilter, search])

  const totalEntitlement = leaveBalances.reduce(
    (sum, leave) => sum + leave.total,
    0
  )

  const totalUsed = leaveBalances.reduce(
    (sum, leave) => sum + leave.used,
    0
  )

  const totalRemaining = leaveBalances.reduce(
    (sum, leave) => sum + leave.remaining,
    0
  )

  const pendingCount = leaveRequests.filter(
    (request) => request.status === 'Pending'
  ).length

  return (
    <div className="module-page leave-page">

      {/* Page Header */}
      <div className="module-header">
        <div>
          <span className="module-eyebrow">WORKFORCE</span>
          <h1>Leave Management</h1>
          <p>
            Manage employee leave balances, requests and upcoming absences.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          + Request Leave
        </button>
      </div>

      {/* Summary Cards */}
      <section className="leave-summary-grid">

        <div className="leave-summary-card">
          <span>Total Entitlement</span>
          <strong>{totalEntitlement}</strong>
          <small>Days available this year</small>
        </div>

        <div className="leave-summary-card">
          <span>Used</span>
          <strong>{totalUsed}</strong>
          <small>Days already used</small>
        </div>

        <div className="leave-summary-card">
          <span>Remaining</span>
          <strong>{totalRemaining}</strong>
          <small>Days available</small>
        </div>

        <div className="leave-summary-card warning">
          <span>Pending Requests</span>
          <strong>{pendingCount}</strong>
          <small>Awaiting approval</small>
        </div>

      </section>

      {/* Leave Balances */}
      <section className="content-card">
        <div className="section-heading">
          <div>
            <h2>Leave Balance</h2>
            <p>Current leave entitlement by category.</p>
          </div>
        </div>

        <div className="leave-balance-grid">
          {leaveBalances.map((leave) => {
            const percentage =
              leave.total > 0
                ? (leave.used / leave.total) * 100
                : 0

            return (
              <div className="balance-item" key={leave.type}>

                <div className="balance-top">
                  <div>
                    <strong>{leave.type}</strong>
                    <span>
                      {leave.used} used · {leave.remaining} remaining
                    </span>
                  </div>

                  <b>{leave.total} days</b>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

              </div>
            )
          })}
        </div>
      </section>

      {/* Leave Requests */}
      <section className="content-card">

        <div className="section-heading">
          <div>
            <h2>Leave Requests</h2>
            <p>Review and manage employee leave applications.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">

          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Leave Types</option>
            <option value="Annual">Annual</option>
            <option value="Casual">Casual</option>
            <option value="Medical">Medical</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

        </div>

        {/* Requests */}
        {filteredRequests.length > 0 ? (
          <div className="leave-table-wrapper">

            <table className="leave-table">

              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>

                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          {request.employee.charAt(0)}
                        </div>

                        <div>
                          <strong>{request.employee}</strong>
                          <span>{request.department}</span>
                        </div>
                      </div>
                    </td>

                    <td>{request.type}</td>

                    <td>
                      <span>
                        {request.from} → {request.to}
                      </span>
                    </td>

                    <td>{request.days}</td>

                    <td>{request.reason}</td>

                    <td>
                      <span
                        className={`status-badge status-${request.status.toLowerCase()}`}
                      >
                        {request.status}
                      </span>
                    </td>

                    <td>
                      {request.status === 'Pending' ? (
                        <div className="action-buttons">
                          <button className="approve-button">
                            Approve
                          </button>

                          <button className="reject-button">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="muted-text">No action</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">✓</div>
            <h3>No leave requests found</h3>
            <p>
              Try changing your search or filter options.
            </p>
          </div>
        )}

      </section>

      {/* Upcoming Leave Calendar */}
      <section className="content-card">

        <div className="section-heading">
          <div>
            <h2>Upcoming Leave</h2>
            <p>Employees currently scheduled to be away.</p>
          </div>
        </div>

        <div className="leave-calendar-list">
          {leaveCalendar.map((item) => (
            <div className="calendar-leave-item" key={item.id}>

              <div className="calendar-date">
                <strong>{item.day}</strong>
                <span>{item.month}</span>
              </div>

              <div className="calendar-person">
                <strong>{item.employee}</strong>
                <span>{item.type} · {item.days} days</span>
              </div>

              <span className="calendar-department">
                {item.department}
              </span>

            </div>
          ))}
        </div>

      </section>

      {/* Request Leave Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="leave-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <div>
                <span className="module-eyebrow">LEAVE</span>
                <h2>Request Leave</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-form">

              <label>
                Employee
                <input
                  type="text"
                  placeholder="Employee name"
                />
              </label>

              <label>
                Leave Type
                <select>
                  <option>Annual</option>
                  <option>Casual</option>
                  <option>Medical</option>
                </select>
              </label>

              <div className="form-row">

                <label>
                  From
                  <input type="date" />
                </label>

                <label>
                  To
                  <input type="date" />
                </label>

              </div>

              <label>
                Reason
                <textarea
                  rows="4"
                  placeholder="Enter reason for leave..."
                />
              </label>

              <div className="modal-actions">

                <button
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  onClick={() => setShowModal(false)}
                >
                  Submit Request
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default LeaveManagement