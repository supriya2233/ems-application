import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  FileChartColumn,
  FileText,
  Handshake,
  IndianRupee,
  Laptop,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Megaphone,
  Plane,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react'

/*
 * Single source of truth for the app navigation.
 *
 * - Sidebar renders these groups as the rail / mobile drawer.
 * - Header uses getNavigationMatch() to build the breadcrumb.
 *
 * Paths must match the routes in App.jsx.
 */
export const navigationGroups = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Employees', path: '/employees', icon: Users },
      { label: 'Departments', path: '/departments', icon: Building2 },
      { label: 'Tasks', path: '/tasks', icon: ListChecks },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Analytics', path: '/analytics', icon: ChartColumn },
      { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Leave Management', path: '/leave', icon: Plane },
      { label: 'Payroll', path: '/payroll', icon: IndianRupee },
      { label: 'Recruitment', path: '/recruitment', icon: BriefcaseBusiness },
      { label: 'Onboarding', path: '/onboarding', icon: Handshake },
      { label: 'Performance', path: '/performance', icon: TrendingUp },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Documents', path: '/documents', icon: FileText },
      { label: 'Assets', path: '/assets', icon: Laptop },
      { label: 'Calendar', path: '/calendar', icon: CalendarDays },
      { label: 'Announcements', path: '/announcements', icon: Megaphone },
      { label: 'Notifications', path: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Reports', path: '/reports', icon: FileChartColumn },
      { label: 'Settings', path: '/settings', icon: Settings },
      { label: 'Help & Support', path: '/help', icon: LifeBuoy },
    ],
  },
]

/*
 * Finds the nav group and item for a URL path.
 * Nested routes (e.g. /employees/123) match their parent item.
 * Returns null when nothing matches.
 */
export function getNavigationMatch(pathname) {
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (
        pathname === item.path ||
        pathname.startsWith(`${item.path}/`)
      ) {
        return { group, item }
      }
    }
  }

  return null
}
