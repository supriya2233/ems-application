export const performanceData = {
  eyebrow: 'PEOPLE',
  title: 'Performance',
  description:
    'Track employee performance, reviews, goals and development progress.',
  actionLabel: 'Start Review',

  summary: [
    {
      title: 'Reviews Completed',
      value: '184',
      description: '74% of total employees',
      icon: '✓',
    },
    {
      title: 'Average Rating',
      value: '4.2',
      description: 'Out of 5.0',
      icon: '★',
    },
    {
      title: 'Goals Completed',
      value: '78%',
      description: 'Across all departments',
      icon: '◎',
    },
    {
      title: 'Pending Reviews',
      value: '64',
      description: 'Require manager action',
      icon: '!',
    },
  ],

  sections: [
    {
      title: 'Recent Performance Reviews',
      description: 'Latest employee performance evaluations.',
      type: 'table',
      columns: [
        'Employee',
        'Department',
        'Rating',
        'Review Date',
        'Status',
      ],
      items: [
        {
          employee: 'Arjun Kumar',
          department: 'Engineering',
          rating: '4.7 / 5',
          reviewdate: '08 Aug 2026',
          status: 'Completed',
        },
        {
          employee: 'Priya Sharma',
          department: 'Design',
          rating: '4.4 / 5',
          reviewdate: '07 Aug 2026',
          status: 'Completed',
        },
        {
          employee: 'Sneha Reddy',
          department: 'HR',
          rating: '4.1 / 5',
          reviewdate: '06 Aug 2026',
          status: 'Pending',
        },
        {
          employee: 'Rahul Verma',
          department: 'Management',
          rating: '4.6 / 5',
          reviewdate: '05 Aug 2026',
          status: 'Completed',
        },
      ],
    },
    {
      title: 'Development Goals',
      description: 'Current employee development priorities.',
      items: [
        {
          title: 'Technical Leadership',
          subtitle: 'Engineering',
          description:
            'Improve mentoring and technical decision-making skills.',
          meta: '18 employees',
          icon: '↗',
        },
        {
          title: 'Communication',
          subtitle: 'All Departments',
          description:
            'Improve presentation, collaboration and communication skills.',
          meta: '31 employees',
          icon: '◉',
        },
        {
          title: 'Management Skills',
          subtitle: 'Leadership',
          description:
            'Develop people management and strategic planning capabilities.',
          meta: '12 employees',
          icon: '★',
        },
      ],
    },
  ],
}


export const recruitmentData = {
  eyebrow: 'TALENT',
  title: 'Recruitment',
  description:
    'Manage job openings, candidates, interviews and hiring progress.',
  actionLabel: 'Create Job',

  summary: [
    {
      title: 'Open Positions',
      value: '18',
      description: 'Across 7 departments',
      icon: '+',
    },
    {
      title: 'Applicants',
      value: '426',
      description: 'This recruitment cycle',
      icon: '♙',
    },
    {
      title: 'Interviews',
      value: '38',
      description: 'Scheduled this week',
      icon: '◷',
    },
    {
      title: 'Offers',
      value: '12',
      description: 'Awaiting response',
      icon: '✓',
    },
  ],

  sections: [
    {
      title: 'Open Positions',
      description: 'Currently active job openings.',
      type: 'table',
      columns: [
        'Position',
        'Department',
        'Applicants',
        'Posted',
        'Status',
      ],
      items: [
        {
          position: 'Frontend Developer',
          department: 'Engineering',
          applicants: '84',
          posted: '02 Aug 2026',
          status: 'Open',
        },
        {
          position: 'UI/UX Designer',
          department: 'Design',
          applicants: '52',
          posted: '01 Aug 2026',
          status: 'Open',
        },
        {
          position: 'HR Executive',
          department: 'Human Resources',
          applicants: '41',
          posted: '29 Jul 2026',
          status: 'Interview',
        },
        {
          position: 'Data Analyst',
          department: 'Finance',
          applicants: '67',
          posted: '25 Jul 2026',
          status: 'Open',
        },
      ],
    },
    {
      title: 'Hiring Pipeline',
      items: [
        {
          title: 'Application Review',
          description: '126 candidates currently being screened.',
          meta: '126 candidates',
          icon: '01',
        },
        {
          title: 'Technical Interview',
          description: '38 candidates scheduled for interviews.',
          meta: '38 candidates',
          icon: '02',
        },
        {
          title: 'Final Interview',
          description: '16 candidates awaiting final evaluation.',
          meta: '16 candidates',
          icon: '03',
        },
      ],
    },
  ],
}


export const onboardingData = {
  eyebrow: 'PEOPLE',
  title: 'Onboarding',
  description:
    'Track new employee onboarding, documentation and joining activities.',
  actionLabel: 'Add Employee',

  summary: [
    {
      title: 'New Joiners',
      value: '24',
      description: 'This month',
      icon: '+',
    },
    {
      title: 'In Progress',
      value: '11',
      description: 'Currently onboarding',
      icon: '◷',
    },
    {
      title: 'Completed',
      value: '13',
      description: 'This month',
      icon: '✓',
    },
    {
      title: 'Pending Documents',
      value: '7',
      description: 'Need attention',
      icon: '▧',
    },
  ],

  sections: [
    {
      title: 'New Employees',
      description: 'Employees currently going through onboarding.',
      type: 'table',
      columns: [
        'Employee',
        'Department',
        'Joining Date',
        'Progress',
        'Status',
      ],
      items: [
        {
          employee: 'Meera Nair',
          department: 'Engineering',
          joiningdate: '05 Aug 2026',
          progress: '92%',
          status: 'In Progress',
        },
        {
          employee: 'Karan Mehta',
          department: 'Marketing',
          joiningdate: '08 Aug 2026',
          progress: '74%',
          status: 'In Progress',
        },
        {
          employee: 'Ananya Rao',
          department: 'Finance',
          joiningdate: '01 Aug 2026',
          progress: '100%',
          status: 'Completed',
        },
        {
          employee: 'Vikram Singh',
          department: 'Operations',
          joiningdate: '11 Aug 2026',
          progress: '46%',
          status: 'Pending',
        },
      ],
    },
    {
      title: 'Onboarding Checklist',
      items: [
        {
          title: 'Personal Information',
          description: 'Basic employee information and contact details.',
          meta: 'Completed',
          icon: '✓',
        },
        {
          title: 'Identity Documents',
          description: 'Government identification and verification.',
          meta: 'Pending',
          icon: '▧',
        },
        {
          title: 'Bank Information',
          description: 'Salary account and payment information.',
          meta: 'Pending',
          icon: '₹',
        },
        {
          title: 'IT Equipment',
          description: 'Laptop, email and required software access.',
          meta: 'In Progress',
          icon: '▣',
        },
      ],
    },
  ],
}


export const assetsData = {
  eyebrow: 'OPERATIONS',
  title: 'Assets',
  description:
    'Track company equipment, assigned assets and asset availability.',
  actionLabel: 'Add Asset',

  summary: [
    {
      title: 'Total Assets',
      value: '684',
      description: 'All registered assets',
      icon: '▣',
    },
    {
      title: 'Assigned',
      value: '521',
      description: 'Currently assigned',
      icon: '♙',
    },
    {
      title: 'Available',
      value: '118',
      description: 'Ready for assignment',
      icon: '✓',
    },
    {
      title: 'Maintenance',
      value: '45',
      description: 'Require attention',
      icon: '!',
    },
  ],

  sections: [
    {
      title: 'Asset Inventory',
      description: 'Recently registered company assets.',
      type: 'table',
      columns: [
        'Asset',
        'Category',
        'Assigned To',
        'Purchase Date',
        'Status',
      ],
      items: [
        {
          asset: 'MacBook Pro 14"',
          category: 'Laptop',
          assignedto: 'Arjun Kumar',
          purchasedate: '12 Jan 2026',
          status: 'Assigned',
        },
        {
          asset: 'Dell Latitude 5440',
          category: 'Laptop',
          assignedto: 'Priya Sharma',
          purchasedate: '18 Feb 2026',
          status: 'Assigned',
        },
        {
          asset: 'iPhone 15',
          category: 'Mobile',
          assignedto: 'Sneha Reddy',
          purchasedate: '05 Mar 2026',
          status: 'Assigned',
        },
        {
          asset: 'HP LaserJet',
          category: 'Printer',
          assignedto: 'Office',
          purchasedate: '22 Nov 2025',
          status: 'Available',
        },
      ],
    },
  ],
}


export const documentsData = {
  eyebrow: 'RECORDS',
  title: 'Documents',
  description:
    'Manage employee documents, company records and document verification.',
  actionLabel: 'Upload Document',

  summary: [
    {
      title: 'Total Documents',
      value: '1,248',
      description: 'Stored in the system',
      icon: '▧',
    },
    {
      title: 'Verified',
      value: '1,102',
      description: 'Successfully verified',
      icon: '✓',
    },
    {
      title: 'Pending',
      value: '96',
      description: 'Awaiting verification',
      icon: '◷',
    },
    {
      title: 'Expired',
      value: '50',
      description: 'Require renewal',
      icon: '!',
    },
  ],

  sections: [
    {
      title: 'Recent Documents',
      description: 'Recently uploaded employee documents.',
      type: 'table',
      columns: [
        'Document',
        'Employee',
        'Type',
        'Uploaded',
        'Status',
      ],
      items: [
        {
          document: 'Aadhaar Verification',
          employee: 'Arjun Kumar',
          type: 'Identity',
          uploaded: '10 Aug 2026',
          status: 'Verified',
        },
        {
          document: 'Employment Contract',
          employee: 'Priya Sharma',
          type: 'Contract',
          uploaded: '09 Aug 2026',
          status: 'Verified',
        },
        {
          document: 'PAN Card',
          employee: 'Sneha Reddy',
          type: 'Identity',
          uploaded: '08 Aug 2026',
          status: 'Pending',
        },
        {
          document: 'Address Proof',
          employee: 'Rahul Verma',
          type: 'Verification',
          uploaded: '06 Aug 2026',
          status: 'Expired',
        },
      ],
    },
  ],
}


export const reportsData = {
  eyebrow: 'INSIGHTS',
  title: 'Reports',
  description:
    'Generate and review workforce, attendance, payroll and operational reports.',
  actionLabel: 'Generate Report',

  summary: [
    {
      title: 'Reports Generated',
      value: '86',
      description: 'This month',
      icon: '▤',
    },
    {
      title: 'Scheduled Reports',
      value: '12',
      description: 'Automatically generated',
      icon: '◷',
    },
    {
      title: 'Shared Reports',
      value: '31',
      description: 'With managers',
      icon: '↗',
    },
    {
      title: 'Saved Reports',
      value: '43',
      description: 'Available for reuse',
      icon: '▣',
    },
  ],

  sections: [
    {
      title: 'Available Reports',
      description: 'Common reports available to administrators.',
      type: 'table',
      columns: [
        'Report',
        'Category',
        'Last Generated',
        'Format',
        'Status',
      ],
      items: [
        {
          report: 'Monthly Attendance Report',
          category: 'Attendance',
          lastgenerated: '10 Aug 2026',
          format: 'PDF',
          status: 'Ready',
        },
        {
          report: 'Employee Directory',
          category: 'Employees',
          lastgenerated: '09 Aug 2026',
          format: 'Excel',
          status: 'Ready',
        },
        {
          report: 'Payroll Summary',
          category: 'Payroll',
          lastgenerated: '08 Aug 2026',
          format: 'PDF',
          status: 'Ready',
        },
        {
          report: 'Leave Utilization',
          category: 'Leave',
          lastgenerated: '07 Aug 2026',
          format: 'Excel',
          status: 'Ready',
        },
      ],
    },
  ],
}


export const calendarData = {
  eyebrow: 'SCHEDULE',
  title: 'Calendar',
  description:
    'View company events, meetings, holidays and important employee dates.',
  actionLabel: 'Add Event',

  summary: [
    {
      title: 'Upcoming Events',
      value: '14',
      description: 'Next 30 days',
      icon: '◷',
    },
    {
      title: 'Meetings',
      value: '27',
      description: 'Scheduled this month',
      icon: '□',
    },
    {
      title: 'Holidays',
      value: '3',
      description: 'Upcoming holidays',
      icon: '★',
    },
    {
      title: 'Birthdays',
      value: '9',
      description: 'This month',
      icon: '♙',
    },
  ],

  sections: [
    {
      title: 'Upcoming Events',
      description: 'Important events on the company calendar.',
      type: 'table',
      columns: [
        'Event',
        'Date',
        'Time',
        'Location',
        'Status',
      ],
      items: [
        {
          event: 'Monthly Town Hall',
          date: '28 Aug 2026',
          time: '4:00 PM',
          location: 'Main Auditorium',
          status: 'Scheduled',
        },
        {
          event: 'Leadership Meeting',
          date: '21 Aug 2026',
          time: '11:00 AM',
          location: 'Conference Room A',
          status: 'Scheduled',
        },
        {
          event: 'Independence Day',
          date: '15 Aug 2026',
          time: 'All Day',
          location: 'Company Holiday',
          status: 'Holiday',
        },
        {
          event: 'Employee Wellness Day',
          date: '12 Aug 2026',
          time: '2:00 PM',
          location: 'Activity Center',
          status: 'Scheduled',
        },
      ],
    },
  ],
}


export const notificationsData = {
  eyebrow: 'SYSTEM',
  title: 'Notifications',
  description:
    'Stay updated with employee activity, approvals, reminders and system alerts.',

  summary: [
    {
      title: 'Unread',
      value: '7',
      description: 'Require your attention',
      icon: '!',
    },
    {
      title: 'Today',
      value: '12',
      description: 'Notifications received',
      icon: '◷',
    },
    {
      title: 'This Week',
      value: '46',
      description: 'Total notifications',
      icon: '▤',
    },
    {
      title: 'Important',
      value: '3',
      description: 'Priority alerts',
      icon: '★',
    },
  ],

  sections: [
    {
      title: 'Recent Notifications',
      description: 'Latest system and employee activity.',
      items: [
        {
          title: 'Leave request awaiting approval',
          subtitle: 'Sneha Reddy requested 3 days of medical leave.',
          description:
            'Review the request from the Leave Management module.',
          meta: '10 minutes ago',
          status: 'Unread',
          icon: '!',
        },
        {
          title: 'Payroll processing completed',
          subtitle: 'August payroll has been prepared for review.',
          description:
            'The payroll summary is available in the Payroll module.',
          meta: '1 hour ago',
          status: 'Read',
          icon: '₹',
        },
        {
          title: 'New employee onboarding',
          subtitle: 'Vikram Singh has joined Operations.',
          description:
            'Complete the remaining onboarding checklist items.',
          meta: '3 hours ago',
          status: 'Unread',
          icon: '+',
        },
        {
          title: 'Performance review reminder',
          subtitle: '64 employee reviews are still pending.',
          description:
            'Managers should complete their pending evaluations.',
          meta: 'Yesterday',
          status: 'Unread',
          icon: '★',
        },
        {
          title: 'Document verification completed',
          subtitle: '12 employee documents were verified.',
          description:
            'No action is required.',
          meta: 'Yesterday',
          status: 'Read',
          icon: '✓',
        },
      ],
    },
  ],
}


export const settingsData = {
  eyebrow: 'SYSTEM',
  title: 'Settings',
  description:
    'Configure company preferences, notifications, appearance and system options.',

  summary: [
    {
      title: 'Company Profile',
      value: 'Complete',
      description: 'Organization information',
      icon: '◉',
    },
    {
      title: 'Notifications',
      value: 'Enabled',
      description: 'System notifications',
      icon: '!',
    },
    {
      title: 'Language',
      value: 'English',
      description: 'Application language',
      icon: 'A',
    },
    {
      title: 'Timezone',
      value: 'IST',
      description: 'India Standard Time',
      icon: '◷',
    },
  ],

  sections: [
    {
      title: 'Company Preferences',
      description: 'General organization configuration.',
      items: [
        {
          title: 'Company Information',
          subtitle: 'Organization profile',
          description:
            'Manage company name, contact details, address and branding.',
          meta: 'Configured',
          icon: '◉',
        },
        {
          title: 'Working Hours',
          subtitle: 'Monday – Friday',
          description:
            'Configure office working hours and weekly holidays.',
          meta: '9:00 AM – 6:00 PM',
          icon: '◷',
        },
        {
          title: 'Leave Policies',
          subtitle: 'Leave configuration',
          description:
            'Configure leave types, entitlement and approval workflows.',
          meta: '4 policies',
          icon: '▤',
        },
      ],
    },
    {
      title: 'System Preferences',
      description: 'Application behavior and notification settings.',
      items: [
        {
          title: 'Email Notifications',
          subtitle: 'System alerts',
          description:
            'Receive important employee and system updates by email.',
          meta: 'Enabled',
          status: 'Enabled',
          icon: '✉',
        },
        {
          title: 'Dark Mode',
          subtitle: 'Appearance',
          description:
            'Change the appearance of the employee management portal.',
          meta: 'Disabled',
          status: 'Disabled',
          icon: '◐',
        },
        {
          title: 'Automatic Reports',
          subtitle: 'Scheduled reporting',
          description:
            'Automatically generate recurring workforce reports.',
          meta: 'Enabled',
          status: 'Enabled',
          icon: '▤',
        },
      ],
    },
  ],
}


export const helpData = {
  eyebrow: 'SUPPORT',
  title: 'Help & Support',
  description:
    'Find answers, learn how to use the EMS portal and get assistance.',

  summary: [
    {
      title: 'Help Articles',
      value: '42',
      description: 'Available guides',
      icon: '?',
    },
    {
      title: 'FAQs',
      value: '28',
      description: 'Common questions',
      icon: 'Q',
    },
    {
      title: 'Open Tickets',
      value: '3',
      description: 'Awaiting support',
      icon: '!',
    },
    {
      title: 'System Status',
      value: 'Online',
      description: 'All systems operational',
      icon: '✓',
    },
  ],

  sections: [
    {
      title: 'Popular Help Topics',
      description: 'Frequently accessed support resources.',
      items: [
        {
          title: 'Managing Employees',
          description:
            'Learn how to add, edit and manage employee records.',
          meta: '12 articles',
          icon: '♙',
        },
        {
          title: 'Attendance & Leave',
          description:
            'Learn how to manage attendance and leave requests.',
          meta: '8 articles',
          icon: '◷',
        },
        {
          title: 'Payroll',
          description:
            'Learn how payroll processing and payslips work.',
          meta: '7 articles',
          icon: '₹',
        },
        {
          title: 'Reports & Analytics',
          description:
            'Learn how to generate reports and understand analytics.',
          meta: '9 articles',
          icon: '▤',
        },
      ],
    },
    {
      title: 'Support Contact',
      description: 'Need additional assistance?',
      items: [
        {
          title: 'HR Support Team',
          description:
            'Contact the HR administration team for employee-related questions.',
          meta: 'hr-support@example.com',
          icon: '✉',
        },
        {
          title: 'Technical Support',
          description:
            'Contact the technical team for portal or system issues.',
          meta: 'support@example.com',
          icon: '⚙',
        },
      ],
    },
  ],
}