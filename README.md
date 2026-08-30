# Karwaan — Full-Stack Logistics Platform

This is a decoupled client-server architecture containing a **React (Vite)** frontend and a **Node.js (Express)** backend.

## 1. Database Connection Status
**Yes, the database is currently connected!** 
The project uses a cloud-hosted Neon Postgres Serverless database. The connection string is already configured in `backend/.env` under the `DATABASE_URL` variable. You do not need to install Postgres locally.

## 2. Is there any need for Seeding?
**Yes, but only if the database is completely empty.**
If you just cloned the repo or cleared the database, you must seed it so that you have mock user accounts, shipments, and delivery routes to interact with.
To seed the database, you can run `npm run seed` inside the `backend/` directory or `npm run seed --prefix backend` from the root.

## 3. How to Run the Project

To view the project properly, you must run the **Backend API** and the **Frontend UI** simultaneously. You can run them in two separate terminal windows either using workspace commands from the root directory or by navigating into the subdirectories.

### Option A: Using Workspace Scripts (From the Root Directory)

#### Terminal 1: Start the Backend Server
```bash
npm run dev:backend
```

#### Terminal 2: Start the Frontend UI
```bash
npm run dev:frontend
```

---

### Option B: Navigating to Subdirectories

#### Terminal 1: Start the Backend Server
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Start the backend development server:
   ```bash
   npm run dev
   ```

#### Terminal 2: Start the Frontend UI
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Start the frontend development server:
   ```bash
   npm run dev
   ```

## 4. Test Accounts for Viewing the Project
Once the UI is open in your browser, you can log in using the demo backdoor to bypass the real bcrypt hashes. Use any of these emails with the universal demo password:

**Password for all accounts:** `demo-access-2026`

- **Admin View:** `admin@karwaan.in` (Can see all data)
- **Business View:** `logistics@sahyadri.in` (Can only see their own shipments and routes)
- **Agent View:** `agent1@karwaan.in` (Driver dashboard view)