import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

import { getNavigationMatch } from '../../config/navigation'
import NotificationBell from '../live/NotificationBell'

/*
 * Builds the breadcrumb for the current URL, e.g.
 *   /employees      → Workspace / Employees
 *   /employees/123  → Workspace / Employees / Profile
 */
function getBreadcrumb(pathname) {
  const match = getNavigationMatch(pathname)

  if (!match) {
    return []
  }

  const { group, item } = match
  const isNested = pathname !== item.path

  const crumbs = [
    { label: group.title },
    {
      label: item.label,
      // Only link back to the section when we're on a sub-page
      path: isNested ? item.path : null,
    },
  ]

  if (isNested) {
    crumbs.push({
      label: item.path === '/employees' ? 'Profile' : 'Details',
    })
  }

  return crumbs
}

function Header({ openSidebar, isSidebarOpen }) {
  const { pathname } = useLocation()
  const breadcrumb = getBreadcrumb(pathname)
  const today = new Date()

  return (
    <header className="header">

      <div className="header-left">

        <button
          type="button"
          className="mobile-menu-button"
          onClick={openSidebar}
          aria-label="Open navigation"
          aria-controls="app-sidebar"
          aria-expanded={isSidebarOpen}
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <nav
          className="header-breadcrumb"
          aria-label="Breadcrumb"
        >
          <ol>
            {breadcrumb.map((crumb, index) => {
              const isCurrent =
                index === breadcrumb.length - 1

              return (
                <li
                  key={crumb.label}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {crumb.path ? (
                    <Link to={crumb.path}>
                      {crumb.label}
                    </Link>
                  ) : (
                    crumb.label
                  )}
                </li>
              )
            })}
          </ol>
        </nav>

      </div>

      <div className="header-right">

        <NotificationBell />

        <time
          className="header-date"
          dateTime={today.toISOString().slice(0, 10)}
        >
          {today.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </time>

        <span
          className="header-divider"
          aria-hidden="true"
        />

        <div className="header-user">

          <span
            className="header-avatar"
            aria-hidden="true"
          >
            A
          </span>

          <span className="header-user-info">
            <span className="header-user-name">
              Administrator
            </span>
            <span className="header-user-role">
              System manager
            </span>
          </span>

        </div>

      </div>

    </header>
  )
}

export default Header
