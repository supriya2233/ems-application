import { taskOverview } from '../../data/dashboardData'

function TaskOverview() {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <h2>Task Overview</h2>
          <p>Current task distribution</p>
        </div>

        <a href="/tasks" className="view-all-link">
          View all
        </a>
      </div>

      <div className="task-overview">
        {taskOverview.map((task) => (
          <div className="task-stat" key={task.status}>
            <div className="task-stat-top">
              <span>{task.status}</span>
              <strong>{task.count}</strong>
            </div>

            <div className="progress-track">
              <div
                className={`progress-fill task-${task.status
                  .toLowerCase()
                  .replace(' ', '-')}`}
                style={{
                  width: `${task.percentage}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TaskOverview