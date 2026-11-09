# Sweety – Blood Glucose Tracker

A full-stack assignment project built with React, Node.js, Express and PostgreSQL.

## Features
- Registration and login with bcrypt password hashing and JWT authentication
- User-isolated glucose readings
- Create, list, edit and delete readings
- Four daily slots: Morning (fasting), After breakfast, After lunch, After dinner
- Validation: required value, integer 40–600 mg/dl, unique slot per day, maximum four readings/day, no future dates
- Daily, month-to-date and previous-month reports
- Demo seed script and backend unit tests

> This is a software demonstration, not a medical device. It does not provide diagnosis or treatment advice.

## Requirements
- Node.js 18+
- PostgreSQL 14+
- npm

## 1. Database setup
Create a PostgreSQL database:

```sql
CREATE DATABASE sweety_db;
```

The backend creates tables automatically on startup. Alternatively, run `backend/sql/schema.sql` against `sweety_db`.

## 2. Configure environment
Copy `backend/.env.example` to `backend/.env` and update the database credentials and JWT secret.

```bash
cd backend
cp .env.example .env
npm install
```

Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

## 3. Start the backend
```bash
cd backend
npm run dev
```
API runs at `http://localhost:5000`.

## 4. Seed demo data
In another terminal:
```bash
cd backend
npm run seed
```
Demo login:
- Email: `demo@sweety.local`
- Password: `SweetyDemo@123`

The seed script is safe to re-run: it finds or creates the demo user and replaces that user's demo readings.

## 5. Start the frontend
In another terminal:
```bash
cd frontend
npm install
npm start
```
React runs at `http://localhost:3000`.

## 6. Run tests
```bash
cd backend
npm test
```

## API overview
All reading and report endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/readings` | List own readings |
| POST | `/api/readings` | Add reading |
| PUT | `/api/readings/:id` | Update own reading |
| DELETE | `/api/readings/:id` | Delete own reading |
| GET | `/api/reports/daily?date=YYYY-MM-DD` | Daily report |
| GET | `/api/reports/month-to-date?date=YYYY-MM-DD` | Month-to-date report |
| GET | `/api/reports/previous-month?date=YYYY-MM-DD` | Previous month report |

## Assumptions
- Dates are stored as PostgreSQL `DATE` values and interpreted as calendar dates supplied by the user.
- A reading slot is unique per user per date. Different users can record the same slot/date independently.
- The maximum of four readings per day follows from the four allowed unique slots; the API also checks the explicit limit.
- Report averages are rounded to one decimal place.
- Previous-month report means the entire calendar month immediately before the month containing the selected date.
- Authentication uses a bearer JWT. For a production deployment, use HTTPS, refresh-token rotation, rate limiting, stronger operational secret management and additional security review.

## What I would improve with more time
- Pagination and filtering on the readings list
- A monthly trend chart and accessible date navigation
- More integration and frontend tests
- Docker Compose for local setup
- Deployment, monitoring and audit logging
