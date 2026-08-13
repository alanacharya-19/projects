# Hospital Management System

A production-ready Django-based hospital management system with role-based dashboards, billing, pharmacy, laboratory, room admissions, reports, audit logging, and hospital settings.

## Features

- **Role-based access**: Admin, Doctor, and Receptionist users with role-specific dashboards and navigation.
- **Patients**: Registration, demographics, blood group, medical history, searchable directory.
- **Departments & Doctors**: Department management, doctor profiles, specialties, availability, consultation fees.
- **Appointments**: Booking, scheduling, completion, and cancellation with doctor/patient assignment.
- **Medical Records**: Visit history, diagnosis, prescriptions, and doctor notes per patient.
- **Billing**: Invoices with line items, discounts, tax, partial/full payments, cancellation, and payment methods.
- **Pharmacy**: Medicine catalog with stock levels, low-stock alerts, prescriptions with dispensing (automatic stock decrement), and stock movement history.
- **Laboratory**: Test types, lab orders, per-test results, and completed status tracking.
- **Rooms & Admissions**: Room catalog with capacity/type/rate, admissions, transfers, and discharge with automatic room status refresh.
- **Reports**: Financial, clinical, and operational analytics with CSV export.
- **Audit Log**: Middleware-driven action logging for authenticated requests.
- **Hospital Settings**: Editable hospital-wide branding (name, contact, hours) shown across the UI.
- **Notifications**: In-app notifications for staff.
- **Production ready**: Environment-driven settings, WhiteNoise static serving, gunicorn, Docker + nginx, security hardening (HSTS, secure cookies, etc.).

## Tech Stack

- Python 3.12, Django 6.0
- PostgreSQL (psycopg 3)
- WhiteNoise (static files), gunicorn (WSGI server)
- Docker + docker-compose (optional deployment)
- Pure-Django templating with a custom CSS design system (no JS framework)

## Project Structure

```
HospitalManagementSystem/
├── hospital/            # Project config (settings, urls, csv export helper)
├── accounts/            # Custom User with roles + auth
├── dashboard/           # Dashboards, global search, seed_demo command
├── departments/         # Hospital departments
├── doctors/             # Doctor profiles
├── patients/            # Patient records
├── appointments/        # Appointment scheduling
├── medical_records/     # Visit history / medical records
├── billing/             # Invoices and payments
├── notifications/       # In-app notifications
├── hospital_settings/   # Hospital-wide settings singleton
├── audit/               # Audit log + middleware
├── pharmacy/            # Medicines, prescriptions, stock
├── laboratory/          # Lab test types, orders, results
├── admissions/          # Rooms and admissions
├── reports/             # Analytics and CSV exports
├── templates/           # Shared + per-app templates
├── static/              # CSS, JS, favicon
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── entrypoint.sh
```

## Local Setup

### Prerequisites

- Python 3.12+
- PostgreSQL 14+ (running locally or reachable)

### 1. Clone and configure environment

```bash
git clone <repo-url> HospitalManagementSystem
cd HospitalManagementSystem

python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
```

Edit `.env` with your values:

```
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,testserver

DB_NAME=hospital_db
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
```

### 2. Create the database

```sql
CREATE DATABASE hospital_db;
```

### 3. Run migrations and seed demo data

```bash
python manage.py migrate
python manage.py seed_demo
```

`seed_demo` is idempotent — re-running it refreshes passwords, updates the catalog, and never duplicates demo records.

### 4. Start the dev server

```bash
python manage.py runserver
```

Visit http://localhost:8000/

## Demo Accounts

| Role         | Username      | Password          |
|--------------|---------------|-------------------|
| Admin        | `admin`       | `admin123`        |
| Receptionist | `receptionist`| `receptionist123` |
| Doctor       | `doctor`      | `doctor123`       |

Django admin: http://localhost:8000/admin/ (use the admin account)

## Running Tests

```bash
python manage.py test --keepdb
```

The suite covers all 15 apps (dashboards, billing, pharmacy, laboratory, admissions, reports, audit, settings, and more). Use `--keepdb` to reuse the test database between runs for speed.

## Production Deployment

### Option A: Docker (recommended)

1. Configure `.env` with production values (`DEBUG=False`, a strong `SECRET_KEY`, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, and the DB credentials).
2. Build and start:

```bash
docker compose up --build -d
```

This starts:
- `db` — PostgreSQL 16 (persistent volume)
- `web` — gunicorn app (runs migrations + `collectstatic` on start)
- `nginx` — reverse proxy serving static/media and proxying to the app on port 80

### Option B: Manual gunicorn + WhiteNoise

```bash
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn hospital.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

Static files are served by WhiteNoise with compressed, cache-busted manifests.

### Security hardening

With `DEBUG=False`, set these in `.env` to enable production security:

```
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
CSRF_TRUSTED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

Validate with:

```bash
python manage.py check --deploy
```

Logs are written to `logs/hospital.log` (rotating) and the console.

## Useful Commands

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py test --keepdb
python manage.py check --deploy
python manage.py seed_demo
```
