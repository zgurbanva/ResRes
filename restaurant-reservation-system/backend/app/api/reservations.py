from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.reservation import Reservation
from app.models.table import Table
from app.schemas.reservation import ReservationCreate, ReservationOut
from app.services.availability import check_time_overlap

router = APIRouter()


@router.post("/reservations", response_model=ReservationOut, status_code=201)
def create_reservation(data: ReservationCreate, db: Session = Depends(get_db)):
    # Validate times
    if data.start_time >= data.end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time")

    # Check if admin has manually set this table as occupied or blocked for this date
    table_obj = db.query(Table).filter(Table.id == data.table_id).first()
    if not table_obj:
        raise HTTPException(status_code=404, detail="Table not found")
    if (
        table_obj.manual_status
        and table_obj.manual_status_date == str(data.date)
        and table_obj.manual_status in ("occupied", "blocked")
    ):
        raise HTTPException(
            status_code=409,
            detail="This table is currently unavailable (set by admin as "
            + table_obj.manual_status
            + ")",
        )

    # Check for time conflicts
    has_conflict = check_time_overlap(
        db,
        table_id=data.table_id,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
    )
    if has_conflict:
        raise HTTPException(
            status_code=409,
            detail="This table is already reserved or blocked for the selected time range",
        )

    reservation = Reservation(
        table_id=data.table_id,
        restaurant_id=data.restaurant_id,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        user_name=data.user_name,
        user_phone=data.user_phone,
        user_email=data.user_email,
        preorder_note=data.preorder_note,
        status="confirmed",
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation
