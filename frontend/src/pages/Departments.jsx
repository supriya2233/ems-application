import { useEffect, useMemo, useState } from 'react'
import { getDepartments } from '../services/departmentService'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'

function Departments() {
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
        setError(error.message || 'Failed to load departments')
      } finally {
        setLoading(false)
      }
    }

    loadDepartments()
  }, [])

  const departmentStats = useMemo(() => {
    return {
      totalDepartments: departments.length,

      totalEmployees: departments.reduce(
        (total, department) => total + (department.employees || 0),
        0,
      ),

      activeEmployees: departments.reduce(
        (total, department) => total + (department.active || 0),
        0,
      ),

      employeesOnLeave:
        departments.reduce(
          (total, department) => total + (department.employees || 0),
          0,
        ) -
        departments.reduce(
          (total, department) => total + (department.active || 0),
          0,
        ),
    }
  }, [departments])

  return (
    <div className="module-page">

      <PageHeader
        eyebrow="ORGANIZATION"
        title="Departments"
        description="Manage teams, department structure and workforce distribution."
        action={
          <Button>
            + Add Department
          </Button>
        }
      />

      {/* Loading */}

      {loading && (
        <div className="empty-state">
          <strong>Loading departments...</strong>
          <p>
            Please wait while department information is loaded.
          </p>
        </div>
      )}

      {/* Error */}

      {!loading && error && (
        <div className="empty-state">
          <strong>Failed to load departments</strong>
          <p>{error}</p>
        </div>
      )}

      {/* Content */}

      {!loading && !error && (
        <>
          {/* Stats */}

          <div className="stats-grid">

            <div className="info-card">
              <span>Total Departments</span>
              <strong>
                {departmentStats.totalDepartments}
              </strong>
              <small>Across organization</small>
            </div>

            <div className="info-card">
              <span>Total Employees</span>
              <strong>
                {departmentStats.totalEmployees}
              </strong>
              <small>Across all departments</small>
            </div>

            <div className="info-card">
              <span>Active Employees</span>
              <strong>
                {departmentStats.activeEmployees}
              </strong>
              <small>Currently active</small>
            </div>

            <div className="info-card">
              <span>Employees on Leave</span>
              <strong>
                {departmentStats.employeesOnLeave}
              </strong>
              <small>Currently unavailable</small>
            </div>

          </div>


          {/* Department cards */}

          <section className="content-section">

            <div className="section-heading">

              <div>
                <h2>All Departments</h2>

                <p>
                  Department overview and workforce distribution.
                </p>
              </div>

            </div>


            {departments.length === 0 ? (

              <div className="empty-state">
                <strong>No departments found</strong>

                <p>
                  Add departments to begin managing your organization.
                </p>
              </div>

            ) : (

              <div className="department-grid">

                {departments.map((department) => {

                  const activePercentage =
                    department.employees > 0
                      ? Math.round(
                          (department.active /
                            department.employees) *
                            100,
                        )
                      : 0

                  return (
                    <article
                      className="department-card"
                      key={department._id}
                    >

                      <div className="department-card-top">

                        <div
                          className={`department-icon ${department.color}`}
                        >
                          {department.code}
                        </div>

                        <button className="more-button">
                          •••
                        </button>

                      </div>


                      <h3>
                        {department.name}
                      </h3>


                      <p className="department-description">
                        {department.description}
                      </p>


                      <div className="department-manager">

                        <span>
                          Department Manager
                        </span>

                        <strong>
                          {department.manager || 'Not assigned'}
                        </strong>

                      </div>


                      <div className="department-progress">

                        <div className="progress-label">

                          <span>
                            Active workforce
                          </span>

                          <strong>
                            {activePercentage}%
                          </strong>

                        </div>


                        <div className="progress-track">

                          <div
                            className="progress-fill"
                            style={{
                              width: `${activePercentage}%`,
                            }}
                          />

                        </div>

                      </div>


                      <div className="department-metrics">

                        <div>
                          <strong>
                            {department.employees || 0}
                          </strong>

                          <span>
                            Employees
                          </span>
                        </div>


                        <div>
                          <strong>
                            {department.openTasks || 0}
                          </strong>

                          <span>
                            Open tasks
                          </span>
                        </div>


                        <div>
                          <strong>
                            {department.completedTasks || 0}
                          </strong>

                          <span>
                            Completed
                          </span>
                        </div>

                      </div>

                    </article>
                  )
                })}

              </div>
            )}

          </section>
        </>
      )}

    </div>
  )
}

export default Departments