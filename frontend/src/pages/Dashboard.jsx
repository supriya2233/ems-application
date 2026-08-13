import StatCard from '../components/common/StatCard'
import RecentEmployees from '../components/dashboard/RecentEmployees'
import DepartmentOverview from '../components/dashboard/DepartmentOverview'
import TaskOverview from '../components/dashboard/TaskOverview'

function Dashboard() {

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
            11 Aug 2026
          </strong>

        </div>

      </section>


      {/* =================================================
          STATISTICS
      ================================================= */}

      <section className="dashboard-stats">

        <StatCard
          title="Total Employees"
          value="24"
          description="+4 this month"
        />

        <StatCard
          title="Active Employees"
          value="21"
          description="87.5% of total"
        />

        <StatCard
          title="Departments"
          value="6"
          description="Across organization"
        />

        <StatCard
          title="Total Tasks"
          value="42"
          description="12 pending"
          warning
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