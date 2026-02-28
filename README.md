Restaurant Reservation System
A full-stack web application for restaurant table reservations with interactive floor plans and admin management.

Features
Location-based search — Browse restaurants by city/region
Interactive floor plan — Visual table layout with real-time availability
Table reservation — Select specific table, date, time range, and add pre-order notes
Time conflict protection — Prevents double bookings and respects admin blocks
Admin dashboard — Manage reservations, view floor plans, block tables
Tech Stack
Layer	Technology
Backend	FastAPI, SQLAlchemy, PostgreSQL
Frontend	Next.js 14, React, TypeScript, TailwindCSS
Auth	JWT (python-jose + passlib/bcrypt)
Infra	Docker, Docker Compose
Quick Start (Docker)
cd restaurant-reservation-system
docker compose up --build
Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
Local Development (without Docker)
Prerequisites
Python 3.11+
Node.js 18+
PostgreSQL 15+
Backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set database URL (adjust as needed)
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/restaurant_db

# Create database
createdb restaurant_db

# Run server (auto-creates tables and seeds data on startup)
uvicorn app.main:app --reload --port 8000
Frontend
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
Visit http://localhost:3000

Default Admin Credentials
Field	Value
Email	admin@admin.com
Password	admin123
API Endpoints
Public
Method	Endpoint	Description
GET	/locations	List all locations
GET	/restaurants?location_id=	List restaurants
GET	/restaurants/{id}	Get restaurant details
GET	/restaurants/{id}/tables	Get tables for a restaurant
GET	/restaurants/{id}/availability?date=	Get table availability by date
POST	/reservations	Create a reservation
Admin (JWT required)
Method	Endpoint	Description
POST	/admin/login	Admin login, returns JWT
GET	/admin/reservations	List all reservations
PATCH	/admin/reservations/{id}	Update reservation status
POST	/admin/table-blocks	Block a table
Project Structure
restaurant-reservation-system/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── core/         # Config & security
│   │   ├── db/           # Database session & init
│   │   └── main.py       # FastAPI app entry
│   ├── alembic/          # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/              # Next.js pages (App Router)
│   ├── components/       # React components
│   ├── services/         # API client
│   ├── types/            # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
Seed Data
On first startup, the backend automatically seeds:

3 locations: New York, Los Angeles, Chicago
5 restaurants across those locations
8 tables per restaurant with varied sizes and positions
1 admin user (admin@admin.com / admin123)
