📘 Campus Job ERP — Backend (FastAPI + Prisma + Supabase)

A full‑stack HR + Scheduling + Payroll system designed for university student employment. This backend powers authentication, supervisor workflows, worker operations, scheduling, payroll, and performance feedback using FastAPI, Prisma, and Supabase PostgreSQL.

---

🚀 Features

🔐 Authentication & Security

• JWT‑based auth (30‑min access tokens, 7‑day refresh tokens)
• HttpOnly refresh cookies for secure session management
• Device‑based session tracking
• Role‑based authorization (Supervisor vs Worker)


👥 HR & User Management

• Supervisor onboarding
• Worker pre‑registration (invitation system)
• Email‑based signup validation
• Department + role assignments


📅 Scheduling & Shifts

• Supervisor shift creation and assignment
• Worker shift views (upcoming, completed)
• Check‑in / check‑out tracking
• Conflict‑free scheduling logic


📝 Requests & Approvals

• Time‑off requests
• Shift‑swap requests
• Supervisor approval workflow
• Notes + audit trail


💵 Payroll (Mocked)

• Hour tracking
• Pay stub generation
• Tax + deduction fields
• PDF export endpoint (optional)


⭐ Performance & Feedback

• Supervisor feedback submissions
• Worker feedback history


---

🏗️ Tech Stack

Layer	Technology	
Backend Framework	FastAPI	
ORM	Prisma (prisma-client-py)	
Database	Supabase PostgreSQL	
Auth	JWT + HttpOnly Cookies	
Testing	Postman	
Frontend	React (separate repo)	


---

📂 Project Structure

backend/
├── app/
│   ├── api/
│   ├── auth/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── utils/
│   └── main.py
├── prisma/
│   └── schema.prisma
├── .env
├── requirements.txt
└── README.md


---

🗄️ Database Schema (Prisma)

The system includes models for:

• Supervisor
• Worker
• Shift
• Request
• Availability
• Feedback
• PayStub


Each model includes timestamps, relations, and business‑logic fields (e.g., status, invitedAt, reviewedBy, etc.).

---

🔌 API Overview

Authentication

Method	Endpoint	Description	
POST	/api/auth/supervisor/signup	Create supervisor account	
POST	/api/auth/worker/signup	Worker signup (requires invitation)	
POST	/api/auth/login	Login for both roles	
POST	/api/auth/logout	Logout + invalidate refresh token	
POST	/api/auth/refresh	Refresh access token	
GET	/api/auth/me	Get current user	


Supervisor

• Invite workers
• Manage workers
• Create/edit shifts
• Approve/deny requests
• Submit feedback


Worker

• View shifts
• Check in/out
• Submit requests
• Manage availability
• View pay stubs
• View feedback


Full endpoint list is available in the Backend Integration Guide.

---

🧪 Testing (Postman)

A full Postman collection is included with folders for:

• Auth
• Supervisor actions
• Worker actions


Each request includes tests for status codes and token handling.

---

⚙️ Environment Variables

Create a .env file:

DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

JWT_SECRET=your-secret
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

ALLOWED_ORIGINS=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

APP_NAME=Campus Job ERP
FRONTEND_URL=http://localhost:3000


---

▶️ Running the Backend

1. Install dependencies

pip install -r requirements.txt


2. Generate Prisma client

prisma generate


3. Run migrations

prisma migrate deploy


4. Start FastAPI server

uvicorn app.main:app --reload


---

🔐 CORS Configuration

Configured in main.py:

• Allows frontend origins
• Supports credentials
• Allows all methods + headers


---

🤝 Contributing

Branch Strategy

• main — production‑ready code
• dev — active development
• Feature branches: feature/<name>


Pull Requests

• Required for all merges
• Must pass linting + tests
• Must be reviewed by repo owner


Adding Collaborators

• Repo → Settings → Collaborators
• Add GitHub usernames
• Assign Write access
• PR review required before merge


---

📄 License

MIT License

---

🧭 Roadmap

• Admin dashboard
• Analytics + reporting
• Mobile worker check‑in
• Supervisor scheduling calendar
• Payroll PDF generation


---

🙋‍♂️ Maintainers

• Issah
• Berny
• Stephen



------------------------------------------------------
Campus Job ERP — Backend Service

The Campus Job ERP Backend is a service‑oriented system that provides authentication, workforce management, scheduling, payroll modeling, and performance workflows for university student employment programs. The service is implemented using FastAPI, Prisma, and Supabase PostgreSQL, and is designed for reliability, security, and integration with a React‑based frontend.

---

1. System Overview

The backend exposes a REST API that supports three primary user groups:

• Supervisors — manage workers, create shifts, approve requests, and provide performance feedback.
• Workers — view schedules, track hours, submit requests, and access pay information.
• Administrators (future module) — oversee departments, staffing, and analytics.


The service implements role‑based access control, secure session management, and a structured workflow for invitations, onboarding, scheduling, and approvals.

---

2. Architecture

2.1 Technology Stack

• FastAPI — API framework and request handling
• Prisma (Python) — ORM and schema management
• Supabase PostgreSQL — relational database
• JWT Authentication — access + refresh token model
• HttpOnly Cookies — secure refresh token storage
• Postman — API testing and validation


2.2 High-Level Architecture

• Stateless access tokens for request authorization
• Device‑scoped refresh tokens for session continuity
• Prisma client for database access
• Modular API routers grouped by domain (auth, supervisor, worker, shifts, requests, payroll, feedback)
• CORS configuration for controlled frontend integration


---

3. Core Functional Domains

3.1 Authentication & Identity

• Supervisor and worker onboarding flows
• Worker pre‑registration via supervisor invitation
• Email‑based validation
• JWT access tokens (30 minutes)
• Refresh tokens (7 days, HttpOnly cookie)
• Device‑based session tracking


3.2 Workforce Management

• Supervisor‑managed worker roster
• Worker profiles with role, rate, and status
• Invitation lifecycle: invited → active → inactive


3.3 Scheduling

• Shift creation, assignment, and modification
• Worker shift visibility (upcoming, completed)
• Check‑in / check‑out tracking
• Conflict‑aware scheduling logic


3.4 Requests & Approvals

• Time‑off requests
• Shift‑swap requests
• Availability submissions
• Supervisor approval workflows with notes and audit timestamps


3.5 Payroll (Modeled)

• Hour aggregation
• Rate application
• Gross and net pay calculations
• Pay stub generation and retrieval


3.6 Performance Feedback

• Supervisor feedback submissions
• Worker feedback history


---

4. Database Schema

The Prisma schema defines the following models:

• Supervisor
• Worker
• Shift
• Request
• Availability
• Feedback
• PayStub


Each model includes timestamps, relational mappings, and domain‑specific fields (e.g., status, invitedAt, reviewedBy, issuedDate).

The schema is located at:

prisma/schema.prisma


---

5. API Surface

The API is organized into domain‑specific modules. Representative endpoints include:

Authentication

• POST /api/auth/supervisor/signup
• POST /api/auth/worker/signup
• POST /api/auth/login
• POST /api/auth/logout
• POST /api/auth/refresh
• GET /api/auth/me


Supervisor Operations

• Worker invitations and roster management
• Shift creation and modification
• Request approvals
• Feedback submission


Worker Operations

• Shift retrieval and attendance
• Request submission
• Availability management
• Pay stub access
• Feedback history


A full endpoint catalog is maintained in the Backend Integration Guide.

---

6. Environment Configuration

Create a .env file with the following variables:

DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

ALLOWED_ORIGINS=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

APP_NAME=Campus Job ERP
FRONTEND_URL=http://localhost:3000


---

7. Local Development

7.1 Install Dependencies

pip install -r requirements.txt


7.2 Generate Prisma Client

prisma generate


7.3 Apply Migrations

prisma migrate deploy


7.4 Start the Server

uvicorn app.main:app --reload


The service will be available at:

http://localhost:8000


---

8. Security Controls

• CORS restrictions based on environment configuration
• HttpOnly cookies for refresh tokens
• Role‑based authorization middleware
• Password hashing using industry‑standard algorithms
• Session invalidation on logout
• Unique device‑based refresh token tracking


---

9. Testing & Quality Assurance

A Postman collection is included for:

• Authentication flows
• Supervisor operations
• Worker operations
• Shift workflows
• Request approvals
• Payroll and feedback endpoints


Tests validate status codes, token handling, and response structure.

---

10. Contribution Workflow

10.1 Branching Model

• main — stable, production‑ready code
• dev — integration branch
• Feature branches: feature/<feature-name>


10.2 Pull Request Requirements

• All changes must be submitted via PR
• PRs require review before merge
• Automated checks must pass (linting, tests)
• Direct commits to main are restricted

---

11. Roadmap

Planned enhancements include:

• Administrative dashboards
• Department‑level analytics
• Advanced scheduling tools
• Mobile‑optimized worker check‑in
• Automated payroll PDF generation
• Multi‑department supervisor assignments


---

12. Maintainers

• Issah
• Berny
• Stephen
