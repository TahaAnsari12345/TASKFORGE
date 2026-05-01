# TaskForge

TaskForge is a full-stack project management application built with React, Vite, Express, and PostgreSQL. It helps teams manage projects, organize tasks, and collaborate with role-based access.

## Features

- User authentication with login and registration
- Project creation, editing, and assignment
- Task management with status tracking and due dates
- Role-based access for members and workspace admins
- Responsive frontend built with Vite + React
- REST API served by Express.js

## Project Structure

- `client/` – React frontend
- `server/` – Express backend API
- `db.js` – PostgreSQL connection and database setup
- `routes/` – API route handlers for auth, projects, tasks, and users
- `.env` – environment variables for local development

## Setup

### Prerequisites

- Node.js 18+ installed
- PostgreSQL installed and running

### Local installation

```bash
npm install
cd client
npm install
```

### Environment variables

Create a `.env` file in the project root with values like:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskforge
JWT_SECRET=taskforge_dev_secret_key_2026
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Run locally

From the project root:

```bash
npm run dev
```

This starts both the client and server with `concurrently`.

## Build

To build the frontend only:

```bash
cd client
npm run build
```

To build the full project from the root:

```bash
npm run build
```

## Deployment

### Vercel

This project can be deployed to Vercel using a root `vercel.json` configuration. The backend is configured as a serverless function and the frontend is built from `client/`.

Live demo: https://taskforge-olive.vercel.app/

### Production start

```bash
npm start
```

## API Endpoints

- `POST /api/auth/login` – Sign in
- `POST /api/auth/register` – Create account
- `GET /api/projects` – List projects
- `POST /api/projects` – Create new project
- `GET /api/tasks` – List tasks
- `POST /api/tasks` – Create new task

## Notes

- Use the `CLIENT_URL` env variable to allow CORS from the frontend
- The backend serves static files from `client/dist` when `NODE_ENV=production`
- If you deploy to Vercel, ensure your database connection is available from the deployed environment

## Author

Built by **Taha Ansari**.
