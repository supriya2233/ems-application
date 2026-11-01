import { Suspense, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import Header from './Header'

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
    <div className="app">

      <Sidebar
        isOpen={isSidebarOpen}
        closeSidebar={closeSidebar}
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
