# Leeds Bus Tracker API

This is a Node.js + Express application for buses in Leeds, allowing authenticated users to view, create, update, and delete data regarding bus stops and arrival logs.

## Tech Stack
- Runtime: Node.js
- Framework: Express
- Database: PostgreSQL (`pg`)

## Features
- User login and registration
- Create, read, update, and delete stops/logs with ease
- Get reliability statistics for stops/services

## Environment Variables
Create a `.env` file at project root with the required keys:

```env
PORT=3000
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
DB_SSL=false
```

Notes:
- `DB_SSL` can be `true` or `false`.
- In `db/index.js`, SSL is auto-enabled when host contains `render.com` unless `DB_SSL=false`.
- Do not commit real secrets (DB password, JWT secret) to source control.

## Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`.
3. Start development server:
   ```bash
   npm run dev
   ```
4. If `npm run dev` fails, use production start:
   ```bash
   npm start
   ```
5. Local URLs:
   - App/UI: `http://localhost:3000`
   - API base: `http://localhost:3000/api`

## Database Schema (Quick Setup)
Use the SQL below to create the minimum tables required by this project.

```sql
-- Users for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bus stops table
CREATE TABLE stops (
atco_code VARCHAR(20) PRIMARY KEY,
stop_name VARCHAR(255) NOT NULL,
street VARCHAR(255),
indicator VARCHAR(50),
latitude DECIMAL(9,6) NOT NULL,
longitude DECIMAL(9,6) NOT NULL,
locality VARCHAR(100)
);

-- Arrival logs table
CREATE TABLE arrival_logs (
id SERIAL PRIMARY KEY,
stop_id VARCHAR(20) NOT NULL REFERENCES stops(atco_code),
route_number VARCHAR(10) NOT NULL,
scheduled_time TIMESTAMP NOT NULL, 
actual_time TIMESTAMP,
delay_minutes INTEGER,
status VARCHAR(20)

);
```

## Data Import Scripts
The repository includes two CSV seeding scripts:

### 1) Import Leeds Stops
- Script: `scripts/importLeedsStops.js`
- Source CSV: `data/450Stops.csv`
- Behavior:
  - imports rows where `ParentLocalityName === 'Leeds'`
  - inserts into `stops`
  - ignores duplicates by `atco_code` (`ON CONFLICT DO NOTHING`)
- Dataset obtained from https://beta-naptan.dft.gov.uk/download/la

Run:
```bash
node scripts/importLeedsStops.js
```

### 2) Import Arrival Logs
- Script: `scripts/importArrivalLogs.js`
- Source CSV: `data/arrival_logs.csv`
- Behavior:
  - inserts logs into `arrival_logs`
  - treats empty `actual_time` and `delay_minutes` as `null`
  - prints progress every 1000 rows
- Data generated synthetically from *Google Gemini*

Run:
```bash
node scripts/importArrivalLogs.js
```

Recommended import order:
1. stops first (`importLeedsStops.js`)
2. logs second (`importArrivalLogs.js`)

Prerequisites:
- PostgreSQL tables must already exist.
- `.env` database credentials must point to the target DB.

## Deployment
This API is hosted on Render.

Public URLs:
- `https://cwk1.onrender.com`
- `https://cwk1.onrender.com/api`

## API Documentation
- PDF: `docs/API_Documentation.pdf`
- Markdown: `docs/API_Documentation.md`

The PDF includes:
- all available endpoints
- parameters and request formats
- expected JSON responses
- authentication process
- error/status codes

## Main Endpoint Groups
- `/api/auth`
- `/api/stops`
- `/api/logs`
- `/api/reliability`
