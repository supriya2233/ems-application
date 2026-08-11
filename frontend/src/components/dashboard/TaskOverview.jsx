function TaskOverview() {

  const tasks = [
    {
      name: 'Completed',
      count: 18,
      percentage: 85,
    },
    {
      name: 'In Progress',
      count: 12,
      percentage: 65,
      type: 'warning',
    },
    {
      name: 'Pending',
      count: 8,
      percentage: 45,
    },
    {
      name: 'Overdue',
      count: 4,
      percentage: 25,
      type: 'danger',
    },
  ]

  return (
    <section className="task-overview">

      <div className="dashboard-panel-header">

        <div>

          <h2>
            Task Overview
          </h2>

          <p>
            Current task distribution
          </p>

        </div>

        <a
          href="/tasks"
          className="dashboard-panel-link"
        >
          View all
        </a>

      </div>


      <div className="task-list">

        {tasks.map((task) => (

          <div
            className="task-item"
            key={task.name}
          >

            <div className="task-header">

              <span className="task-name">
                {task.name}
              </span>

              <span className="task-count">
                {task.count}
              </span>

            </div>


            <div className="task-progress">

              <div
                className={`task-progress-bar ${
                  task.type || ''
                }`}
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