from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.locations import router as locations_router
from app.api.restaurants import router as restaurants_router
from app.api.reservations import router as reservations_router
from app.api.admin import router as admin_router
from app.db.init_db import init_db, seed_db

app = FastAPI(title="Restaurant Reservation System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(locations_router, tags=["Locations"])
app.include_router(restaurants_router, tags=["Restaurants"])
app.include_router(reservations_router, tags=["Reservations"])
app.include_router(admin_router, tags=["Admin"])


@app.on_event("startup")
def on_startup():
    init_db()
    seed_db()


@app.get("/")
def root():
    return {"message": "Restaurant Reservation System API"}
