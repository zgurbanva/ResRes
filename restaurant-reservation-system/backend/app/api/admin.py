from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.reservation import Reservation
from app.models.table_block import TableBlock
from app.models.table import Table
from app.models.restaurant import Restaurant
from app.schemas.admin import AdminLogin, AdminToken
from app.schemas.reservation import ReservationOut, ReservationUpdate
from app.schemas.table_block import TableBlockCreate, TableBlockOut
from app.schemas.table import TableCreate, TableUpdate, TableOut
from app.schemas.restaurant import RestaurantUpdate, RestaurantOut
from app.core.security import verify_password, create_access_token, get_current_admin
from app.services.availability import check_time_overlap

router = APIRouter(prefix="/admin")


@router.post("/login", response_model=AdminToken)
def admin_login(data: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == data.email).first()
    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": admin.email, "role": admin.role})
    return AdminToken(access_token=token)


@router.post("/table-blocks", response_model=TableBlockOut, status_code=201)
def create_table_block(
    data: TableBlockCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    if data.start_time >= data.end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time")

    # Check for conflicts with existing reservations
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
            detail="Time conflict with an existing reservation or block",
        )

    block = TableBlock(
        table_id=data.table_id,
        restaurant_id=data.restaurant_id,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        reason=data.reason,
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return block


@router.get("/reservations", response_model=List[ReservationOut])
def get_reservations(
    restaurant_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    query = db.query(Reservation)
    if restaurant_id:
        query = query.filter(Reservation.restaurant_id == restaurant_id)
    return query.order_by(Reservation.date.desc(), Reservation.start_time.desc()).all()


@router.patch("/reservations/{reservation_id}", response_model=ReservationOut)
def update_reservation(
    reservation_id: int,
    data: ReservationUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if data.status not in ("confirmed", "cancelled", "declined"):
        raise HTTPException(status_code=400, detail="Invalid status")

    reservation.status = data.status
    db.commit()
    db.refresh(reservation)
    return reservation


# ─── Table CRUD ──────────────────────────────────────────────────

@router.post("/tables", response_model=TableOut, status_code=201)
def create_table(
    data: TableCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == data.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    table = Table(
        restaurant_id=data.restaurant_id,
        name=data.name,
        capacity=data.capacity,
        position_x=data.position_x,
        position_y=data.position_y,
        width=data.width,
        height=data.height,
        shape=data.shape,
        zone=data.zone,
    )
    db.add(table)
    db.commit()
    db.refresh(table)
    return table


@router.patch("/tables/{table_id}", response_model=TableOut)
def update_table(
    table_id: int,
    data: TableUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(table, key, value)

    db.commit()
    db.refresh(table)
    return table


@router.delete("/tables/{table_id}", status_code=204)
def delete_table(
    table_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    db.delete(table)
    db.commit()
    return None


# ─── Restaurant floor shape ─────────────────────────────────────

@router.patch("/restaurants/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant_floor(
    restaurant_id: int,
    data: RestaurantUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if data.floor_shape is not None:
        restaurant.floor_shape = data.floor_shape

    db.commit()
    db.refresh(restaurant)
    return restaurant
