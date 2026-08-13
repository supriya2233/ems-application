import { departments, departmentStats } from '../data/departments'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'

function Departments() {
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

      {/* Stats */}
      <div className="stats-grid">

        <div className="info-card">
          <span>Total Departments</span>
          <strong>{departmentStats.totalDepartments}</strong>
          <small>Across organization</small>
        </div>

        <div className="info-card">
          <span>Total Employees</span>
          <strong>{departmentStats.totalEmployees}</strong>
          <small>Across all departments</small>
        </div>

        <div className="info-card">
          <span>Active Employees</span>
          <strong>{departmentStats.activeEmployees}</strong>
          <small>Currently active</small>
        </div>

        <div className="info-card">
          <span>Employees on Leave</span>
          <strong>{departmentStats.employeesOnLeave}</strong>
          <small>Currently unavailable</small>
        </div>

      </div>

      {/* Department cards */}
      <section className="content-section">

        <div className="section-heading">
          <div>
            <h2>All Departments</h2>
            <p>Department overview and workforce distribution.</p>
          </div>
        </div>

        <div className="department-grid">

          {departments.map((department) => {

            const activePercentage =
              Math.round(
                (department.active / department.employees) * 100
              )

            return (
              <article
                className="department-card"
                key={department.id}
              >

                <div className="department-card-top">

                  <div className={`department-icon ${department.color}`}>
                    {department.code}
                  </div>

                  <button className="more-button">
                    •••
                  </button>

                </div>

                <h3>{department.name}</h3>

                <p className="department-description">
                  {department.description}
                </p>

                <div className="department-manager">
                  <span>Department Manager</span>
                  <strong>{department.manager}</strong>
                </div>

                <div className="department-progress">

                  <div className="progress-label">
                    <span>Active workforce</span>
                    <strong>{activePercentage}%</strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${activePercentage}%` }}
                    />
                  </div>

                </div>

                <div className="department-metrics">

                  <div>
                    <strong>{department.employees}</strong>
                    <span>Employees</span>
                  </div>

                  <div>
                    <strong>{department.openTasks}</strong>
                    <span>Open tasks</span>
                  </div>

                  <div>
                    <strong>{department.completedTasks}</strong>
                    <span>Completed</span>
                  </div>

                </div>

              </article>
            )
          })}

        </div>

      </section>

    </div>
  )
}

export default Departments