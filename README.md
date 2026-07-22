# FastNetMon Advanced GUI

A modern, secure, and high-performance web interface designed to monitor and manage multiple FastNetMon Advanced instances from a single pane of glass.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

## 🚀 Features

- **Multi-Instance Dashboard**: Monitor traffic (Gbps/Mpps), active bans, and FlowSpec rules across all your FNM nodes in real-time.
- **Mitigation Center**: Manage BGP Blackholes and complex FlowSpec rules with a specialized, user-friendly interface.
- **Hostgroup Management**: Visually create and edit hostgroups, define custom thresholds, and assign network subnets.
- **Advanced Settings**: Full access to FNM configuration parameters via a grouped, searchable settings interface.
- **Enterprise Security**:
  - Encrypted storage for all FNM API credentials (AES-256-GCM).
  - JWT-based session management with strict CORS and CSP policies.
  - Bruteforce protection via login rate limiting.
- **Modern UX**:
  - Fully responsive design with native-feeling interactions.
  - Support for **System/Light/Dark modes** with high-contrast visibility.
  - Persistent server selector for rapid switching between nodes.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Shadcn UI, TanStack Query, Lucide Icons, Sonner.
- **Backend**: Node.js, Express, Better-SQLite3 (Fast & Lightweight), Crypto (Security).
- **Deployment**: Docker & Docker Compose with Nginx production-ready proxy.

## 📦 Quick Start (Docker)

The fastest way to get the GUI running is using Docker Compose.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/Fastnetmon-GUI.git
   cd Fastnetmon-GUI
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and provide secure values for `JWT_SECRET` and `ENCRYPTION_KEY`.*

3. **Launch the Stack**:
   ```bash
   docker-compose up -d --build
   ```

4. **Access the GUI**:
   Open your browser to `http://localhost:8080`.
   - **Default Username**: `admin`
   - **Default Password**: set `ADMIN_PASSWORD` in `.env` before first launch, or a random password is generated and printed once in the backend logs (`docker logs fnm-gui-backend`).

## 🔧 Manual Development Setup

### Backend
1. `cd backend`
2. `npm install`
3. `node src/seed.js` (Creates default admin user)
4. `npm run dev` (Runs on port 5000)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Runs on port 5173)

## 🛡 Security Best Practices

- **Encryption Key**: Keep your `ENCRYPTION_KEY` safe. If lost, you will need to re-enter all FNM server passwords.
- **HTTPS**: In production, always run this GUI behind an SSL/TLS terminating proxy (like Nginx, Traefik, or Caddy) to protect your credentials in transit.
- **FNM Access**: Ensure the machine running this GUI has network access to your FastNetMon nodes on the API port (default 10007).

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
