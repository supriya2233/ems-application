import { NavLink } from 'react-router-dom'

function Sidebar({ isOpen, closeSidebar }) {
  const navigationGroups = [
    {
      title: 'MAIN',
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: '▦',
        },
        {
          label: 'Employees',
          path: '/employees',
          icon: '♙',
        },
        {
          label: 'Departments',
          path: '/departments',
          icon: '▤',
        },
        {
          label: 'Tasks',
          path: '/tasks',
          icon: '✓',
          badge: 12,
        },
      ],
    },

    {
      title: 'INSIGHTS',
      items: [
        {
          label: 'Analytics',
          path: '/analytics',
          icon: '▥',
        },
        {
          label: 'Attendance',
          path: '/attendance',
          icon: '✓',
        },
      ],
    },

    {
      title: 'HR',
      items: [
        {
          label: 'Leave Management',
          path: '/leave',
          icon: '□',
          badge: 3,
        },
        {
          label: 'Payroll',
          path: '/payroll',
          icon: '₹',
        },
        {
          label: 'Recruitment',
          path: '/recruitment',
          icon: '♙',
          badge: 5,
        },
        {
          label: 'Onboarding',
          path: '/onboarding',
          icon: '+',
          badge: 2,
        },
        {
          label: 'Performance',
          path: '/performance',
          icon: '◎',
        },
      ],
    },

    {
      title: 'TOOLS',
      items: [
        {
          label: 'Documents',
          path: '/documents',
          icon: '▧',
        },
        {
          label: 'Assets',
          path: '/assets',
          icon: '▱',
        },
        {
          label: 'Calendar',
          path: '/calendar',
          icon: '□',
        },
        {
          label: 'Announcements',
          path: '/announcements',
          icon: '◇',
          badge: 2,
        },
        {
          label: 'Notifications',
          path: '/notifications',
          icon: '♢',
          badge: 4,
        },
      ],
    },

    {
      title: 'SYSTEM',
      items: [
        {
          label: 'Reports',
          path: '/reports',
          icon: '▤',
        },
        {
          label: 'Settings',
          path: '/settings',
          icon: '⚙',
        },
        {
          label: 'Help & Support',
          path: '/help',
          icon: '?',
        },
      ],
    },
  ]

  return (
    <aside
      className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
    >
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

                <span className="nav-label">
                  {item.label}
                </span>

                {item.badge && (
                  <span className="nav-badge">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar