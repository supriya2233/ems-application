import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'

import { navigationGroups } from '../../config/navigation'

/*
 * Desktop: 64px icon rail that expands on hover / keyboard focus.
 * Tablet & mobile: slide-in drawer opened from the header.
 *
 * Elements with "sidebar-reveal" fade in when the rail expands.
 * They stay in the DOM, so screen readers always read the labels.
 */
function Sidebar({ isOpen, closeSidebar }) {
  return (
    <aside
      id="app-sidebar"
      className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
    >
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">
          E
        </span>

        <span className="brand-text sidebar-reveal">
          <strong>EMS</strong>
          <small>People workspace</small>
        </span>

        <button
          type="button"
          className="sidebar-close"
          onClick={closeSidebar}
          aria-label="Close navigation"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Navigation */}
      <nav
        className="sidebar-navigation"
        aria-label="Main navigation"
      >
        {navigationGroups.map((group) => (
          <div
            className="navigation-group"
            key={group.title}
          >
            <p className="navigation-label">
              <span className="sidebar-reveal">
                {group.title}
              </span>
            </p>

            {group.items.map((item) => {
              const Icon = item.icon

              return (
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
                  <Icon
                    className="nav-icon"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />

                  <span className="nav-label sidebar-reveal">
                    {item.label}
                  </span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
