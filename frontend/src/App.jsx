import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import Payroll from './pages/Payroll'
import Layout from './components/layout/Layout'

import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import EmployeeProfile from './pages/EmployeeProfile'
import Departments from './pages/Departments'
import Attendance from './pages/Attendance'
import LeaveManagement from './pages/LeaveManagement'
import Tasks from './pages/Tasks'
import Performance from './pages/Performance'
import Recruitment from './pages/Recruitment'
import Onboarding from './pages/Onboarding'
import Assets from './pages/Assets'
import Documents from './pages/Documents'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Announcements from './pages/Announcements'
import Calendar from './pages/Calendar'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Help from './pages/Help'

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route element={<Layout />}>

          <Route
  path="/payroll"
  element={<Payroll />}
/>

          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/employees"
            element={<Employees />}
          />

          <Route
            path="/employees/:employeeId"
            element={<EmployeeProfile />}
          />

          <Route
            path="/departments"
            element={<Departments />}
          />

          <Route
            path="/attendance"
            element={<Attendance />}
          />

          <Route
            path="/leave"
            element={<LeaveManagement />}
          />

          <Route
            path="/tasks"
            element={<Tasks />}
          />

          <Route
            path="/performance"
            element={<Performance />}
          />

          <Route
            path="/recruitment"
            element={<Recruitment />}
          />

          <Route
            path="/onboarding"
            element={<Onboarding />}
          />

          <Route
            path="/assets"
            element={<Assets />}
          />

          <Route
            path="/documents"
            element={<Documents />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/announcements"
            element={<Announcements />}
          />

          <Route
            path="/calendar"
            element={<Calendar />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

          <Route
            path="/help"
            element={<Help />}
          />

        </Route>

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App