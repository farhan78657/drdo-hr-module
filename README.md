# DRDO SSPL — Trainee Management Portal

## Prerequisites
- **Node.js** v18+ → https://nodejs.org
- **.NET SDK** v10.0+ → https://dotnet.microsoft.com/download

## How to Run

**Terminal 1 — Start Backend:**
```bash
cd backend
dotnet run --urls "http://localhost:5000"
```

**Terminal 2 — Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| HR Admin | `admin@sspl.drdo.in` | `Admin@123` |
| Mentor | `dr.gupta@sspl.drdo.in` | `Mentor@123` |

## Tech Stack
- **Frontend:** React.js, TypeScript, Tailwind CSS
- **Backend:** ASP.NET Core (C#), Entity Framework Core
- **Database:** SQLite (auto-created on first run)
