import { useEffect, useState } from 'react'
import { getEmployees } from '../../services/employeeService'

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
          .slice(0, 4)

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

  const getInitial = (name = '') => {
    return name
      .trim()
      .charAt(0)
      .toUpperCase()
  }

  return (
    <section className="dashboard-panel">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="dashboard-panel-header">

        <div>

          <h2>
            Recent Employees
          </h2>

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


      {/* ==========================================
          LOADING
      ========================================== */}

      {loading && (
        <div className="recent-employees-list">
          <p>Loading employees...</p>
        </div>
      )}


      {/* ==========================================
          ERROR
      ========================================== */}

      {!loading && error && (
        <div className="recent-employees-list">
          <p>{error}</p>
        </div>
      )}


      {/* ==========================================
          EMPTY STATE
      ========================================== */}

      {!loading &&
        !error &&
        employees.length === 0 && (
          <div className="recent-employees-list">
            <p>No employees found.</p>
          </div>
        )}


      {/* ==========================================
          EMPLOYEE LIST
      ========================================== */}

      {!loading &&
        !error &&
        employees.length > 0 && (

          <div className="recent-employees-list">

            {employees.map((employee) => (

              <div
                className="recent-employee"
                key={employee._id}
              >

                {/* AVATAR */}

                <div className="employee-avatar">
                  {getInitial(employee.name)}
                </div>


                {/* INFORMATION */}

                <div className="employee-information">

                  <h3>
                    {employee.name}
                  </h3>

                  <p>
                    {employee.role || 'Employee'}
                    {' · '}
                    {employee.department || 'Unassigned'}
                  </p>

                </div>


                {/* STATUS */}

                <span className="employee-status">
                  {employee.status || 'Active'}
                </span>

              </div>

            ))}

          </div>

        )}

    </section>
  )
}

export default RecentEmployees