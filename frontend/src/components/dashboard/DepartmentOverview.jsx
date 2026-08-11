function DepartmentOverview() {

  const departments = [
    { name: 'Engineering', count: 8, percentage: 82 },
    { name: 'Human Resources', count: 4, percentage: 42 },
    { name: 'Design', count: 5, percentage: 52 },
    { name: 'Finance', count: 3, percentage: 30 },
    { name: 'Marketing', count: 4, percentage: 42 },
  ]

  return (
    <section className="dashboard-panel">

      <div className="dashboard-panel-header">

        <div>
          <h2>Department Overview</h2>

          <p>
            Employees by department
          </p>
        </div>

      </div>


      <div className="department-list">

        {departments.map((department) => (

          <div
            className="department-item"
            key={department.name}
          >

            <div className="department-header">

              <span className="department-name">
                {department.name}
              </span>

              <span className="department-count">
                {department.count} employees
              </span>

            </div>


            <div className="department-progress">

              <div
                className="department-progress-bar"
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