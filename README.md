# Employee Management System (EMS)

A full-stack Employee Management System designed to manage employees, departments, tasks, attendance, and organizational information through a responsive web application. The project is being developed using **React and Vite for the frontend**, **Node.js and Express.js for the backend**, and **MongoDB for data storage**.

> 🚧 **Project Status: Ongoing**
> The frontend foundation and major management module interfaces have been implemented. Backend API development and database integration are currently in progress.

## 📌 Project Overview

The application provides a centralized interface for managing: Employees, Departments, Tasks, Attendance, Leave management, Employee status, Organizational information, Workforce modules and Dashboard statistics and analytics

## 🚀 Current Progress

### Frontend

- [x] React + Vite project setup
- [x] Responsive application layout
- [x] Sidebar navigation
- [x] Header and user information section
- [x] React Router navigation
- [x] Dashboard UI
- [x] Employee management UI
- [x] Employee statistics and filtering
- [x] Employee search
- [x] Department management UI
- [x] Task management UI
- [x] Attendance management UI
- [x] Leave management UI
- [x] Workforce module dashboards
- [x] Analytics and reports interfaces
- [x] Announcements interface
- [x] Responsive design foundation
- [x] Reusable module dashboard components
- [x] Static data for frontend modules
- [x] Production build configuration
- [ ] Backend API integration

### Backend

- [x] Node.js project setup
- [x] Express.js server setup
- [x] Backend development server
- [x] MongoDB connection
- [ ] REST API development
- [ ] Employee API
- [ ] Department API
- [ ] Task API
- [ ] Attendance API
- [ ] Leave management API
- [ ] Dashboard API
- [ ] Error handling
- [ ] API validation

### Database

- [x] MongoDB installed and configured
- [x] MongoDB service running
- [x] MongoDB connection established with backend
- [ ] Employee collection/model
- [ ] Department collection/model
- [ ] Task collection/model
- [ ] Attendance collection/model
- [ ] Leave collection/model
- [ ] Database integration with application APIs

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- React Router
- Recharts
- Lucide React
- CSS

### Backend

- Node.js
- Express.js
- Nodemon

### Database

- MongoDB
- Mongoose

### Development Tools

- Visual Studio Code
- Git
- GitHub
- PowerShell

## 📂 Current Project Structure

```text
ems-application/
│
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── ModuleDashboard.jsx
│   │   │   │   └── PagePlaceholder.jsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── DepartmentOverview.jsx
│   │   │   │   ├── RecentEmployees.jsx
│   │   │   │   ├── StatCard.jsx
│   │   │   │   └── TaskOverview.jsx
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── Header.jsx
│   │   │       ├── Layout.jsx
│   │   │       └── Sidebar.jsx
│   │   │
│   │   ├── data/
│   │   │   ├── analytics.js
│   │   │   ├── announcements.js
│   │   │   ├── attendance.js
│   │   │   ├── dashboardData.js
│   │   │   ├── departments.js
│   │   │   ├── employees.js
│   │   │   ├── leaves.js
│   │   │   ├── payroll.js
│   │   │   ├── remainingModules.js
│   │   │   └── tasks.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Analytics.jsx
│   │   │   ├── Announcements.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Departments.jsx
│   │   │   ├── EmployeeProfile.jsx
│   │   │   ├── Employees.jsx
│   │   │   ├── LeaveManagement.jsx
│   │   │   ├── Payroll.jsx
│   │   │   ├── Tasks.jsx
│   │   │   └── ...
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
