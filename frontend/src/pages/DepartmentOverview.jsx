import { useEffect, useState } from 'react'
import { getDepartments } from '../../services/departmentService'

function DepartmentOverview() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await getDepartments()

        setDepartments(data)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadDepartments()
  }, [])

  return (
    <section className="dashboard-panel">

      <div className="dashboard-panel-header">

        <div>
          <h2>Department Overview</h2>

          <p>
            Employees by department
          </p>
        </div>

      </div>

      {loading && (
        <div className="dashboard-message">
          Loading departments...
        </div>
      )}

      {error && (
        <div className="dashboard-message">
          {error}
        </div>
      )}

      {!loading && !error && departments.length === 0 && (
        <div className="dashboard-message">
          No departments found.
        </div>
      )}

      {!loading && !error && departments.length > 0 && (
        <div className="department-list">

          {departments.map((department) => {

            const percentage =
              department.employees > 0
                ? Math.round(
                    (department.active / department.employees) * 100
                  )
                : 0

            return (
              <div
                className="department-item"
                key={department._id}
              >

                <div className="department-header">

                  <span className="department-name">
                    {department.name}
                  </span>

                  <span className="department-count">
                    {department.employees} employees
                  </span>

                </div>

                <div className="department-progress">

                  <div
                    className="department-progress-bar"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />

                </div>

              </div>
            )
          })}

        </div>
      )}

    </section>
  )
}

export default DepartmentOverview