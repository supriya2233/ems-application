import { departmentOverview } from '../../data/dashboardData'

function DepartmentOverview() {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <h2>Department Overview</h2>
          <p>Employees by department</p>
        </div>
      </div>

      <div className="department-list">
        {departmentOverview.map((department) => (
          <div className="department-item" key={department.name}>
            <div className="department-heading">
              <span>{department.name}</span>

              <strong>
                {department.employees} employees
              </strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${department.percentage}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default DepartmentOverview