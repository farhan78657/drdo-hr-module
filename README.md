# DRDO SSPL — HR & Training Management System

A full-stack, security-hardened internal portal for managing personnel training at DRDO's Solid State Physics Laboratory.

---

## Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18 or later | https://nodejs.org |
| .NET SDK | v10.0 or later | https://dotnet.microsoft.com/download |

---

## Launch in 3 steps

### Step 1 — Backend (API server)

Open a terminal, navigate to the `backend` directory, and run:

```bash
cd backend
dotnet run --urls "http://localhost:5000"
```

Wait until you see:
```
Now listening on: http://localhost:5000
```

> **Security Note:** The database (`drdo_hr.db`) is created automatically on first run and seeded with role-based mock accounts using secure **BCrypt password hashing** (work factor 12).

---

### Step 2 — Frontend (Web app)

Open a **second terminal**, navigate to the `frontend` directory, and run:

```bash
cd frontend
npm install
npm run dev
```

Wait until you see:
```
Local: http://localhost:5173/
```

---

### Step 3 — Open in browser

Go to: **http://localhost:5173**

---

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| HR Admin | `admin@sspl.drdo.in` | `Admin@123` |
| Scientist Mentor | `dr.gupta@sspl.drdo.in` | `Mentor@123` |

---

## Tech Stack & Hardened Features

- **Frontend:** React.js, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios.
  - Strict UI standard (Navy layout, 1px hairline borders, high-density dashboard layouts, tabular figures).
  - Clean memoization with zero React Compiler/ESLint warnings or errors.
- **Backend:** ASP.NET Core Web API (C#), Entity Framework Core, SQLite.
  - BCrypt.Net password hashing for secure authentication.
  - Class-level and route-level Role-Based Access Control (RBAC).
  - Multi-layered protection against Indirect Object Reference (IDOR) data leaks.
  - Security headers middleware (CSP, X-Frame-Options, X-Content-Type-Options).
  - Auth rate limiting protection (10 req/min).
  - Strict request size limits.
