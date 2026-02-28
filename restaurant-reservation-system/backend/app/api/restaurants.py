from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.db.session import get_db
from app.models.restaurant import Restaurant
from app.models.table import Table
from app.schemas.restaurant import RestaurantOut
from app.schemas.table import TableOut, TableAvailability
from app.services.availability import get_table_status

router = APIRouter()


@router.get("/restaurants", response_model=List[RestaurantOut])
def get_restaurants(location_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Restaurant)
    if location_id:
        query = query.filter(Restaurant.location_id == location_id)
    return query.all()


@router.get("/restaurants/{restaurant_id}", response_model=RestaurantOut)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


@router.get("/restaurants/{restaurant_id}/tables", response_model=List[TableOut])
def get_tables(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return db.query(Table).filter(Table.restaurant_id == restaurant_id).all()


@router.get("/restaurants/{restaurant_id}/availability", response_model=List[TableAvailability])
def get_availability(
    restaurant_id: int,
    date: datetime.date = Query(...),
    db: Session = Depends(get_db),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    tables = db.query(Table).filter(Table.restaurant_id == restaurant_id).all()
    result = []
    for table in tables:
        status = get_table_status(db, table.id, date)
        result.append(
            TableAvailability(
                id=table.id,
                restaurant_id=table.restaurant_id,
                name=table.name,
                capacity=table.capacity,
                position_x=table.position_x,
                position_y=table.position_y,
                width=table.width,
                height=table.height,
                shape=table.shape,
                zone=table.zone,
                status=status,
            )
        )
    return result
