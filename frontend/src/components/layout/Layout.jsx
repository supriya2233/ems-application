import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import Header from './Header'

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

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
        />
      )}

      <div className="main-wrapper">

        <Header
          openSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="page-content">
          <Outlet />
        </main>

      </div>

    </div>
  )
}

export default Layout