# Multi-Tenant Task Management System

A **multi-tenant task management system** designed for software houses to manage projects, assign and track tasks, and collaborate with teams.  
Built with **Next.js (App Router + React Server Components)** for the frontend and **Convex** for backend, database, authentication, and real-time sync.

---

## 🚀 Features

### 🔑 Multi-Tenancy

- Each software house = one tenant workspace.
- Data fully isolated per tenant.
- Custom tenant branding (name, logo, theme).

### 👥 Authentication & Roles

- Secure authentication with Convex Auth (email/password, OAuth optional).
- Role-based permissions:
  - **Admin** – manage tenant, users, roles, and all projects.
  - **Project Manager** – create/manage projects, assign tasks, track progress.
  - **Team Lead** – manage tasks within assigned projects, review updates.
  - **Member** – view/update assigned tasks, comment, log work.
  - **Client (optional)** – read-only access to assigned projects.

### 📂 Project Management

- Create, update, archive projects.
- Assign project managers and teams.
- Metadata: title, description, deadlines, status.

### ✅ Task Management

- Tasks with: title, description, priority, deadline, status, assignee(s).
- Subtasks and checklists.
- File attachments (Convex storage or optional S3).
- Task lifecycle: **To Do → In Progress → Review → Done**.
- Commenting with `@mentions`.

### 📊 Views & Filters

- **Kanban board** view.
- **List view**.
- **Calendar view** (deadlines).
- Filters: by assignee, priority, status, project.

### 🔔 Notifications & Activity

- Real-time in-app notifications.
- Activity logs per project/task.

### 📈 Lightweight Reports

- Project progress overview.
- Task completion rate by team/member.

---

## ⚙️ Tech Stack

- **Frontend**: Next.js (App Router, RSC, Tailwind CSS).
- **Backend/DB**: Convex (data, auth, real-time sync).
- **File Storage**: Convex storage (or S3 fallback).
- **Deployment**: Vercel (frontend) + Convex cloud.

---

## 🔒 Non-Functional Requirements

- **Scalable**: Powered by Convex serverless backend.
- **Secure**: Strong tenant-based data isolation.
- **Fast**: Real-time task updates under 200ms.
- **Reliable**: Auto-sync across clients with Convex.
- **Maintainable**: Clean modular Next.js components.

---

## 📌 Roles & Permissions

| Role                | Permissions                                          |
| ------------------- | ---------------------------------------------------- |
| **Admin**           | Manage tenant users, roles, all projects and tasks.  |
| **Project Manager** | Create/manage projects, assign tasks, track reports. |
| **Team Lead**       | Manage tasks in assigned projects, review updates.   |
| **Member**          | View/update assigned tasks, comment, log work.       |
| **Client** (opt)    | Read-only view of assigned projects.                 |

---

## 🔮 Future Enhancements

- Subscription plans (per tenant).
- AI task suggestions (auto-prioritization).
- Time tracking per task.
- Advanced dashboards with analytics.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- Yarn / npm
- Convex account ([https://convex.dev](https://convex.dev))
- Vercel account (for deployment)

### Installation

```bash
# Clone repo
git clone https://github.com/abrarkhalidofficial/Multi-Tenant-Task-Management-System-for-Software-House.git

# Navigate to project
cd Multi-Tenant-Task-Management-System-for-Software-House

# Install dependencies
npm install   # or yarn install
```
