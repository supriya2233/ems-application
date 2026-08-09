import StatCard from '../components/dashboard/StatCard'
import RecentEmployees from '../components/dashboard/RecentEmployees'
import DepartmentOverview from '../components/dashboard/DepartmentOverview'
import TaskOverview from '../components/dashboard/TaskOverview'

import { dashboardStats } from '../data/dashboardData'

function Dashboard() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <p className="welcome-label">Welcome back 👋</p>

          <h1>Good evening, Administrator</h1>

          <p className="welcome-description">
            Here's an overview of your organization's
            employees and activities.
          </p>
        </div>

        <div className="dashboard-date">
          <span>Today</span>
          <strong>
            {new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </strong>
        </div>
      </section>

      <section className="stats-grid">
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            type={stat.type}
          />
        ))}
      </section>

      <section className="dashboard-grid">
        <RecentEmployees />

        <DepartmentOverview />

        <TaskOverview />
      </section>
    </div>
  )
}

export default Dashboard