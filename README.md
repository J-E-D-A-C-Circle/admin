# DVLA Central Administration Enterprise Suite

A unified microservices suite for the Driver and Vehicle Licensing Authority (DVLA), featuring a single central access gateway portal connecting all administrative operations.

## Architecture & Service Map

| Service | Port | Description | Stack / Notes |
| :--- | :--- | :--- | :--- |
| **Central Gateway Portal** | `http://localhost:3000` | Single central access portal with real-time health checks | Next.js 15, TailwindCSS v4 |
| **Asset Management System (AMS)** | `http://localhost:3001` | Inventory, equipment auditing, hardware lifecycle | Next.js, MySQL (3307), phpMyAdmin (8080) |
| **Expenditure Management (EMS)** | `http://localhost:3002` | Ghana Post EMS dispatch, receipts, expense auditing | Next.js, MySQL (3308), phpMyAdmin (8082) |
| **Fleet Management System (FMS)** | `http://localhost:3003` | Real-time fleet telemetry, maintenance, driver & fuel logs | Next.js, MySQL (3309), phpMyAdmin (8083) |

---

## One-Click Launch Scripts

All services can be launched together or individually via the provided Windows batch files:

- **Launch All Services**: Run `start-all.bat` (launches Gateway Portal, AMS, EMS, Fleet Management, databases, and phpMyAdmin).
- **Stop All Services**: Run `stop-all.bat`.
- **Individual Services**:
  - `start-portal.bat` / `stop-portal.bat`
  - `start-ams.bat` / `stop-ams.bat`
  - `start-ems.bat` / `stop-ems.bat`
  - `start-fleet.bat` / `stop-fleet.bat`

---

## Docker Compose Orchestration

The root `docker-compose.yml` unifies all 4 projects:
```yaml
include:
  - path: portal/docker-compose.yml
  - path: ams/docker-compose.yml
  - path: ems/docker-compose.yml
  - path: fleet-mgt/docker-compose.yml
```

All microservices communicate across the shared Docker bridge network `dvla-admin-net`.

---

## Local Development Mode

If running in local development mode without Docker:

```bash
# Terminal 1 - Central Gateway Portal
cd portal
npm run dev # Port 3000

# Terminal 2 - Asset Management System
cd ams
npm run dev # Port 3001

# Terminal 3 - Expenditure Management System
cd ems
npm run dev # Port 3002

# Terminal 4 - Fleet Management System
cd fleet-mgt
npm run dev # Port 3003
```
