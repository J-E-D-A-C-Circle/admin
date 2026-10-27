# DVLA & Ghana Post EMS Tracking & Expenditure Control System

> **Standalone Production-Ready Microservice**  
> Centralized postal dispatch tracking, official receipt voucher upload, Station Manager verification, auto-compiled monthly returns, and HQ director approvals for Driver and Vehicle Licensing Authority (DVLA).

---

## 🚀 Quick Start with Docker (Recommended)

The entire application stack (Next.js App + MySQL 8.0 + phpMyAdmin + Daily DB Backup) is fully containerized.

### 1. Launch All Services
```bash
docker compose up -d --build
```

### 2. Access Services
- 🌐 **EMS Web Application**: [http://localhost:3002](http://localhost:3002)
- 🗄️ **phpMyAdmin DB Admin**: [http://localhost:8082](http://localhost:8082)
- 🐬 **MySQL 8.0 Database**: `localhost:3308` (`ems_db`)

---

## 💻 Local Development Setup (Without Docker)

### Prerequisites
- Node.js 20+ or Bun 1.2+
- Running MySQL server on port `3308` (or update `.env`)

### Installation & Run
```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Push schema / run init script
npx drizzle-kit push

# 3. Start development server on port 3002
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

---

## 🔑 Default User Accounts (SRS Role Matrix)

All demo accounts have password: **`password123`**

| Role | Username | Assigned Office | Permissions & Workflow |
| :--- | :--- | :--- | :--- |
| **EMS Admin Officer** | `ems_officer` | Kumasi Station | Logs dispatches, uploads receipt vouchers, submits monthly return |
| **EMS Admin Officer (Accra)**| `ems_officer_accra` | Accra 37 Station | Same for Greater Accra office |
| **EMS Station Manager** | `ems_mgr` | Kumasi Station | Verifies or rejects dispatches with mandatory reasons |
| **EMS Station Manager (Accra)** | `ems_mgr_accra` | Accra 37 Station | Same for Greater Accra Station |
| **EMS Director HQ** | `ems_director` | National HQ | National oversight, approves returns, creates user accounts & stations, full reports |
| **EMS Finance / Audit** | `ems_audit` | National HQ | View-only audit and expenditure reports |
| **Super Administrator** | `admin` | Full Root | Master control; only role with authority to unlock finalized returns |

---

## 🏗️ Architecture & Features

- **Dashboard**: High-level KPIs, annual & monthly expenditure, purpose breakdown, top offices by volume, non-compliant stations.
- **Dispatch Register**: Filter by date, purpose, office, status. Print dispatch vouchers and view scanned receipt slips.
- **Verification Workflow**: Station Managers review pending items and verify or reject with audit trail.
- **Monthly Return Compilation**: Auto-sums dispatches, checks deadline (5th of each month), flags late submissions, HQ sign-off.
- **Receipt Storage**: Stored securely in `/app/uploads/ems` with MIME type sniffing and authenticated endpoint delivery.
- **Tamper-Proof Audit Log**: All creates, verifications, rejections, submissions, and unlocks are permanently logged.

---

## 📦 Ports & Network Configuration

- **3002**: EMS Standalone Next.js Portal
- **3308**: EMS Dedicated MySQL 8.0 Database
- **8082**: EMS phpMyAdmin
- **Backups**: Daily gzip mysqldumps saved to `./backups` with 14-day retention.
