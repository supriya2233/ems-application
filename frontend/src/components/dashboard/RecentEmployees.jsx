function RecentEmployees() {

  const employees = [
    {
      name: 'Arjun Kumar',
      role: 'Software Engineer',
      department: 'Engineering',
      status: 'Active',
    },
    {
      name: 'Priya Sharma',
      role: 'UI/UX Designer',
      department: 'Design',
      status: 'Active',
    },
    {
      name: 'Rahul Verma',
      role: 'Project Manager',
      department: 'Management',
      status: 'Active',
    },
    {
      name: 'Sneha Reddy',
      role: 'HR Executive',
      department: 'Human Resources',
      status: 'Active',
    },
  ]

  return (
    <section className="dashboard-panel">

      <div className="dashboard-panel-header">

        <div>
          <h2>Recent Employees</h2>

          <p>
            Recently added employees
          </p>
        </div>

        <a
          href="/employees"
          className="dashboard-panel-link"
        >
          View all
        </a>

      </div>


      <div className="recent-employees-list">

        {employees.map((employee) => (

          <div
            className="recent-employee"
            key={employee.name}
          >

            <div className="employee-avatar">
              {employee.name.charAt(0)}
            </div>


            <div className="employee-information">

              <h3>
                {employee.name}
              </h3>

              <p>
                {employee.role} · {employee.department}
              </p>

            </div>


            <span className="employee-status">
              {employee.status}
            </span>

          </div>

        ))}

      </div>

    </section>
  )
}

export default RecentEmployees