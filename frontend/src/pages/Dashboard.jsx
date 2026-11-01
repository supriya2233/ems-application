import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CircleAlert,
  ListChecks,
  UserCheck,
  Users,
} from 'lucide-react'

import StatCard from '../components/common/StatCard'
import RecentEmployees from '../components/dashboard/RecentEmployees'
import DepartmentOverview from '../components/dashboard/DepartmentOverview'
import TaskOverview from '../components/dashboard/TaskOverview'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import { getDashboard } from '../services/dashboardService'

/* ------------------------------------------------
 * Text helpers
 * ------------------------------------------------ */

// plural(1, 'task') → "1 task", plural(3, 'person', 'people') → "3 people"
const plural = (count, singular, pluralWord = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralWord}`

const capitalize = (text) =>
  text.charAt(0).toUpperCase() + text.slice(1)

function getGreeting(date) {
  const hour = date.getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'

  return 'Good evening'
}

/*
 * Turns the numbers into one plain-English summary, e.g.
 * "You have 48 people across 6 departments. 3 are on leave,
 *  and 5 tasks are overdue."
 */
function buildSummary({
  totalEmployees,
  totalDepartments,
  onLeave,
  overdueTasks,
  openTasks,
}) {
  if (totalEmployees === 0) {
    return 'There are no employees yet. Add your first employee to get the workspace started.'
  }

  const intro = `You have ${plural(totalEmployees, 'person', 'people')} across ${plural(totalDepartments, 'department')}.`

  const details = []

  if (onLeave > 0) {
    details.push(`${onLeave} ${onLeave === 1 ? 'is' : 'are'} on leave`)
  }

  if (overdueTasks > 0) {
    details.push(
      `${plural(overdueTasks, 'task')} ${overdueTasks === 1 ? 'is' : 'are'} overdue`
    )
  } else if (openTasks > 0) {
    details.push(`${plural(openTasks, 'task')} still open`)
  } else {
    details.push('there are no open tasks')
  }

  const detailSentence =
    details.length === 1
      ? details[0]
      : `${details[0]}, and ${details[1]}`

  return `${intro} ${capitalize(detailSentence)}.`
}

/* ------------------------------------------------
 * Dashboard
 * ------------------------------------------------ */

function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Goes up whenever data changes in another tab.
  const refreshKey = useLiveRefresh()

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // `loading` starts as true; live refreshes update quietly.
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
  }, [refreshKey])

  const greeting = getGreeting(new Date())

  const employees = dashboard?.employees || {}
  const departments = dashboard?.departments || {}
  const tasks = dashboard?.tasks || {}
  const pendingLeave = dashboard?.leave?.pending || 0

  const totalEmployees = employees.total || 0
  const activeEmployees = employees.active || 0
  const onLeave = employees.onLeave || 0
  const totalDepartments = departments.total || 0
  const totalTasks = tasks.total || 0
  const pendingTasks = tasks.pending || 0
  const overdueTasks = tasks.overdue || 0
  const openTasks = totalTasks - (tasks.completed || 0)

  const activePercentage =
    totalEmployees > 0
      ? Math.round((activeEmployees / totalEmployees) * 100)
      : 0

  // Only things that need action make it into the callout.
  const attentionItems = [
    pendingLeave > 0 && {
      label: `${plural(pendingLeave, 'leave request')} to review`,
      path: '/approvals',
    },
    overdueTasks > 0 && {
      label: `${plural(overdueTasks, 'overdue task')}`,
      path: '/tasks',
    },
    pendingTasks > 0 && {
      label: `${plural(pendingTasks, 'pending task')}`,
      path: '/tasks',
    },
    onLeave > 0 && {
      label: `${plural(onLeave, 'employee')} on leave`,
      path: '/leave',
    },
  ].filter(Boolean)

  const hasData = !loading && !error && dashboard

  return (
    <div className="dashboard-page">

      {/* ===============================================
          GREETING & SUMMARY
      =============================================== */}

      <section className="dash-intro">
        <h1>{greeting}</h1>

        {loading && (
          <p className="dash-summary" aria-busy="true">
            <span className="dash-skeleton dash-skeleton-line" />
            <span className="visually-hidden">
              Loading summary…
            </span>
          </p>
        )}

        {hasData && (
          <p className="dash-summary">
            {buildSummary({
              totalEmployees,
              totalDepartments,
              onLeave,
              overdueTasks,
              openTasks,
            })}
          </p>
        )}
      </section>


      {/* ===============================================
          ERROR
      =============================================== */}

      {error && (
        <div
          className="dash-callout dash-callout-error"
          role="alert"
        >
          <CircleAlert
            className="dash-callout-icon"
            size={20}
            aria-hidden="true"
          />

          <div>
            <h2>We couldn't load the overview</h2>
            <p>
              {error}. Check that the backend is running on
              port 5000, then refresh the page.
            </p>
          </div>
        </div>
      )}


      {/* ===============================================
          NEEDS ATTENTION
      =============================================== */}

      {hasData && attentionItems.length > 0 && (
        <section
          className="dash-callout"
          aria-labelledby="dash-attention-title"
        >
          <CircleAlert
            className="dash-callout-icon"
            size={20}
            aria-hidden="true"
          />

          <div>
            <h2 id="dash-attention-title">
              Needs your attention
            </h2>

            <ul className="dash-attention-list">
              {attentionItems.map((item) => (
                <li key={item.label}>
                  <Link to={item.path}>
                    {item.label}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}


      {/* ===============================================
          KEY NUMBERS
      =============================================== */}

      {loading && (
        <section className="dash-metrics" aria-hidden="true">
          {[1, 2, 3, 4].map((key) => (
            <div className="dash-metric-skeleton" key={key}>
              <span className="dash-skeleton dash-skeleton-label" />
              <span className="dash-skeleton dash-skeleton-value" />
            </div>
          ))}
        </section>
      )}

      {hasData && (
        <section
          className="dash-metrics"
          aria-label="Key numbers"
        >
          <StatCard
            title="People"
            value={totalEmployees}
            icon={<Users size={16} aria-hidden="true" />}
            description={
              onLeave > 0
                ? `${onLeave} on leave`
                : 'Current headcount'
            }
          />

          <StatCard
            title="Active"
            value={activeEmployees}
            icon={<UserCheck size={16} aria-hidden="true" />}
            description={`${activePercentage}% of headcount`}
          />

          <StatCard
            title="Departments"
            value={totalDepartments}
            icon={<Building2 size={16} aria-hidden="true" />}
            description="Across the organisation"
          />

          <StatCard
            title="Tasks"
            value={totalTasks}
            icon={<ListChecks size={16} aria-hidden="true" />}
            description={
              overdueTasks > 0
                ? `${overdueTasks} overdue`
                : `${openTasks} still open`
            }
            warning={overdueTasks > 0}
          />
        </section>
      )}


      {/* ===============================================
          DETAIL PANELS
      =============================================== */}

      <div className="dash-grid">
        <div className="dash-stack">
          <RecentEmployees refreshKey={refreshKey} />
          <ActivityFeed />
        </div>

        <div className="dash-stack">
          <TaskOverview refreshKey={refreshKey} />
          <DepartmentOverview refreshKey={refreshKey} />
        </div>
      </div>

    </div>
  )
}

export default Dashboard
