# Employee Management System (EMS)

A full-stack Employee Management System designed to manage employees, departments, tasks, and organizational information through a responsive web application. The Employee Management System (EMS) is being developed as a full-stack web application to simplify employee and organizational management.

> 🚧 **Project Status: Ongoing**
> The frontend foundation and dashboard UI have been implemented. Backend development, database integration, and additional management features are currently in progress.

## 📌 Project Overview
The application will provide a centralized interface for managing:
- Employees
- Departments
- Tasks
- Employee status
- Organizational statistics
- Dashboard analytics

The project is being developed using **React for the frontend**, **Node.js and Express.js for the backend**, and **MongoDB for data storage**.

## 🚀 Current Progress

### Frontend

- [x] React + Vite project setup
- [x] Responsive application layout
- [x] Sidebar navigation
- [x] Header and user information section
- [x] React Router navigation
- [x] Dashboard UI
- [x] Employee statistics cards
- [x] Recent employees section
- [x] Department overview
- [x] Task overview
- [x] Responsive design foundation
- [ ] Employee management
- [ ] Department management
- [ ] Task management
- [ ] Backend API integration

### Backend

- [ ] Node.js setup
- [ ] Express.js server
- [ ] REST API development
- [ ] Employee API
- [ ] Department API
- [ ] Task API
- [ ] Dashboard API
- [ ] Error handling
- [ ] API validation

### Database

- [ ] MongoDB setup
- [ ] Employee collection/model
- [ ] Department collection/model
- [ ] Task collection/model
- [ ] Database integration with Express

## Current Project Structure

```text
ems-application/
│
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
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
│   │   │   └── dashboardData.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Departments.jsx
│   │   │   ├── Employees.jsx
│   │   │   └── Tasks.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
