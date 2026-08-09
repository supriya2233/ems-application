import { NavLink } from 'react-router-dom'

const navigationItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: '▦',
  },
  {
    name: 'Employees',
    path: '/employees',
    icon: '♙',
  },
  {
    name: 'Departments',
    path: '/departments',
    icon: '▤',
  },
  {
    name: 'Tasks',
    path: '/tasks',
    icon: '✓',
  },
]

function Sidebar({ isOpen, closeSidebar }) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">E</div>

        <div>
          <h1>EMS</h1>
          <p>Employee Management</p>
        </div>
      </div>

      <nav className="sidebar-navigation">
        <p className="navigation-label">MAIN MENU</p>

        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-info">
          <span className="status-dot" />

          <div>
            <p>System Status</p>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar