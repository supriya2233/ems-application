# Employee Management System (EMS)

A full-stack Employee Management System designed to manage employees, departments, tasks, attendance, and organizational information through a responsive web application. The project is being developed using **React and Vite for the frontend**, **Node.js and Express.js for the backend**, and **MongoDB for data storage**.

> 🚧 **Project Status: Ongoing**
> The frontend foundation and major management module interfaces have been implemented. Backend API development and database integration are currently in progress.

## 📌 Project Overview

The application provides a centralized interface for managing: Employees, Departments, Tasks, Attendance, Leave management, Employee status, Organizational information, Workforce modules and Dashboard statistics and analytics

## 🚀 Current Progress

### Frontend

* [x] React + Vite project setup
* [x] Responsive application layout
* [x] Sidebar navigation
* [x] Header and user information section
* [x] React Router navigation
* [x] Dashboard UI
* [x] Employee management UI
* [x] Employee statistics and filtering
* [x] Employee search
* [x] Department management UI
* [x] Task management UI
* [x] Attendance management UI
* [x] Leave management UI
* [x] Payroll management UI
* [x] Recruitment management UI
* [x] Onboarding management UI
* [x] Performance management UI
* [x] Documents management UI
* [x] Workforce module dashboards
* [x] Analytics and reports interfaces
* [x] Announcements interface
* [x] Responsive design foundation
* [x] Reusable module dashboard components
* [x] Static data for frontend modules
* [x] Production build configuration
* [x] Backend API integration for Employees
* [x] Backend API integration for Departments
* [x] Backend API integration for Tasks
* [x] Backend API integration for Attendance
* [x] Backend API integration for Leave Management
* [x] Backend API integration for Payroll
* [x] Backend API integration for Recruitment
* [x] Backend API integration for Onboarding
* [x] Backend API integration for Performance
* [x] Backend API integration for Documents

### Backend

* [x] Node.js project setup
* [x] Express.js server setup
* [x] Backend development server
* [x] MongoDB connection
* [x] REST API development
* [x] Employee API
* [x] Department API
* [x] Task API
* [x] Attendance API
* [x] Leave management API
* [x] Payroll API
* [x] Recruitment API
* [x] Onboarding API
* [x] Performance API
* [x] Documents API
* [x] Dashboard API
* [x] MongoDB models
* [x] CRUD operations
* [ ] Error handling
* [ ] API validation

### Database

* [x] MongoDB installed and configured
* [x] MongoDB service running
* [x] MongoDB connection established with backend
* [x] Employee collection/model
* [x] Department collection/model
* [x] Task collection/model
* [x] Attendance collection/model
* [x] Leave collection/model
* [x] Payroll collection/model
* [x] Recruitment collection/model
* [x] Onboarding collection/model
* [x] Performance collection/model
* [x] Documents collection/model
* [x] Database integration with application APIs

## 🛠️ Technology Stack

### Frontend

* React
* Vite
* React Router
* Recharts
* Lucide React
* CSS

### Backend

* Node.js
* Express.js
* Nodemon

### Database

* MongoDB
* Mongoose

### Development Tools

* Visual Studio Code
* Git
* GitHub
* PowerShell

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
│   │   │   ├── Recruitment.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── Performance.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── Tasks.jsx
│   │   │   └── ...
│   │   │
│   │   ├── services/
│   │   │   ├── employeeService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── leaveService.js
│   │   │   ├── payrollService.js
│   │   │   ├── recruitmentService.js
│   │   │   ├── onboardingService.js
│   │   │   ├── performanceService.js
│   │   │   └── documentService.js
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
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── attendanceController.js
│   │   │   ├── departmentController.js
│   │   │   ├── documentController.js
│   │   │   ├── employeeController.js
│   │   │   ├── leaveController.js
│   │   │   ├── onboardingController.js
│   │   │   ├── payrollController.js
│   │   │   ├── performanceController.js
│   │   │   ├── recruitmentController.js
│   │   │   └── taskController.js
│   │   │
│   │   ├── models/
│   │   │   ├── Attendance.js
│   │   │   ├── Department.js
│   │   │   ├── Document.js
│   │   │   ├── Employee.js
│   │   │   ├── Leave.js
│   │   │   ├── Onboarding.js
│   │   │   ├── Payroll.js
│   │   │   ├── Performance.js
│   │   │   ├── Recruitment.js
│   │   │   └── Task.js
│   │   │
│   │   ├── routes/
│   │   │   ├── attendanceRoutes.js
│   │   │   ├── departmentRoutes.js
│   │   │   ├── documentRoutes.js
│   │   │   ├── employeeRoutes.js
│   │   │   ├── leaveRoutes.js
│   │   │   ├── onboardingRoutes.js
│   │   │   ├── payrollRoutes.js
│   │   │   ├── performanceRoutes.js
│   │   │   ├── recruitmentRoutes.js
│   │   │   └── taskRoutes.js
│   │   │
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
```
