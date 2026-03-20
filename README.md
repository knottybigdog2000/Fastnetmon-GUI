# FastNetMon GUI

A modern web interface to monitor and manage multiple FastNetMon Advanced instances.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend:** Node.js, Express, Better-SQLite3, JWT

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the Backend:**
   ```bash
   cd backend
   # Seed the admin user (first time only)
   node src/seed.js
   # Start the server
   npm start
   ```
   The backend will run on `http://localhost:5000`.
   Default credentials: `admin` / `password`

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

## Features
- **Multi-Server Management:** Add and monitor multiple FNM instances from one place.
- **Secure Proxy:** All API requests to FNM instances are proxied through the backend to handle authentication and CORS.
- **Modern UI:** Built with Tailwind CSS and Shadcn UI for a clean, responsive experience.

## Next Steps
- Implement real-time traffic graphs using Recharts.
- Implement hostgroup and network configuration editing.
