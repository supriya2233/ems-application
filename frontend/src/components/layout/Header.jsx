import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/tasks': 'Tasks',
}

function Header({ openSidebar }) {
  const location = useLocation()

  const title = pageTitles[location.pathname] || 'Dashboard'

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="mobile-menu-button"
          onClick={openSidebar}
          aria-label="Open menu"
        >
          ☰
        </button>

        <div>
          <p className="header-breadcrumb">
            Employee Management System
          </p>

          <h2>{title}</h2>
        </div>
      </div>

      <div className="header-user">
        <div className="user-avatar">
          A
        </div>

        <div className="user-details">
          <strong>Administrator</strong>
          <span>System Manager</span>
        </div>
      </div>
    </header>
  )
}

export default Header