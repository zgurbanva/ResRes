# ResRes — Restaurant Reservation System

Full-stack restaurant reservation platform with interactive floor plans, table-level availability, and admin controls.

## How this project starts (important)

This project supports **both**:

1. **Local run (recommended for development)**
2. **Docker Compose run**

So when you reopen the project, it is **not Docker-only**. You can use either workflow.

---

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** Next.js 14 (React, TypeScript, Tailwind)
- **Auth:** JWT (`python-jose`, `passlib`)
- **Optional Infra:** Docker + Docker Compose

---

## Project Structure

```text
ResRes/
├── README.md
├── ADMIN_CREDENTIALS.md
└── restaurant-reservation-system/
		├── docker-compose.yml
		├── backend/
		│   ├── app/
		│   ├── requirements.txt
		│   └── Dockerfile
		└── frontend/
				├── app/
				├── components/
				├── services/
				├── types/
				├── package.json
				├── .env.local
				└── Dockerfile
```

---

## Re-open Project: fastest start (local dev)

Use this every time you reopen the project.

### 1) Start PostgreSQL

Make sure local PostgreSQL is running and database exists:

```bash
createdb restaurant_db
```

(Ignore error if DB already exists.)

### 2) Start backend (Terminal 1)

```bash
cd restaurant-reservation-system/backend
source venv/bin/activate
DATABASE_URL="postgresql://zeynab@localhost:5432/restaurant_db" uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

If you don’t have a virtual env yet:

```bash
cd restaurant-reservation-system/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3) Start frontend (Terminal 2)

```bash
cd restaurant-reservation-system/frontend
npm install
npm run dev
```

### 4) Open app

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

---

## Docker workflow (optional)

From `restaurant-reservation-system/`:

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Postgres: `postgres:postgres@localhost:5432/restaurant_db`

Useful commands:

```bash
docker compose down
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

Reset Docker DB volume:

```bash
docker compose down -v
docker compose up --build
```

---

## Seed behavior (on backend startup)

On startup, backend runs `init_db()` + `seed_db()`.

- Creates schema tables if missing.
- Inserts data only when relevant tables are empty (safe for repeated restarts).
- Seeds:
	- 14 Baku locations
	- 49 restaurants
	- restaurant-specific table layouts (hundreds of tables)
	- 1 super admin + 1 admin per restaurant

If you want a **fresh reseed**, clear schema then restart backend:

```bash
psql -d restaurant_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## Admin credentials

- Super admin:
	- Email: `admin@admin.com`
	- Password: `admin123`

- Restaurant admins:
	- Password: `admin123`
	- Full list: see `ADMIN_CREDENTIALS.md`

---

## Demo links (local)

- Home (district picker): http://localhost:3000
- Restaurants list example: http://localhost:3000/restaurants?location_id=1&location_name=Sahil
- Restaurant detail example: http://localhost:3000/restaurant/2
- Admin panel: http://localhost:3000/admin
- Backend Swagger: http://localhost:8000/docs
- Backend ReDoc: http://localhost:8000/redoc

---

## Core API endpoints

Public:

- `GET /locations`
- `GET /restaurants?location_id=<id>`
- `GET /restaurants/{id}`
- `GET /restaurants/{id}/tables`
- `GET /restaurants/{id}/availability?date=YYYY-MM-DD`
- `POST /reservations`

Admin:

- `POST /admin/login`
- `GET /admin/reservations`
- `PATCH /admin/reservations/{id}`
- `POST /admin/table-blocks`
- `POST /admin/tables`
- `PATCH /admin/tables/{id}`
- `DELETE /admin/tables/{id}`
- `PATCH /admin/tables/{id}/status`

---

## Common issues & quick fixes

### Frontend 500 with missing webpack chunk (e.g. `Cannot find module './329.js'`)

```bash
cd restaurant-reservation-system/frontend
rm -rf .next
npm run dev
```

### Port already in use

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
```

### `uvicorn: command not found`

Use venv activation or python module form:

```bash
cd restaurant-reservation-system/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

