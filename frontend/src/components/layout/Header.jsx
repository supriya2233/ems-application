function Header({ openSidebar }) {

  return (
    <header className="header">

      <div className="header-left">

        <button
          className="mobile-menu-button"
          onClick={openSidebar}
          aria-label="Open navigation"
        >
          ☰
        </button>

        <div>

          <p className="header-eyebrow">
            Employee Management System
          </p>

          <h1 className="header-title">
            Dashboard
          </h1>

        </div>

      </div>


      <div className="header-right">

        <div className="header-avatar">
          A
        </div>

        <div className="header-user-info">

          <p className="header-user-name">
            Administrator
          </p>

          <p className="header-user-role">
            SYSTEM MANAGER
          </p>

        </div>

      </div>

    </header>
  )
}

export default Header