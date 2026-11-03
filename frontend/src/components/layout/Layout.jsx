import { Suspense, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import Header from './Header'

const RAIL_KEY = 'ems.sidebar'

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Wide screens show the sidebar with labels; it can be folded to
  // an icon rail. The choice is remembered in this browser.
  const [isRail, setIsRail] = useState(() => localStorage.getItem(RAIL_KEY) === 'rail')

  const toggleRail = () => {
    setIsRail((current) => {
      localStorage.setItem(RAIL_KEY, current ? 'open' : 'rail')
      return !current
    })
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  // Let keyboard users close the mobile drawer with Escape.
  // The listener only exists while the drawer is open.
  useEffect(() => {
    if (!isSidebarOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSidebarOpen])

  return (
    <div className={`app ${isRail ? 'app-rail' : ''}`}>

      <Sidebar
        isOpen={isSidebarOpen}
        closeSidebar={closeSidebar}
        isRail={isRail}
        toggleRail={toggleRail}
      />

      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="main-wrapper">

        <Header
          openSidebar={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="page-content">
          {/* Each page's code is downloaded the first time it is
              opened (see App.jsx); this shows while it arrives. */}
          <Suspense
            fallback={
              <p className="ui-loading page-loading" role="status">
                Loading page…
              </p>
            }
          >
            <Outlet />
          </Suspense>
        </main>

      </div>

    </div>
  )
}

export default Layout
