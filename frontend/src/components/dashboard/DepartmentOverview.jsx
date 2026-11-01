import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getDepartments } from '../../services/departmentService'

const ROWS_TO_SHOW = 6

function DepartmentOverview() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getDepartments()

        setDepartments(data)
      } catch (error) {
        setError(
          error.message ||
            'Failed to load departments'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDepartments()
  }, [])

  // Largest departments first; bars are relative to the largest.
  const sortedDepartments = [...departments]
    .map((department) => ({
      ...department,
      employeeCount: Number(department.employees) || 0,
    }))
    .sort((a, b) => b.employeeCount - a.employeeCount)

  const visibleDepartments = sortedDepartments.slice(0, ROWS_TO_SHOW)
  const hiddenCount = sortedDepartments.length - visibleDepartments.length

  const maxEmployees = sortedDepartments[0]?.employeeCount || 0

  return (
    <section
      className="dash-panel"
      aria-labelledby="dash-departments-title"
    >

      <header className="dash-panel-header">
        <div>
          <h2 id="dash-departments-title">Departments</h2>
          <p>Headcount by department</p>
        </div>

        <Link to="/departments" className="dash-panel-link">
          View all
        </Link>
      </header>


      {/* LOADING */}

      {loading && (
        <div className="dash-bars" aria-busy="true">
          {[1, 2, 3].map((key) => (
            <span
              className="dash-skeleton dash-skeleton-line"
              key={key}
            />
          ))}
        </div>
      )}


      {/* ERROR */}

      {!loading && error && (
        <p className="dash-panel-message" role="alert">
          {error}
        </p>
      )}


      {/* EMPTY */}

      {!loading && !error && departments.length === 0 && (
        <p className="dash-panel-message">
          No departments yet.{' '}
          <Link to="/departments">Create one</Link>
        </p>
      )}


      {/* BARS */}

      {!loading && !error && departments.length > 0 && (
        <ul className="dash-bars">
          {visibleDepartments.map((department) => {
            const percentage =
              maxEmployees > 0
                ? Math.round(
                    (department.employeeCount / maxEmployees) * 100
                  )
                : 0

            return (
              <li className="dash-bar-row" key={department._id}>
                <div className="dash-bar-label">
                  <span>{department.name}</span>
                  <span className="dash-bar-value">
                    {department.employeeCount}
                  </span>
                </div>

                <div className="dash-bar-track" aria-hidden="true">
                  <div
                    className="dash-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </li>
            )
          })}

          {hiddenCount > 0 && (
            <li className="dash-bar-more">
              +{hiddenCount} more{' '}
              {hiddenCount === 1 ? 'department' : 'departments'}
            </li>
          )}
        </ul>
      )}

    </section>
  )
}

export default DepartmentOverview
