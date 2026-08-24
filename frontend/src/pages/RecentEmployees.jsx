import { useEffect, useState } from 'react'
import { getEmployees } from '../../services/employeeService'

function RecentEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees()

        // Show the most recently added employees first
        setEmployees(data.slice(0, 4))
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadEmployees()
  }, [])

  return (
    <section className="dashboard-panel">

      <div className="dashboard-panel-header">

        <div>
          <h2>Recent Employees</h2>

          <p>
            Recently added employees
          </p>
        </div>

        <a
          href="/employees"
          className="dashboard-panel-link"
        >
          View all
        </a>

      </div>

      {loading && (
        <div className="dashboard-message">
          Loading employees...
        </div>
      )}

      {error && (
        <div className="dashboard-message">
          {error}
        </div>
      )}

      {!loading && !error && employees.length === 0 && (
        <div className="dashboard-message">
          No employees found.
        </div>
      )}

      {!loading && !error && employees.length > 0 && (
        <div className="recent-employees-list">

          {employees.map((employee) => (

            <div
              className="recent-employee"
              key={employee._id}
            >

              <div className="employee-avatar">
                {employee.initials ||
                  employee.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
              </div>

              <div className="employee-information">

                <h3>
                  {employee.name}
                </h3>

                <p>
                  {employee.role} · {employee.department}
                </p>

              </div>

              <span className="employee-status">
                {employee.status}
              </span>

            </div>

          ))}

        </div>
      )}

    </section>
  )
}

export default RecentEmployees