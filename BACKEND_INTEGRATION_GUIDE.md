# Campus Job ERP - Backend Integration Guide

## Overview

This document provides comprehensive information for integrating the React frontend with the FastAPI + Prisma + PostgreSQL (Supabase) backend.

---

## Tech Stack Confirmation ✅

**Backend Technologies:**

- ✅ **FastAPI** - Python web framework for building APIs
- ✅ **Python** - Programming language for backend
- ✅ **Prisma** - ORM with Python client (`prisma-client-py`)
- ✅ **Supabase** - PostgreSQL database hosting
- ✅ **Postman** - API testing and documentation

**Authentication & Security:**

- ✅ **JWT** - Access tokens (30 min expiry) + Refresh tokens (7 day expiry)
- ✅ **HttpOnly Cookies** - For secure refresh token storage
- ✅ **Session Management** - Device-based sessions, access tokens tied to student/employee ID
- ✅ **Authorization** - Role-based access (Supervisor vs Worker)

**Key Features:**

- ✅ **Supervisor Environment** - Supervisors create accounts and invite workers using email, ID, and name
- ✅ **Worker Pre-Registration** - Workers added to database by supervisor before they can sign up
- ✅ **Email Invitations** - Automatic emails sent to workers with signup links
- ✅ **Validation Flow** - Worker signup validates email + studentId against supervisor invitations

---

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Data Models & Database Schema](#data-models--database-schema)
3. [API Endpoints Required](#api-endpoints-required)
4. [Frontend State Structure](#frontend-state-structure)
5. [Integration Points](#integration-points)
6. [Environment Variables](#environment-variables)
7. [CORS & Security](#cors--security)

---

## 1. Authentication Flow

### Current Frontend Auth State

```javascript
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [userRole, setUserRole] = useState(null); // "worker" or "supervisor"
```

### Required Backend Implementation

#### A. Supervisor Sign-Up Flow

**Endpoint:** `POST /api/auth/supervisor/signup`

**Request Body:**

```json
{
  "name": "Sarah Johnson",
  "email": "sjohnson@university.edu",
  "password": "securePassword123",
  "phone": "(555) 123-4567",
  "department": "Student Services",
  "employeeId": "SUP-001"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Supervisor account created successfully",
  "supervisor": {
    "id": "uuid",
    "name": "Sarah Johnson",
    "email": "sjohnson@university.edu",
    "role": "supervisor"
  }
}
```

#### B. Supervisor Adds Worker (Pre-registration)

**Endpoint:** `POST /api/supervisor/workers/invite`

**Headers:**

```
Authorization: Bearer {access_token}
```

**Request Body:**

```json
{
  "studentEmail": "jsmith@university.edu",
  "studentId": "STU-12345",
  "studentName": "Jordan Smith",
  "jobOffer": {
    "position": "Student Worker",
    "hourlyRate": 16.0,
    "department": "Student Center"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Job offer sent to jsmith@university.edu",
  "worker": {
    "id": "uuid",
    "email": "jsmith@university.edu",
    "studentId": "STU-12345",
    "name": "Jordan Smith",
    "status": "invited",
    "invitedBy": "supervisor_uuid",
    "invitedAt": "2026-02-23T10:00:00Z"
  }
}
```

**Action:** System should send email with signup link

#### C. Worker Sign-Up (After Invitation)

**Endpoint:** `POST /api/auth/worker/signup`

**Request Body:**

```json
{
  "name": "Jordan Smith",
  "email": "jsmith@university.edu",
  "studentId": "STU-12345",
  "password": "securePassword123"
}
```

**Backend Validation:**

1. Check if email + studentId exist in database (from supervisor invitation)
2. If not found, reject signup
3. If found, create account and activate worker

**Response:**

```json
{
  "success": true,
  "message": "Account created successfully",
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "uuid",
    "name": "Jordan Smith",
    "email": "jsmith@university.edu",
    "studentId": "STU-12345",
    "role": "worker",
    "hourlyRate": 16.0
  }
}
```

#### D. Login (Both Roles)

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "jsmith@university.edu",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "accessToken": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here",
  "user": {
    "id": "uuid",
    "name": "Jordan Smith",
    "email": "jsmith@university.edu",
    "studentId": "STU-12345",
    "role": "worker",
    "hourlyRate": 16.0
  }
}
```

**Frontend Integration:**

```javascript
const handleLogin = async (email, password) => {
  const response = await fetch("http://localhost:8000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.success) {
    // Store tokens
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    document.cookie = `refreshToken=${data.refreshToken}; HttpOnly; Secure; SameSite=Strict`;

    // Update state
    setIsLoggedIn(true);
    setUserRole(data.user.role); // "worker" or "supervisor"
    setActivePage("dashboard");
  }
};
```

#### E. Token Refresh

**Endpoint:** `POST /api/auth/refresh`

**Request (Cookie or Body):**

```json
{
  "refreshToken": "refresh_token_from_cookie"
}
```

**Response:**

```json
{
  "success": true,
  "accessToken": "new_jwt_access_token"
}
```

#### F. Logout

**Endpoint:** `POST /api/auth/logout`

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. Data Models & Database Schema

### Prisma Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-py"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Supervisor {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  password      String   // Hashed
  phone         String?
  department    String?
  employeeId    String?  @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  invitedWorkers Worker[] @relation("SupervisorInvites")
  shifts         Shift[]  @relation("SupervisorShifts")
  feedbacks      Feedback[]

  @@map("supervisors")
}

model Worker {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  password      String   // Hashed
  studentId     String   @unique
  hourlyRate    Float    @default(16.00)
  role          String   @default("Student Worker")
  status        String   @default("invited") // invited, active, inactive
  phone         String?

  invitedBy     String?
  invitedAt     DateTime?
  activatedAt   DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  supervisor    Supervisor? @relation("SupervisorInvites", fields: [invitedBy], references: [id])
  shifts        Shift[]
  requests      Request[]
  availability  Availability[]
  feedbacks     Feedback[]
  payStubs      PayStub[]

  @@map("workers")
}

model Shift {
  id                String    @id @default(uuid())
  workerId          String
  supervisorId      String

  location          String
  address           String?
  date              DateTime
  startTime         String
  endTime           String
  hours             Float
  rate              Float
  status            String    @default("confirmed") // confirmed, pending, completed, cancelled

  instructions      String?
  checkInTime       DateTime?
  checkOutTime      DateTime?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  worker            Worker    @relation(fields: [workerId], references: [id])
  supervisor        Supervisor @relation("SupervisorShifts", fields: [supervisorId], references: [id])

  @@map("shifts")
}

model Request {
  id              String    @id @default(uuid())
  workerId        String
  type            String    // "time-off", "shift-swap", "availability"
  title           String
  dateRange       String
  reason          String
  status          String    @default("pending") // pending, approved, denied

  submittedDate   DateTime  @default(now())
  reviewedBy      String?
  reviewedDate    DateTime?
  notes           String?

  affectedShifts  Int?
  swapWith        String?   // For shift-swap requests
  originalShift   String?
  proposedShift   String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  worker          Worker    @relation(fields: [workerId], references: [id])

  @@map("requests")
}

model Availability {
  id              String    @id @default(uuid())
  workerId        String

  dayOfWeek       String    // Monday, Tuesday, etc.
  startTime       String
  endTime         String
  isRecurring     Boolean   @default(true)
  effectiveDate   DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  worker          Worker    @relation(fields: [workerId], references: [id])

  @@map("availability")
}

model Feedback {
  id              String    @id @default(uuid())
  workerId        String
  supervisorId    String

  rating          Int       // 1-5
  category        String
  comments        String

  createdAt       DateTime  @default(now())

  // Relations
  worker          Worker     @relation(fields: [workerId], references: [id])
  supervisor      Supervisor @relation(fields: [supervisorId], references: [id])

  @@map("feedbacks")
}

model PayStub {
  id              String    @id @default(uuid())
  workerId        String

  periodStart     DateTime
  periodEnd       DateTime
  totalHours      Float
  hourlyRate      Float
  grossPay        Float

  // Deductions
  federalTax      Float     @default(0)
  stateTax        Float     @default(0)
  socialSecurity  Float     @default(0)
  medicare        Float     @default(0)

  netPay          Float

  status          String    @default("pending") // pending, issued
  issuedDate      DateTime?

  createdAt       DateTime  @default(now())

  // Relations
  worker          Worker    @relation(fields: [workerId], references: [id])

  @@map("pay_stubs")
}
```

---

## 3. API Endpoints Required

### Authentication

| Method | Endpoint                      | Description                               | Auth Required       |
| ------ | ----------------------------- | ----------------------------------------- | ------------------- |
| POST   | `/api/auth/supervisor/signup` | Supervisor registration                   | No                  |
| POST   | `/api/auth/worker/signup`     | Worker registration (requires invitation) | No                  |
| POST   | `/api/auth/login`             | Login for both roles                      | No                  |
| POST   | `/api/auth/logout`            | Logout                                    | Yes                 |
| POST   | `/api/auth/refresh`           | Refresh access token                      | Yes (Refresh Token) |
| GET    | `/api/auth/me`                | Get current user info                     | Yes                 |

### Supervisor - Worker Management

| Method | Endpoint                         | Description                     | Auth Required    |
| ------ | -------------------------------- | ------------------------------- | ---------------- |
| POST   | `/api/supervisor/workers/invite` | Invite worker to system         | Yes (Supervisor) |
| GET    | `/api/supervisor/workers`        | Get all workers in team         | Yes (Supervisor) |
| GET    | `/api/supervisor/workers/:id`    | Get worker profile details      | Yes (Supervisor) |
| PUT    | `/api/supervisor/workers/:id`    | Update worker info (rate, role) | Yes (Supervisor) |

### Supervisor - Shift Management

| Method | Endpoint                     | Description      | Auth Required    |
| ------ | ---------------------------- | ---------------- | ---------------- |
| POST   | `/api/supervisor/shifts`     | Create new shift | Yes (Supervisor) |
| GET    | `/api/supervisor/shifts`     | Get all shifts   | Yes (Supervisor) |
| PUT    | `/api/supervisor/shifts/:id` | Edit shift       | Yes (Supervisor) |
| DELETE | `/api/supervisor/shifts/:id` | Cancel shift     | Yes (Supervisor) |

### Supervisor - Request Approvals

| Method | Endpoint                               | Description             | Auth Required    |
| ------ | -------------------------------------- | ----------------------- | ---------------- |
| GET    | `/api/supervisor/requests`             | Get all worker requests | Yes (Supervisor) |
| GET    | `/api/supervisor/requests/pending`     | Get pending requests    | Yes (Supervisor) |
| PUT    | `/api/supervisor/requests/:id/approve` | Approve request         | Yes (Supervisor) |
| PUT    | `/api/supervisor/requests/:id/deny`    | Deny request            | Yes (Supervisor) |

### Supervisor - Feedback

| Method | Endpoint                             | Description                   | Auth Required    |
| ------ | ------------------------------------ | ----------------------------- | ---------------- |
| POST   | `/api/supervisor/feedback`           | Give feedback to worker       | Yes (Supervisor) |
| GET    | `/api/supervisor/feedback/:workerId` | Get worker's feedback history | Yes (Supervisor) |

### Worker - Shifts

| Method | Endpoint                          | Description          | Auth Required |
| ------ | --------------------------------- | -------------------- | ------------- |
| GET    | `/api/worker/shifts`              | Get my shifts        | Yes (Worker)  |
| GET    | `/api/worker/shifts/upcoming`     | Get upcoming shifts  | Yes (Worker)  |
| PUT    | `/api/worker/shifts/:id/checkin`  | Check in to shift    | Yes (Worker)  |
| PUT    | `/api/worker/shifts/:id/checkout` | Check out from shift | Yes (Worker)  |

### Worker - Requests

| Method | Endpoint                   | Description            | Auth Required |
| ------ | -------------------------- | ---------------------- | ------------- |
| POST   | `/api/worker/requests`     | Submit new request     | Yes (Worker)  |
| GET    | `/api/worker/requests`     | Get my requests        | Yes (Worker)  |
| GET    | `/api/worker/requests/:id` | Get request details    | Yes (Worker)  |
| DELETE | `/api/worker/requests/:id` | Cancel pending request | Yes (Worker)  |

### Worker - Availability

| Method | Endpoint                   | Description                | Auth Required |
| ------ | -------------------------- | -------------------------- | ------------- |
| POST   | `/api/worker/availability` | Submit/update availability | Yes (Worker)  |
| GET    | `/api/worker/availability` | Get my availability        | Yes (Worker)  |

### Worker - Payroll

| Method | Endpoint                            | Description           | Auth Required |
| ------ | ----------------------------------- | --------------------- | ------------- |
| GET    | `/api/worker/paystubs`              | Get all pay stubs     | Yes (Worker)  |
| GET    | `/api/worker/paystubs/:id`          | Get pay stub details  | Yes (Worker)  |
| GET    | `/api/worker/paystubs/:id/download` | Download pay stub PDF | Yes (Worker)  |

### Worker - Feedback

| Method | Endpoint               | Description     | Auth Required |
| ------ | ---------------------- | --------------- | ------------- |
| GET    | `/api/worker/feedback` | Get my feedback | Yes (Worker)  |

---

## 4. Frontend State Structure

### Current State Variables

```javascript
// Authentication
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [userRole, setUserRole] = useState(null); // "worker" or "supervisor"

// Navigation
const [activePage, setActivePage] = useState("dashboard");

// Modals
const [selectedShift, setSelectedShift] = useState(null);
const [selectedPayStub, setSelectedPayStub] = useState(null);
const [showCreateShiftModal, setShowCreateShiftModal] = useState(false);
const [selectedWorker, setSelectedWorker] = useState(null);
const [showFeedbackModal, setShowFeedbackModal] = useState(false);

// Data (Replace with API calls)
const [requests, setRequests] = useState([]);
const [upcomingShifts, setUpcomingShifts] = useState([]);
const [feedbackList, setFeedbackList] = useState([]);
```

### Request Object Structure

```javascript
{
  id: 1,
  type: "time-off", // "time-off", "shift-swap", "availability"
  title: "Spring Break Vacation",
  dateRange: "Mar 15-22, 2026",
  reason: "Personal", // "Personal", "Medical", "Academic", "Family"
  status: "approved", // "pending", "approved", "denied"
  submittedDate: "Feb 1, 2026",
  reviewedBy: "Sarah Johnson",
  reviewedDate: "Feb 2, 2026",
  notes: "Approved. Enjoy your break!",
  affectedShifts: 4,
  workerName: "Jordan Smith",

  // For shift-swap requests only
  swapWith: "Alex Martinez",
  originalShift: "Student Center • 2:00 PM - 6:00 PM",
  proposedShift: "Library • 10:00 AM - 2:00 PM"
}
```

### Shift Object Structure

```javascript
{
  id: 1,
  location: "Student Center - Front Desk",
  date: "Today", // or "Tomorrow", or "Thu, Feb 13"
  time: "2:00 PM - 6:00 PM",
  duration: "4 hrs",
  hours: 4,
  rate: 16,
  supervisor: "Sarah Johnson",
  supervisorPhone: "(555) 123-4567",
  supervisorEmail: "sjohnson@university.edu",
  status: "confirmed", // "confirmed", "pending", "completed"
  address: "123 Campus Drive, Student Center Building",
  instructions: "Please arrive 10 minutes early...",
  checkInTime: null,
  checkOutTime: null,
  workerName: "Jordan Smith"
}
```

### Feedback Object Structure

```javascript
{
  id: 1,
  workerName: "Jordan Smith",
  rating: 5, // 1-5
  category: "Communication", // "Communication", "Punctuality", "Quality of Work", etc.
  comments: "Excellent communication skills with students and staff.",
  supervisorName: "Sarah Johnson",
  date: "Feb 15, 2026"
}
```

### Team Roster (Supervisor View)

```javascript
{
  id: 1,
  name: "Jordan Smith",
  role: "Student Worker", // or "Senior Worker"
  rate: 16 // hourly rate
}
```

---

## 5. Integration Points

### A. Replace Mock Data with API Calls

#### Example: Fetch Requests

**Current (Mock):**

```javascript
const [requests, setRequests] = useState([
  /* hardcoded array */
]);
```

**After Integration:**

```javascript
const [requests, setRequests] = useState([]);

useEffect(() => {
  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const endpoint =
        userRole === "supervisor"
          ? "/api/supervisor/requests"
          : "/api/worker/requests";

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setRequests(data.requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  if (isLoggedIn) {
    fetchRequests();
  }
}, [isLoggedIn, userRole]);
```

#### Example: Approve/Deny Request

**Current:**

```javascript
const handleRequestAction = (requestId, action, supervisorNotes = "") => {
  setRequests((prevRequests) =>
    prevRequests.map((req) =>
      req.id === requestId
        ? { ...req, status: action, notes: supervisorNotes }
        : req,
    ),
  );
};
```

**After Integration:**

```javascript
const handleRequestAction = async (requestId, action, supervisorNotes = "") => {
  try {
    const token = localStorage.getItem("accessToken");
    const endpoint =
      action === "approved"
        ? `/api/supervisor/requests/${requestId}/approve`
        : `/api/supervisor/requests/${requestId}/deny`;

    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notes: supervisorNotes }),
    });

    const data = await response.json();

    if (data.success) {
      // Update local state
      setRequests((prevRequests) =>
        prevRequests.map((req) => (req.id === requestId ? data.request : req)),
      );
    }
  } catch (error) {
    console.error("Error updating request:", error);
  }
};
```

#### Example: Create Shift

**Current:**

```javascript
const handleCreateShift = (shiftData) => {
  const newShift = {
    id: upcomingShifts.length + 1,
    ...shiftData,
    status: "confirmed",
    checkInTime: null,
    checkOutTime: null,
  };
  setUpcomingShifts([...upcomingShifts, newShift]);
  setShowCreateShiftModal(false);
};
```

**After Integration:**

```javascript
const handleCreateShift = async (shiftData) => {
  try {
    const token = localStorage.getItem("accessToken");

    const response = await fetch(
      "http://localhost:8000/api/supervisor/shifts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shiftData),
      },
    );

    const data = await response.json();

    if (data.success) {
      setUpcomingShifts([...upcomingShifts, data.shift]);
      setShowCreateShiftModal(false);
    }
  } catch (error) {
    console.error("Error creating shift:", error);
  }
};
```

### B. Create API Service File

**Create:** `/src/services/api.js`

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Handle API errors
const handleResponse = async (response) => {
  if (response.status === 401) {
    // Token expired, try to refresh
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      // Redirect to login
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "API request failed");
  }

  return response.json();
};

// Refresh token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("accessToken", data.accessToken);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Worker APIs
export const workerAPI = {
  getShifts: async () => {
    const response = await fetch(`${API_BASE_URL}/api/worker/shifts`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/api/worker/requests`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  submitRequest: async (requestData) => {
    const response = await fetch(`${API_BASE_URL}/api/worker/requests`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  },

  checkIn: async (shiftId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/worker/shifts/${shiftId}/checkin`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },

  checkOut: async (shiftId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/worker/shifts/${shiftId}/checkout`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },

  getPayStubs: async () => {
    const response = await fetch(`${API_BASE_URL}/api/worker/paystubs`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getFeedback: async () => {
    const response = await fetch(`${API_BASE_URL}/api/worker/feedback`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Supervisor APIs
export const supervisorAPI = {
  inviteWorker: async (workerData) => {
    const response = await fetch(
      `${API_BASE_URL}/api/supervisor/workers/invite`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(workerData),
      },
    );
    return handleResponse(response);
  },

  getWorkers: async () => {
    const response = await fetch(`${API_BASE_URL}/api/supervisor/workers`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getWorkerProfile: async (workerId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/supervisor/workers/${workerId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },

  createShift: async (shiftData) => {
    const response = await fetch(`${API_BASE_URL}/api/supervisor/shifts`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(shiftData),
    });
    return handleResponse(response);
  },

  getRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/api/supervisor/requests`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  approveRequest: async (requestId, notes) => {
    const response = await fetch(
      `${API_BASE_URL}/api/supervisor/requests/${requestId}/approve`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes }),
      },
    );
    return handleResponse(response);
  },

  denyRequest: async (requestId, notes) => {
    const response = await fetch(
      `${API_BASE_URL}/api/supervisor/requests/${requestId}/deny`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes }),
      },
    );
    return handleResponse(response);
  },

  giveFeedback: async (feedbackData) => {
    const response = await fetch(`${API_BASE_URL}/api/supervisor/feedback`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(feedbackData),
    });
    return handleResponse(response);
  },
};
```

---

## 6. Environment Variables

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
```

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Email (for sending invitations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# App
APP_NAME=Campus Job ERP
FRONTEND_URL=http://localhost:3000
```

---

## 7. CORS & Security

### Backend CORS Configuration (FastAPI)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### JWT Implementation

**JWT Payload Structure:**

```json
{
  "sub": "user_uuid",
  "email": "jsmith@university.edu",
  "role": "worker",
  "studentId": "STU-12345",
  "exp": 1709123456,
  "iat": 1709121656
}
```

**Access Token:** Expires in 30 minutes
**Refresh Token:** Expires in 7 days, stored in HttpOnly cookie

### Session Management

1. **Access Token** tied to `studentId` (for workers) or `employeeId` (for supervisors)
2. **Device-based sessions**: Track refresh tokens per device
3. **Logout invalidates** refresh token for that device only
4. **Multiple device support**: Each device gets its own refresh token

---

## 8. Testing with Postman

### Collection Structure

```
Campus Job ERP
├── Auth
│   ├── Supervisor Signup
│   ├── Worker Signup
│   ├── Login
│   ├── Refresh Token
│   └── Logout
├── Supervisor
│   ├── Invite Worker
│   ├── Get All Workers
│   ├── Create Shift
│   ├── Get Requests
│   ├── Approve Request
│   ├── Deny Request
│   └── Give Feedback
└── Worker
    ├── Get My Shifts
    ├── Submit Request
    ├── Check In
    ├── Check Out
    ├── Get Pay Stubs
    └── Get Feedback
```

### Sample Postman Request: Login

**POST** `http://localhost:8000/api/auth/login`

**Body (JSON):**

```json
{
  "email": "jsmith@university.edu",
  "password": "test123"
}
```

**Tests (Postman):**

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has access token", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.accessToken).to.exist;
  pm.environment.set("access_token", jsonData.accessToken);
});
```

---

## 9. Implementation Checklist

### Backend Team TODO:

- [ ] Set up FastAPI project structure
- [ ] Configure Prisma with Supabase PostgreSQL
- [ ] Implement JWT authentication (access + refresh tokens)
- [ ] Create all database models (Supervisor, Worker, Shift, Request, etc.)
- [ ] Implement supervisor signup endpoint
- [ ] Implement worker invitation system with email
- [ ] Implement worker signup with validation (email + studentId check)
- [ ] Implement login endpoint (both roles)
- [ ] Implement token refresh endpoint
- [ ] Implement all supervisor endpoints (CRUD shifts, approve/deny requests, feedback)
- [ ] Implement all worker endpoints (view shifts, submit requests, check-in/out)
- [ ] Set up CORS for React frontend
- [ ] Add request validation with Pydantic models
- [ ] Implement error handling and logging
- [ ] Test all endpoints with Postman
- [ ] Document all endpoints with OpenAPI/Swagger
- [ ] Set up device-based session management

### Frontend Team TODO:

- [ ] Create `/src/services/api.js` with all API functions
- [ ] Add `.env` file with `REACT_APP_API_URL`
- [ ] Replace all mock data with API calls
- [ ] Implement login form (currently using mock buttons)
- [ ] Store JWT tokens in localStorage and cookies
- [ ] Add token refresh logic (401 handling)
- [ ] Add loading states for all API calls
- [ ] Add error handling and user notifications
- [ ] Implement protected routes (redirect if not authenticated)
- [ ] Test all features with real backend
- [ ] Add request/response interceptors for auth headers

---

## 10. Sample Backend Endpoints (FastAPI)

### Example: Login Endpoint

```python
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import bcrypt

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/api/auth/login")
async def login(request: LoginRequest):
    # Find user (check both supervisors and workers)
    user = await find_user_by_email(request.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Verify password
    if not bcrypt.checkpw(request.password.encode(), user.password.encode()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Create tokens
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    return {
        "success": True,
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "studentId": getattr(user, 'studentId', None),
            "hourlyRate": getattr(user, 'hourlyRate', None)
        }
    }
```

### Example: Approve Request Endpoint

```python
@router.put("/api/supervisor/requests/{request_id}/approve")
async def approve_request(request_id: str, notes: str, current_user: Supervisor):
    # Find request
    request = await prisma.request.find_unique(where={"id": request_id})

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    # Update request
    updated_request = await prisma.request.update(
        where={"id": request_id},
        data={
            "status": "approved",
            "reviewedBy": current_user.name,
            "reviewedDate": datetime.now(),
            "notes": notes or "Approved"
        }
    )

    return {
        "success": True,
        "message": "Request approved",
        "request": updated_request
    }
```

---

## 11. Frontend Pages & Their API Needs

### Worker Dashboard

**APIs Needed:**

- `GET /api/worker/shifts/upcoming` - Next shift info
- `GET /api/worker/paystubs` - Upcoming paycheck
- `GET /api/worker/feedback` - Recent feedback

### Worker Schedule Page

**APIs Needed:**

- `GET /api/worker/shifts` - All shifts
- `PUT /api/worker/shifts/:id/checkin` - Check-in
- `PUT /api/worker/shifts/:id/checkout` - Check-out

### Worker Requests Page

**APIs Needed:**

- `GET /api/worker/requests` - All requests
- `POST /api/worker/requests` - Submit new request
- `DELETE /api/worker/requests/:id` - Cancel request

### Worker Payroll Page

**APIs Needed:**

- `GET /api/worker/paystubs` - All pay stubs
- `GET /api/worker/paystubs/:id` - Individual stub details
- `GET /api/worker/paystubs/:id/download` - Download PDF

### Supervisor Dashboard

**APIs Needed:**

- `GET /api/supervisor/workers` - Team stats
- `GET /api/supervisor/requests/pending` - Pending approvals
- `GET /api/supervisor/shifts` - Recent shifts

### Supervisor Approvals Page

**APIs Needed:**

- `GET /api/supervisor/requests` - All requests
- `PUT /api/supervisor/requests/:id/approve` - Approve
- `PUT /api/supervisor/requests/:id/deny` - Deny

### Supervisor Team Management

**APIs Needed:**

- `GET /api/supervisor/workers` - Team roster
- `GET /api/supervisor/workers/:id` - Worker profile
- `POST /api/supervisor/workers/invite` - Invite new worker
- `POST /api/supervisor/feedback` - Give feedback
- `POST /api/supervisor/shifts` - Create shift

---

## Contact & Questions

If you have questions while implementing:

1. **Data Structure Questions**: Refer to section 4 (Frontend State Structure)
2. **Endpoint Questions**: Refer to section 3 (API Endpoints)
3. **Authentication Flow**: Refer to section 1 (Authentication Flow)
4. **Database Schema**: Refer to section 2 (Prisma Schema)

---

**Last Updated:** February 23, 2026
**Frontend Version:** React 18 + Tailwind CSS 3
**Backend Stack:** FastAPI + Prisma + PostgreSQL (Supabase)
