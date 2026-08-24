import { useEffect, useState } from 'react'
import { getDepartments } from '../../services/departmentService'

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

  /*
   * Calculate the largest department count.
   * This lets the progress bars represent the
   * department sizes dynamically.
   */
  const maxEmployees =
    departments.length > 0
      ? Math.max(
          ...departments.map(
            (department) =>
              Number(department.employees) || 0
          )
        )
      : 0

  return (
    <section className="dashboard-panel">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="dashboard-panel-header">

        <div>

          <h2>
            Department Overview
          </h2>

          <p>
            Employees by department
          </p>

        </div>

      </div>


      {/* ==========================================
          LOADING
      ========================================== */}

      {loading && (
        <div className="department-list">
          <p>Loading departments...</p>
        </div>
      )}


      {/* ==========================================
          ERROR
      ========================================== */}

      {!loading && error && (
        <div className="department-list">
          <p>{error}</p>
        </div>
      )}


      {/* ==========================================
          EMPTY STATE
      ========================================== */}

      {!loading &&
        !error &&
        departments.length === 0 && (
          <div className="department-list">
            <p>No departments found.</p>
          </div>
        )}


      {/* ==========================================
          DEPARTMENTS
      ========================================== */}

      {!loading &&
        !error &&
        departments.length > 0 && (

          <div className="department-list">

            {departments.map((department) => {

              const employeeCount =
                Number(department.employees) || 0

              const percentage =
                maxEmployees > 0
                  ? Math.round(
                      (employeeCount /
                        maxEmployees) *
                        100
                    )
                  : 0

              return (
                <div
                  className="department-item"
                  key={department._id}
                >

                  {/* HEADER */}

                  <div className="department-header">

                    <span className="department-name">
                      {department.name}
                    </span>

                    <span className="department-count">
                      {employeeCount}{' '}
                      {employeeCount === 1
                        ? 'employee'
                        : 'employees'}
                    </span>

                  </div>


                  {/* PROGRESS */}

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