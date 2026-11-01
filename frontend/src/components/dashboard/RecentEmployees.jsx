import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getEmployees } from '../../services/employeeService'
import { getAvatarColor, getInitials } from '../../utils/avatar'

const ROWS_TO_SHOW = 5

// "On Leave" → "on-leave", used for the status pill colour
const toStatusClass = (status = '') =>
  status.toLowerCase().replace(/\s+/g, '-')

const formatJoined = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : '—'

function RecentEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getEmployees()

        // Show the most recently created employees first.
        const recentEmployees = [...data]
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0) -
              new Date(a.createdAt || 0)
          )
          .slice(0, ROWS_TO_SHOW)

        setEmployees(recentEmployees)
      } catch (error) {
        setError(
          error.message ||
            'Failed to load recent employees'
        )
      } finally {
        setLoading(false)
      }
    }

    loadEmployees()
  }, [])

  return (
    <section
      className="dash-panel"
      aria-labelledby="dash-recent-title"
    >

      <header className="dash-panel-header">
        <div>
          <h2 id="dash-recent-title">Recent employees</h2>
          <p>Latest people added to the workspace</p>
        </div>

        <Link to="/employees" className="dash-panel-link">
          View all
        </Link>
      </header>


      {/* LOADING */}

      {loading && (
        <ul className="dash-people" aria-busy="true">
          {Array.from({ length: ROWS_TO_SHOW }, (_, index) => (
            <li className="dash-person" key={index}>
              <span className="dash-skeleton dash-skeleton-avatar" />
              <span className="dash-skeleton dash-skeleton-line" />
            </li>
          ))}
        </ul>
      )}


      {/* ERROR */}

      {!loading && error && (
        <p className="dash-panel-message" role="alert">
          {error}
        </p>
      )}


      {/* EMPTY */}

      {!loading && !error && employees.length === 0 && (
        <p className="dash-panel-message">
          No employees yet.{' '}
          <Link to="/employees">Add the first one</Link>
        </p>
      )}


      {/* LIST */}

      {!loading && !error && employees.length > 0 && (
        <ul className="dash-people">
          {employees.map((employee) => {
            const status = employee.status || 'Active'

            return (
              <li className="dash-person" key={employee._id}>

                <span
                  className="dash-avatar"
                  style={{
                    background: getAvatarColor(employee.name),
                  }}
                  aria-hidden="true"
                >
                  {getInitials(employee.name)}
                </span>

                <div className="dash-person-info">
                  <p className="dash-person-name">
                    {employee.name}
                  </p>
                  <p className="dash-person-meta">
                    {employee.role || 'Employee'}
                    {' · '}
                    {employee.department || 'Unassigned'}
                  </p>
                </div>

                <span
                  className={`dash-status dash-status-${toStatusClass(status)}`}
                >
                  {status}
                </span>

                <span className="dash-person-joined">
                  Joined {formatJoined(employee.joiningDate)}
                </span>

              </li>
            )
          })}
        </ul>
      )}

    </section>
  )
}

export default RecentEmployees
