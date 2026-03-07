# Leeds Bus Tracker API Documentation

## Document Info
- Project: COMP3011 Coursework 1 - Leeds Bus Tracker API
- API type: REST over HTTP
- Default local base URL: `http://localhost:3000/api`
- Production base URL: `https://cwk1.onrender.com/api`
- Content type: `application/json`

## Authentication
Protected endpoints require a JWT access token in the Authorization header.

Header format:
```http
Authorization: Bearer <token>
```

How to obtain token:
1. Register user: `POST /auth/register`
2. Login user: `POST /auth/login`
3. Read `token` from login response JSON
4. Include token in protected requests

Authentication-related errors:
- `401 Unauthorized`: missing token
- `403 Forbidden`: invalid or expired token

## Endpoints

### 1) Register User
- Method: `POST`
- Path: `/auth/register`
- Auth required: No

Request body:
```json
{
  "username": "alice",
  "password": "alice123"
}
```

Success response (`201`):
```json
{
  "message": "User registered successfully.",
  "user": {
    "id": 1,
    "username": "alice"
  }
}
```

Error responses:
- `400` missing username/password
- `409` username already exists
- `500` server error

---

### 2) Login User
- Method: `POST`
- Path: `/auth/login`
- Auth required: No

Request body:
```json
{
  "username": "alice",
  "password": "alice123"
}
```

Success response (`200`):
```json
{
  "message": "Login successful.",
  "token": "<jwt-token>"
}
```

Error responses:
- `400` missing username/password
- `401` invalid username or password
- `500` server error

---

### 3) Get Stops (with filters + pagination)
- Method: `GET`
- Path: `/stops`
- Auth required: No
- Query params:
  - `atco_code` (optional)
  - `name` (optional, partial match)
  - `locality` (optional, partial match)
  - `page` (optional, default `1`)
  - `limit` (optional, default `20`, max `100`)

Example request:
```http
GET /api/stops?name=Station&page=1&limit=20
```

Success response (`200`):
```json
{
  "data": [
    {
      "atco_code": "450012345",
      "stop_name": "Leeds Station",
      "street": "New Station St",
      "indicator": "A",
      "latitude": 53.794,
      "longitude": -1.547,
      "locality": "Leeds"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 245
}
```

Error responses:
- `500` server error

---

### 4) Create Stop (protected)
- Method: `POST`
- Path: `/stops`
- Auth required: Yes

Request body:
```json
{
  "atco_code": "TEST001",
  "stop_name": "Test Stop",
  "street": "Test Street",
  "indicator": "A",
  "latitude": 53.8,
  "longitude": -1.55,
  "locality": "Leeds"
}
```

Success response (`201`):
```json
{
  "atco_code": "TEST001",
  "stop_name": "Test Stop",
  "street": "Test Street",
  "indicator": "A",
  "latitude": 53.8,
  "longitude": -1.55,
  "locality": "Leeds"
}
```

Error responses:
- `400` required fields missing (`atco_code`, `stop_name`, `latitude`, `longitude`)
- `401` missing token
- `403` invalid/expired token
- `500` server error

---

### 5) Update Stop (protected)
- Method: `PUT`
- Path: `/stops/:id`
- Auth required: Yes
- Path param:
  - `id`: stop ATCO code

Request body (all fields optional):
```json
{
  "stop_name": "Updated Stop Name",
  "street": "Updated Street",
  "indicator": "B",
  "latitude": 53.81,
  "longitude": -1.54,
  "locality": "Leeds"
}
```

Success response (`200`):
```json
{
  "atco_code": "TEST001",
  "stop_name": "Updated Stop Name",
  "street": "Updated Street",
  "indicator": "B",
  "latitude": 53.81,
  "longitude": -1.54,
  "locality": "Leeds"
}
```

Error responses:
- `401` missing token
- `403` invalid/expired token
- `404` stop not found
- `500` server error

---

### 6) Delete Stop (protected)
- Method: `DELETE`
- Path: `/stops/:id`
- Auth required: Yes
- Path param:
  - `id`: stop ATCO code

Success response (`200`):
```json
{
  "atco_code": "TEST001",
  "stop_name": "Updated Stop Name",
  "street": "Updated Street",
  "indicator": "B",
  "latitude": 53.81,
  "longitude": -1.54,
  "locality": "Leeds"
}
```

Error responses:
- `401` missing token
- `403` invalid/expired token
- `404` stop not found
- `500` server error

---

### 7) Get Arrival Logs (with filters + pagination)
- Method: `GET`
- Path: `/logs`
- Auth required: No
- Query params:
  - `stop_id` (optional)
  - `route_number` (optional)
  - `page` (optional, default `1`)
  - `limit` (optional, default `20`, max `100`)

Example request:
```http
GET /api/logs?route_number=12&page=1&limit=20
```

Success response (`200`):
```json
{
  "data": [
    {
      "id": 101,
      "stop_id": "450012345",
      "route_number": "12",
      "scheduled_time": "2026-03-07T08:30:00.000Z",
      "actual_time": "2026-03-07T08:34:00.000Z",
      "delay_minutes": 4,
      "status": "late"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 10000
}
```

Error responses:
- `500` server error

---

### 8) Create Arrival Log (protected)
- Method: `POST`
- Path: `/logs`
- Auth required: Yes

Request body:
```json
{
  "stop_id": "450012345",
  "route_number": "12",
  "scheduled_time": "2026-03-07T08:30:00.000Z",
  "actual_time": "2026-03-07T08:34:00.000Z"
}
```

Success response (`201`):
```json
{
  "id": 101,
  "stop_id": "450012345",
  "route_number": "12",
  "scheduled_time": "2026-03-07T08:30:00.000Z",
  "actual_time": "2026-03-07T08:34:00.000Z",
  "delay_minutes": 4,
  "status": "late"
}
```

Error responses:
- `400` missing required fields (`stop_id`, `route_number`, `scheduled_time`)
- `401` missing token
- `403` invalid/expired token
- `500` server error

---

### 9) Update Arrival Log (protected)
- Method: `PUT`
- Path: `/logs/:id`
- Auth required: Yes
- Path param:
  - `id`: log ID

Request body (all fields optional):
```json
{
  "actual_time": "2026-03-07T08:36:00.000Z"
}
```

Success response (`200`):
```json
{
  "id": 101,
  "stop_id": "450012345",
  "route_number": "12",
  "scheduled_time": "2026-03-07T08:30:00.000Z",
  "actual_time": "2026-03-07T08:36:00.000Z",
  "delay_minutes": 6,
  "status": "late"
}
```

Error responses:
- `401` missing token
- `403` invalid/expired token
- `404` log not found
- `500` server error

---

### 10) Delete Arrival Log (protected)
- Method: `DELETE`
- Path: `/logs/:id`
- Auth required: Yes
- Path param:
  - `id`: log ID

Success response (`200`):
```json
{
  "message": "Log deleted"
}
```

Error responses:
- `401` missing token
- `403` invalid/expired token
- `404` log not found
- `500` server error

---

### 11) Reliability by Stop
- Method: `GET`
- Path: `/reliability/:atco_code`
- Auth required: No

Success response (`200`):
```json
{
  "atco_code": "450012345",
  "stats": {
    "total_arrivals": "120",
    "avg_delay": "1.80",
    "early_count": "25",
    "late_count": "40",
    "cancelled_count": "5"
  }
}
```

Error responses:
- `404` stop not found or no arrivals
- `500` server error

---

### 12) Reliability by Route
- Method: `GET`
- Path: `/reliability/route/:route_number`
- Auth required: No
- Query params:
  - `stop_id` (optional)

Example request:
```http
GET /api/reliability/route/12?stop_id=450012345
```

Success response (`200`):
```json
{
  "route_number": "12",
  "stop_id": "450012345",
  "stats": {
    "total_arrivals": "32",
    "avg_delay": "2.10",
    "early_count": "5",
    "late_count": "12",
    "cancelled_count": "2"
  }
}
```

Error responses:
- `404` route not found or no arrivals
- `500` server error

## Postman / Testing Notes
You can test endpoints in Postman using:
- Base URL: `http://localhost:3000/api`
- For protected routes, set `Authorization` -> `Bearer Token` with the JWT from login.