import { useEffect, useState } from 'react'

import StatCard from '../components/common/StatCard'
import RecentEmployees from '../components/dashboard/RecentEmployees'
import DepartmentOverview from '../components/dashboard/DepartmentOverview'
import TaskOverview from '../components/dashboard/TaskOverview'
import { getDashboard } from '../services/dashboardService'

function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)

        const data = await getDashboard()

        setDashboard(data)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="dashboard-page">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <p>Failed to load dashboard: {error}</p>
      </div>
    )
  }

  return (
    <div className="dashboard-page">

      <section className="dashboard-welcome">

        <div>
          <p className="dashboard-eyebrow">
            Organization Overview
          </p>

          <h1>
            Dashboard
          </h1>

          <p className="dashboard-description">
            Overview of your organization's employees and activities.
          </p>
        </div>

        <div className="dashboard-date">
          <span>
            Today
          </span>

          <strong>
            {new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </strong>
        </div>

      </section>

      <section className="dashboard-stats">

        <StatCard
          title="Total Employees"
          value={dashboard.employees.total}
          description={`${dashboard.employees.active} currently active`}
        />

        <StatCard
          title="Active Employees"
          value={dashboard.employees.active}
          description={`${dashboard.employees.onLeave} on leave`}
        />

        <StatCard
          title="Departments"
          value={dashboard.departments.total}
          description="Across organization"
        />

        <StatCard
          title="Total Tasks"
          value={dashboard.tasks.total}
          description={`${dashboard.tasks.pending} pending`}
          warning={dashboard.tasks.pending > 0}
        />

      </section>

      <section className="dashboard-grid">

        <div>
          <RecentEmployees />
        </div>

        <div>
          <DepartmentOverview />

          <div style={{ marginTop: '12px' }}>
            <TaskOverview />
          </div>
        </div>

      </section>

    </div>
  )
}

export default Dashboard