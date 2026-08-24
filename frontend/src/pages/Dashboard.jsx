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
        setError('')

        const data = await getDashboard()

        setDashboard(data)
      } catch (error) {
        setError(
          error.message || 'Failed to load dashboard'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  /*
   * ------------------------------------------------
   * LOADING
   * ------------------------------------------------
   */

  if (loading) {
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

        </section>

        <div className="content-section">
          <p>Loading dashboard...</p>
        </div>

      </div>
    )
  }

  /*
   * ------------------------------------------------
   * ERROR
   * ------------------------------------------------
   */

  if (error) {
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

        </section>

        <div className="content-section">
          <p>{error}</p>
        </div>

      </div>
    )
  }

  /*
   * ------------------------------------------------
   * SAFETY CHECK
   * ------------------------------------------------
   */

  if (!dashboard) {
    return null
  }

  const employees = dashboard.employees || {}
  const departments = dashboard.departments || {}
  const tasks = dashboard.tasks || {}

  /*
   * ------------------------------------------------
   * CALCULATED VALUES
   * ------------------------------------------------
   */

  const totalEmployees = employees.total || 0
  const activeEmployees = employees.active || 0
  const totalDepartments = departments.total || 0
  const totalTasks = tasks.total || 0
  const pendingTasks = tasks.pending || 0

  const activePercentage =
    totalEmployees > 0
      ? ((activeEmployees / totalEmployees) * 100).toFixed(1)
      : 0

  return (
    <div className="dashboard-page">

      {/* =================================================
          DASHBOARD INTRO
      ================================================= */}

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


      {/* =================================================
          STATISTICS
      ================================================= */}

      <section className="dashboard-stats">

        <StatCard
          title="Total Employees"
          value={totalEmployees}
          description={
            employees.onLeave
              ? `${employees.onLeave} on leave`
              : 'Current employees'
          }
        />

        <StatCard
          title="Active Employees"
          value={activeEmployees}
          description={`${activePercentage}% of total`}
        />

        <StatCard
          title="Departments"
          value={totalDepartments}
          description="Across organization"
        />

        <StatCard
          title="Total Tasks"
          value={totalTasks}
          description={`${pendingTasks} pending`}
          warning={pendingTasks > 0}
        />

      </section>


      {/* =================================================
          LOWER DASHBOARD
      ================================================= */}

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