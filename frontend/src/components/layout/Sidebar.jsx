import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'

import { navigationGroups } from '../../config/navigation'

/*
 * Wide screens (≥ 1280px): open with labels; the footer button
 *   folds it into a 72px icon rail (which expands on hover).
 * Laptops (1024–1279px): icon rail that expands on hover / focus.
 * Tablet & mobile: slide-in drawer opened from the header.
 *
 * Elements with "sidebar-reveal" fade in when the rail expands.
 * They stay in the DOM, so screen readers always read the labels.
 */
function Sidebar({ isOpen, closeSidebar, isRail, toggleRail }) {
  const ToggleIcon = isRail ? PanelLeftOpen : PanelLeftClose

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

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleRail}
          aria-pressed={isRail}
          title={isRail ? 'Show labels' : 'Collapse to icons'}
        >
          <ToggleIcon size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="nav-label sidebar-reveal">{isRail ? 'Show labels' : 'Collapse sidebar'}</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
