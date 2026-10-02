# TEXFLOW - Garment & Textile Factory Management System

TEXFLOW is a comprehensive, full-stack Garment and Textile Factory Management System. Designed for high-performance factory floors, TEXFLOW connects workforce attendance, machine assignments, customer orders, and live production tracking with a powerful AI Prediction Engine to give factory managers absolute control and insight over their operations.

## Architecture

TEXFLOW employs a modern, decoupled architecture:
- **Frontend**: A highly responsive Single Page Application (SPA) built with React, Vite, and Tailwind CSS.
- **Backend**: A high-performance RESTful API powered by FastAPI and Python.
- **Database**: A robust, scalable PostgreSQL database managed via SQLAlchemy ORM and Alembic migrations.
- **AI Prediction Engine**: An integrated machine learning module utilizing historical production data for predictive analytics.

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, React Router, Axios, Recharts, React Icons, html2pdf.
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Alembic, Pydantic, Passlib (bcrypt), Python-JOSE (JWT).
- **Database**: PostgreSQL 14+
- **AI/ML**: Scikit-Learn, Pandas, Numpy, Joblib.

## Modules

TEXFLOW is composed of 10 fully integrated phases:
1. **Worker Management**: Secure workforce database, HR details, and status tracking.
2. **Attendance Management**: Daily check-in/out, overtime calculation, and absence tracking.
3. **Machine Management**: Real-time machine status, operator assignments, and downtime monitoring.
4. **Customer Management**: B2B customer profiles and contact tracking.
5. **Order Management**: Customer order processing, delivery deadlines, and priority flagging.
6. **Production Management**: Stage-by-stage factory floor tracking, defect logging, and progress calculation.
7. **AI Prediction Engine**: Delay risk analysis, required worker forecasting, and completion estimation.
8. **Manager Dashboard**: High-level statistical overview and live factory pulse.
9. **Analytics & Reports**: Deep-dive charting, cross-module analytics, and CSV/PDF report generation.
10. **Role-Based Portals**: Secure, partitioned environments for Admins and Workers.

## Login Flows

### Admin Login Flow
- **Access**: `http://localhost:5174/login`
- **Authentication**: JWT-based login validating against the `user_accounts` table where `role='ADMIN'`.
- **Authorization**: Admins are redirected to `/dashboard` and have full read/write access to all factory management, AI, and reporting modules.

### Worker Login Flow
- **Access**: `http://localhost:5174/login`
- **Authentication**: JWT-based login validating against `user_accounts` where `role='WORKER'`. Workers are mapped directly to a specific `worker_id`.
- **Authorization**: Workers are redirected to `/worker-dashboard`. Backend endpoint protection (`require_worker`) enforces strict row-level privacy, ensuring a worker can only read their own Attendance, Profile, and Machine/Production assignments. Access to Admin pages is strictly blocked.

## Project Structure

```text
texflow-antigravity/
│
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── assets/           # Images (e.g. Concept 2 login background)
│   │   ├── components/       # Reusable UI components & ProtectedRoutes
│   │   ├── layouts/          # Dashboard layouts & sidebars
│   │   ├── pages/            # Admin & Worker view components
│   │   └── services/         # Axios API interceptors & backend services
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # RESTful API Routers
│   │   ├── core/             # Database connection & config
│   │   ├── ml/               # AI Prediction models & logic
│   │   ├── models/           # SQLAlchemy ORM definitions
│   │   ├── schemas/          # Pydantic validation models
│   │   └── security/         # JWT and password hashing
│   ├── alembic/              # Database migration scripts
│   ├── scripts/              # Bootstrap scripts (e.g. create_admin.py)
│   ├── requirements.txt
│   └── main.py
│
└── README.md
```

## Prerequisites

- Node.js (v18+)
- Python (3.10+)
- PostgreSQL (14+)

## PostgreSQL Setup

1. Install and start your PostgreSQL service.
2. Create the production database:
   ```sql
   CREATE DATABASE texflow_db;
   ```

## Environment Variables

DO NOT hardcode secrets. Use `.env` files.

**Backend (`backend/.env`):**
```env
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=texflow_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password
JWT_SECRET_KEY=generate_a_random_secure_string_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**Frontend (`frontend/.env` - optional for prod):**
```env
VITE_API_BASE_URL=http://127.0.0.1:8001
```

## Running Locally

### Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```
*API Documentation available at: http://127.0.0.1:8001/docs*

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Application available at: http://localhost:5174*

## AI Prediction Mode

The AI Prediction engine supports two modes:
1. **Rule-Based Fallback**: If the database lacks sufficient historical completion data (less than 10 completed orders), the system intelligently defaults to a statistical rule-based estimation for delays, worker requirements, and completion dates.
2. **Machine Learning Mode**: Once enough data is gathered, Admins can trigger the AI Training endpoint. The system utilizes Scikit-Learn `RandomForestRegressor` and `RandomForestClassifier` pipelines to predict outcomes, saving `.joblib` models to the `backend/app/ml/models/` directory.

## Reports

TEXFLOW provides native PDF and CSV generation.
- **CSV**: Processed completely in-memory on the frontend for instant downloads.
- **PDF**: Uses `html2canvas` and `jspdf` to convert rich, stylized HTML reports directly into downloadable PDFs, ensuring data privacy by keeping the operation client-side.

## Production Build

To prepare the frontend for production deployment:
```bash
cd frontend
npm run build
```
This generates highly optimized, minified static files in the `dist/` directory.

## Deployment Preparation

TEXFLOW is designed to be cloud-agnostic:

### Frontend
The compiled `dist/` folder is a standard static site. It can be effortlessly deployed to:
- **Vercel**
- **Netlify**
- **AWS S3 / CloudFront**
- **Nginx** (Ensure SPA fallback routing is configured so all paths point to `index.html`).

### Backend
FastAPI is production-ready via ASGI servers like Uvicorn or Gunicorn.
- **Render / Railway / Heroku**: Connect the repository, define the root directory as `backend/`, and set the start command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Cloud VMs (AWS EC2 / DigitalOcean)**: Use `gunicorn` with `uvicorn` workers behind an Nginx reverse proxy.
- Ensure all `.env` variables are safely configured in the hosting provider's secrets manager.

### Database
- Use a managed PostgreSQL provider (e.g., AWS RDS, Supabase, Neon, Render PostgreSQL).

## Database Backup & Restore

**Backup:**
Use standard PostgreSQL tools to take automated daily snapshots.
```bash
pg_dump -U postgres -h localhost texflow_db > texflow_backup.sql
```

**Restore (Warning: Destructive):**
```bash
psql -U postgres -h localhost -d texflow_db < texflow_backup.sql
```

## Troubleshooting

- **CORS Errors**: Ensure `VITE_API_BASE_URL` exactly matches the backend host, including `http://127.0.0.1` vs `http://localhost`. Windows IPv6 drops can occasionally cause `localhost` to fail; `127.0.0.1` is recommended.
- **Bcrypt Module Errors**: If `passlib` throws an AttributeError regarding `bcrypt`, ensure you have installed `bcrypt==3.2.2` specifically, as newer v4+ versions broke passlib compatibility.
- **Frontend Port Conflicts**: Vite defaults to 5173, but will increment to 5174+ if the port is busy. Always check the terminal output for the correct local URL.
