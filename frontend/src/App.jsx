import { lazy } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import Layout from './components/layout/Layout'
import FeedbackProvider from './components/common/FeedbackProvider'
import LiveEventsProvider from './components/live/LiveEventsProvider'

/*
 * Pages are loaded on demand ("code splitting"): each one becomes
 * its own small file that the browser downloads the first time the
 * page is opened, instead of one big file up front. <Suspense> in
 * Layout.jsx shows "Loading page…" during that first download.
 */
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Approvals = lazy(() => import('./pages/Approvals'))
const Employees = lazy(() => import('./pages/Employees'))
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'))
const Departments = lazy(() => import('./pages/Departments'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Attendance = lazy(() => import('./pages/Attendance'))
const LeaveManagement = lazy(() => import('./pages/LeaveManagement'))
const Payroll = lazy(() => import('./pages/Payroll'))
const Recruitment = lazy(() => import('./pages/Recruitment'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Offboarding = lazy(() => import('./pages/Offboarding'))
const Performance = lazy(() => import('./pages/Performance'))
const Documents = lazy(() => import('./pages/Documents'))
const Assets = lazy(() => import('./pages/Assets'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Announcements = lazy(() => import('./pages/Announcements'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Activity = lazy(() => import('./pages/Activity'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const Help = lazy(() => import('./pages/Help'))

// path → page. Paths must match config/navigation.js.
const routes = [
  ['/dashboard', Dashboard],
  ['/approvals', Approvals],
  ['/employees', Employees],
  ['/employees/:employeeId', EmployeeProfile],
  ['/departments', Departments],
  ['/tasks', Tasks],
  ['/analytics', Analytics],
  ['/attendance', Attendance],
  ['/leave', LeaveManagement],
  ['/payroll', Payroll],
  ['/recruitment', Recruitment],
  ['/onboarding', Onboarding],
  ['/offboarding', Offboarding],
  ['/performance', Performance],
  ['/documents', Documents],
  ['/assets', Assets],
  ['/calendar', Calendar],
  ['/announcements', Announcements],
  ['/notifications', Notifications],
  ['/activity', Activity],
  ['/reports', Reports],
  ['/settings', Settings],
  ['/help', Help],
]

function App() {
  return (
    <FeedbackProvider>
      <LiveEventsProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {routes.map(([path, Page]) => (
                <Route key={path} path={path} element={<Page />} />
              ))}
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </LiveEventsProvider>
    </FeedbackProvider>
  )
}

export default App
