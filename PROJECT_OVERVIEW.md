# TaskForge Project Overview

## 1. What this project is

TaskForge is a team task management web application built with:
- Backend: Node.js, Express, PostgreSQL
- Frontend: React + Vite
- Authentication: JWT + bcrypt
- Deployment: Designed for production deployment via Render or similar hosting

The app supports:
- user signup and login
- role-based access (admin vs member)
- project creation and team membership
- task creation, assignment, status tracking, and overdue alerts
- dashboard and project/task views

---

## 2. High-level architecture

### 2.1 Backend

Location: `server/`

Main responsibilities:
- HTTP API for auth, users, projects, and tasks
- JWT authentication and role enforcement
- Database initialization and seed data
- Production static file serving for the frontend

Key files:
- `server/index.js` — Express app entrypoint, middleware setup, route registration, CORS config, production static delivery
- `server/db.js` — PostgreSQL connection, schema creation, default admin seeding
- `server/middleware/auth.js` — JWT verification and admin guard
- `server/routes/auth.js` — register and login
- `server/routes/projects.js` — project CRUD and member management
- `server/routes/tasks.js` — task CRUD, task filtering, dashboard stats
- `server/routes/users.js` — user listing and current user info

### 2.2 Frontend

Location: `client/`

Main responsibilities:
- UI for login, registration, dashboard, projects, and tasks
- Routing and protected route handling
- API requests using Axios
- Token storage in `localStorage`
- Toast notification support

Key files:
- `client/src/App.jsx` — route definitions and protected page wrapper
- `client/src/context/AuthContext.jsx` — auth state, login/logout, token persistence
- `client/src/api/axios.js` — base API client, auth header injection, 401 handling
- `client/src/pages/` — page-level views for app screens
- `client/src/components/` — reusable UI components

---

## 3. Backend flow and startup

### 3.1 Startup flow

`server/index.js` does the following:
1. loads environment variables with `dotenv`
2. creates an Express app
3. enables JSON body parsing
4. configures CORS using `CLIENT_URL`, `localhost:5173`, and `localhost:4173`
5. mounts API routers for `/api/auth`, `/api/projects`, `/api/tasks`, `/api/users`
6. exposes `/api/health` for a simple health check
7. in production, serves React build files from `client/dist`
8. calls `initDB()` and `seedAdmin()` before listening on `PORT`

### 3.2 Database initialization

`server/db.js`:
- uses `pg` `Pool` with either `DATABASE_URL` or local DB config
- creates these tables if they do not exist:
  - `users`
  - `projects`
  - `project_members`
  - `tasks`
- seeds one default admin user if missing:
  - `admin@taskforge.com`
  - password: `Admin@123`

### 3.3 Authentication middleware

`server/middleware/auth.js`:
- `authenticate` reads `Authorization: Bearer <token>` header
- verifies token with `JWT_SECRET`
- attaches decoded user payload to `req.user`
- `requireAdmin` allows only admin requests

---

## 4. Backend data model

### 4.1 Tables

`users`
- id, name, email, password, role, created_at
- role is `admin` or `member`

`projects`
- id, name, description, owner_id, created_at
- owner_id references `users.id`

`project_members`
- id, project_id, user_id
- ensures project team membership
- unique constraint on `(project_id, user_id)`

`tasks`
- id, title, description, status, priority, project_id, assigned_to, created_by, due_date, created_at
- status: `todo`, `in_progress`, `done`
- priority: `low`, `medium`, `high`

### 4.2 RBAC summary

ADMIN
- create, update, delete projects
- add/remove project members
- create tasks
- edit all task details
- delete tasks
- assign tasks to members

MEMBER
- view projects they belong to
- view tasks in those projects
- update status of tasks assigned to them only
- cannot create/edit/delete projects
- cannot create/delete tasks
- cannot modify task details aside from status on assigned tasks

---

## 5. API summary

### Auth

- `POST /api/auth/register`
  - body: `{ name, email, password, role? }`
  - response: user + JWT

- `POST /api/auth/login`
  - body: `{ email, password }`
  - response: user + JWT

### Users

- `GET /api/users`
  - returns all users
- `GET /api/users/me`
  - returns current user from token

### Projects

- `GET /api/projects`
  - returns projects where current user is owner or member
- `POST /api/projects`
  - admin only
  - create project and add owner as member
- `GET /api/projects/:id`
  - must be owner or member
  - returns project plus its members
- `PUT /api/projects/:id`
  - admin or project owner
- `DELETE /api/projects/:id`
  - admin or project owner
- `POST /api/projects/:id/members`
  - admin or owner
  - body: `{ userId }`
- `DELETE /api/projects/:id/members/:userId`
  - admin or owner

### Tasks

- `GET /api/tasks`
  - filters: `projectId`, `status`, `assignedTo`
  - only returns tasks for projects where user is a member
- `POST /api/tasks`
  - admin only
  - task must belong to a project the admin is a member of
- `GET /api/tasks/stats`
  - dashboard counts and upcoming tasks for logged-in user
- `PUT /api/tasks/:id`
  - admin can update all fields
  - member can update only status for tasks assigned to them
- `DELETE /api/tasks/:id`
  - admin only

---

## 6. Frontend flow

### 6.1 Routing

`client/src/App.jsx` defines routes:
- `/login`
- `/register`
- `/` → `DashboardPage`
- `/projects` → `ProjectsPage`
- `/projects/:id` → `ProjectDetailPage`
- `/tasks` → `TasksPage`

Unauthenticated requests are redirected to `/login`.

### 6.2 Auth state

`client/src/context/AuthContext.jsx` handles:
- storing auth token in `localStorage.tf_token`
- storing user in `localStorage.tf_user`
- login and logout helpers
- redirect on logout

### 6.3 API client

`client/src/api/axios.js`:
- base URL is `VITE_API_URL` or `/api`
- request interceptor appends `Authorization: Bearer <token>`
- response interceptor clears storage and redirects to `/login` on 401

### 6.4 UI patterns

The client is organized into:
- `pages/` for screens
- `components/` for reusable UI elements
- `context/` for global state
- `api/` for the HTTP client
- `utils/` for shared helper functions

This is a standard React SPA structure.

---

## 7. Setup and running locally

### 7.1 Required environment variables

Backend uses:
- `DATABASE_URL` or local DB config:
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- `PORT` (default `5000`)
- `CLIENT_URL`
- `NODE_ENV`

Suggested local `.env` content:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskforge
JWT_SECRET=your_secret_key
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 7.2 Run commands

From repository root:
- `npm install`
- `cd client && npm install`
- `npm run dev`

This runs backend with `nodemon` and frontend with Vite concurrently.

### 7.3 Production build

- `npm run build` — installs dependencies and builds the frontend
- `npm start` — starts the Express server in production mode

---

## 8. Recommended learning path for this project

1. Start with `server/index.js` to understand startup and routing.
2. Read `server/db.js` to learn the database schema and seed behavior.
3. Read `server/middleware/auth.js` for auth flow and role checks.
4. Read `server/routes/auth.js` to understand signup/login and token generation.
5. Read `server/routes/projects.js` and `server/routes/tasks.js` for business logic and RBAC rules.
6. Read `client/src/App.jsx` for the app route structure.
7. Read `client/src/context/AuthContext.jsx` to understand how auth state is stored and used.
8. Read `client/src/api/axios.js` for API request flow and token attachment.
9. Explore one page at a time in `client/src/pages/` to understand UI and API interactions.
10. Check `client/src/components/` for reusable components and layout patterns.

---

## 9. Important notes

- This app seeds a default admin account automatically on startup if it does not exist.
- In production, `server/index.js` serves the built React app from `client/dist`.
- The backend currently allows all users to fetch `/api/users`, but it is protected with auth.
- Task creation and project management are strictly limited to admin users by backend RBAC.

---

## 10. Useful files to study next

- `README.md` — project summary and setup instructions
- `render.yaml` — Render deployment blueprint
- `server/index.js` — app setup and production static handling
- `server/db.js` — DB schema and initial admin seed
- `client/src/App.jsx` — routing
- `client/src/context/AuthContext.jsx` — auth
- `client/src/api/axios.js` — API client
- `client/src/pages/` — actual app screens
