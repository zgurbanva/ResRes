from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.location import Location
from app.schemas.location import LocationOut

router = APIRouter()


@router.get("/locations", response_model=List[LocationOut])
def get_locations(db: Session = Depends(get_db)):
    return db.query(Location).all()
