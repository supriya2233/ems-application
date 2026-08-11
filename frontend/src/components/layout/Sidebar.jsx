import { NavLink } from 'react-router-dom'

function Sidebar({ isOpen, closeSidebar }) {

  const navigationGroups = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: '▦' },
        { label: 'Employees', path: '/employees', icon: '♙' },
        { label: 'Departments', path: '/departments', icon: '▤' },
        { label: 'Attendance', path: '/attendance', icon: '✓' },
        { label: 'Leave Management', path: '/leave', icon: '□' },
        { label: 'Tasks', path: '/tasks', icon: '☑' },
      ],
    },

    {
  title: 'Workforce',
  items: [
    { label: 'Performance', path: '/performance', icon: '◎' },
    { label: 'Recruitment', path: '/recruitment', icon: '♙' },
    { label: 'Onboarding', path: '/onboarding', icon: '+' },
    { label: 'Payroll', path: '/payroll', icon: '₹' },
    { label: 'Assets', path: '/assets', icon: '▱' },
    { label: 'Documents', path: '/documents', icon: '▧' },
  ],

    },

    {
      title: 'Insights',
      items: [
        { label: 'Analytics', path: '/analytics', icon: '▥' },
        { label: 'Reports', path: '/reports', icon: '▤' },
      ],
    },

    {
      title: 'Communication',
      items: [
        { label: 'Announcements', path: '/announcements', icon: '◈' },
        { label: 'Calendar', path: '/calendar', icon: '□' },
      ],
    },

    {
      title: 'System',
      items: [
        { label: 'Notifications', path: '/notifications', icon: '♢' },
        { label: 'Settings', path: '/settings', icon: '⚙' },
        { label: 'Help & Support', path: '/help', icon: '?' },
      ],
    },
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>

      {/* Brand */}

      <div className="sidebar-brand">

        <div className="brand-logo">
          E
        </div>

        <div>
          <h1>EMS</h1>
          <p>Employee Management</p>
        </div>

      </div>


      {/* Navigation */}

      <nav className="sidebar-navigation">

        {navigationGroups.map((group) => (

          <div
            className="navigation-group"
            key={group.title}
          >

            <p className="navigation-label">
              {group.title}
            </p>


            {group.items.map((item) => (

              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive ? 'nav-item-active' : ''
                  }`
                }
              >

                <span className="nav-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>

              </NavLink>

            ))}

          </div>

        ))}

      </nav>



      

    </aside>
  )
}

export default Sidebar