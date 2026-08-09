import { recentEmployees } from '../../data/dashboardData'

function RecentEmployees() {
  return (
    <section className="dashboard-card recent-employees">
      <div className="dashboard-card-header">
        <div>
          <h2>Recent Employees</h2>
          <p>Recently added employees</p>
        </div>

        <a href="/employees" className="view-all-link">
          View all
        </a>
      </div>

      <div className="employee-list">
        {recentEmployees.map((employee) => (
          <div className="employee-row" key={employee.id}>
            <div className="employee-avatar">
              {employee.name.charAt(0)}
            </div>

            <div className="employee-info">
              <strong>{employee.name}</strong>

              <span>
                {employee.designation} · {employee.department}
              </span>
            </div>

            <span className="status-badge status-active">
              {employee.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default RecentEmployees