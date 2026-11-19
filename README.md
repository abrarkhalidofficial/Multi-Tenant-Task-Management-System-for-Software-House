# Multi-Tenant Task Management System

A comprehensive task management system built with Next.js, Convex, and shadcn-ui for software houses.

## Features

- **Multi-Tenant Architecture**: Isolated workspaces with tenant-specific settings
- **Role-Based Access Control**: Admin, Project Manager, Team Lead, Member, Client roles
- **Project & Task Management**: Full CRUD operations with subtasks and dependencies
- **Real-time Collaboration**: Live updates using Convex
- **File Attachments**: Secure file storage with Convex
- **Comments & @Mentions**: Rich commenting system
- **Kanban/List/Calendar Views**: Multiple task visualization options
- **Notifications**: In-app notifications and activity feeds
- **Analytics & Reports**: Comprehensive reporting and analytics
- **Responsive Design**: Mobile-first design with shadcn-ui

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Convex (Database, Auth, Real-time, File Storage)
- **UI**: shadcn-ui, Tailwind CSS
- **Deployment**: Vercel (Frontend), Convex Cloud (Backend)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Convex CLI

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd multi-tenant-task-management-system
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up Convex:

```bash
pnpm convex:dev
```

This will:

- Initialize Convex in your project
- Set up authentication
- Generate the database schema
- Start the development server

4. Start the Next.js development server:

```bash
pnpm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── analytics/         # Analytics page
│   ├── dashboard/         # Dashboard page
│   ├── projects/          # Project management
│   ├── tasks/            # Task management
│   └── ...
├── components/            # React components
│   ├── analytics/        # Analytics components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components
│   ├── notifications/    # Notification components
│   ├── tasks/            # Task components
│   └── ui/               # shadcn-ui components
├── convex/               # Convex backend
│   ├── auth.ts           # Authentication logic
│   ├── middleware.ts     # Authorization middleware
│   ├── permissions.ts    # Permission definitions
│   ├── projects.ts       # Project operations
│   ├── tasks.ts          # Task operations
│   ├── tenants.ts        # Tenant management
│   └── schema.ts         # Database schema
└── lib/                  # Utility libraries
    ├── auth/             # Authentication context
    ├── types/            # TypeScript types
    └── utils/            # Helper functions
```

## Database Schema

The system uses a comprehensive database schema with the following main tables:

- **tenants**: Multi-tenant isolation
- **users**: User management with roles
- **projects**: Project information and settings
- **tasks**: Task management with subtasks
- **taskComments**: Comments with @mentions
- **notifications**: In-app notifications
- **activityLogs**: Audit trail
- **files**: File attachments
- **timeEntries**: Time tracking
- **reports**: Saved reports

## Authentication & Authorization

- **Authentication**: Convex Auth with support for multiple providers
- **Authorization**: Role-based access control with granular permissions
- **Tenant Isolation**: Data isolation between tenants

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables:
   - `CONVEX_URL`: Your Convex deployment URL
   - `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL
3. Deploy automatically on push

### Backend (Convex)

1. Deploy to Convex Cloud:

```bash
pnpm convex:deploy
```

2. Set up authentication providers in Convex dashboard
3. Configure file storage settings

## Development Commands

```bash
# Start development servers
pnpm run dev              # Next.js dev server
pnpm convex:dev          # Convex dev server

# Build for production
pnpm run build           # Build Next.js app
pnpm convex:deploy       # Deploy Convex functions

# Code quality
pnpm run lint            # Run ESLint
```

## Environment Variables

Create a `.env.local` file with:

```env
# Convex
CONVEX_URL=your-convex-url
NEXT_PUBLIC_CONVEX_URL=your-convex-url

# Optional: Authentication providers
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
```

## Performance

- **Real-time Updates**: <200ms response times
- **Optimized Queries**: Efficient database indexing
- **Lazy Loading**: Components load on demand
- **Caching**: Convex provides automatic caching

## Security

- **Data Isolation**: Tenant-specific data separation
- **Authentication**: Secure authentication with Convex
- **Authorization**: Granular permission system
- **File Security**: Secure file upload and access
- **Audit Trail**: Complete activity logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
