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
from pydantic import BaseModel

router = APIRouter(prefix="/admin")


@router.post("/login", response_model=AdminToken)
def admin_login(data: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == data.email).first()
    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    is_super = admin.restaurant_id is None
    token = create_access_token({
        "sub": admin.email,
        "role": admin.role,
        "restaurant_id": admin.restaurant_id,
    })
    restaurant_name = None
    if admin.restaurant_id:
        rest = db.query(Restaurant).filter(Restaurant.id == admin.restaurant_id).first()
        restaurant_name = rest.name if rest else None
    return AdminToken(
        access_token=token,
        restaurant_id=admin.restaurant_id,
        restaurant_name=restaurant_name,
        is_super_admin=is_super,
    )


@router.post("/table-blocks", response_model=TableBlockOut, status_code=201)
def create_table_block(
    data: TableBlockCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    admin_rest_id = admin.get("restaurant_id")
    if admin_rest_id is not None and admin_rest_id != data.restaurant_id:
        raise HTTPException(status_code=403, detail="You can only manage your own restaurant")
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
    admin_rest_id = admin.get("restaurant_id")
    query = db.query(Reservation)
    if admin_rest_id is not None:
        # Restaurant admin can only see their own reservations
        query = query.filter(Reservation.restaurant_id == admin_rest_id)
    elif restaurant_id:
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
    admin_rest_id = admin.get("restaurant_id")
    if admin_rest_id is not None and reservation.restaurant_id != admin_rest_id:
        raise HTTPException(status_code=403, detail="You can only manage your own restaurant")

    if data.status not in ("confirmed", "cancelled", "declined"):
        raise HTTPException(status_code=400, detail="Invalid status")

    reservation.status = data.status

    # When declining/cancelling, clear manual_status on the table if no more
    # confirmed reservations remain for that date so the table shows as empty
    if data.status in ("declined", "cancelled"):
        from app.models.table import Table as TableModel
        remaining = db.query(Reservation).filter(
            Reservation.table_id == reservation.table_id,
            Reservation.date == reservation.date,
            Reservation.status == "confirmed",
            Reservation.id != reservation.id,
        ).count()
        if remaining == 0:
            table_obj = db.query(TableModel).filter(TableModel.id == reservation.table_id).first()
            if table_obj and table_obj.manual_status and table_obj.manual_status_date == str(reservation.date):
                table_obj.manual_status = None
                table_obj.manual_status_date = None

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
    admin_rest_id = admin.get("restaurant_id")
    if admin_rest_id is not None and admin_rest_id != data.restaurant_id:
        raise HTTPException(status_code=403, detail="You can only manage your own restaurant")
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
    admin_rest_id = admin.get("restaurant_id")
    if admin_rest_id is not None and table.restaurant_id != admin_rest_id:
        raise HTTPException(status_code=403, detail="You can only manage your own restaurant")

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
    admin_rest_id = admin.get("restaurant_id")
    if admin_rest_id is not None and table.restaurant_id != admin_rest_id:
        raise HTTPException(status_code=403, detail="You can only manage your own restaurant")

    db.delete(table)
    db.commit()
    return None


# ─── Table status (occupied / empty / blocked) ──────────────────

class TableStatusUpdate(BaseModel):
    status: str  # "occupied", "empty", "blocked"
    date: str    # "YYYY-MM-DD"


@router.patch("/tables/{table_id}/status")
def set_table_status(
    table_id: int,
    data: TableStatusUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    admin_rest_id = admin.get("restaurant_id")
    if admin_rest_id is not None and table.restaurant_id != admin_rest_id:
        raise HTTPException(status_code=403, detail="You can only manage your own restaurant")
    if data.status not in ("occupied", "empty", "blocked"):
        raise HTTPException(status_code=400, detail="Status must be occupied, empty, or blocked")

    import datetime
    target_date = datetime.date.fromisoformat(data.date)

    cancelled_count = 0
    removed_blocks = 0

    if data.status == "empty":
        # Cancel all confirmed reservations for this table on this date
        reservations = db.query(Reservation).filter(
            Reservation.table_id == table_id,
            Reservation.date == target_date,
            Reservation.status == "confirmed",
        ).all()
        for r in reservations:
            r.status = "cancelled"
            cancelled_count += 1

        # Remove all blocks for this table on this date
        blocks = db.query(TableBlock).filter(
            TableBlock.table_id == table_id,
            TableBlock.date == target_date,
        ).all()
        for b in blocks:
            db.delete(b)
            removed_blocks += 1

    elif data.status == "blocked":
        # Cancel all confirmed reservations for this table on this date
        reservations = db.query(Reservation).filter(
            Reservation.table_id == table_id,
            Reservation.date == target_date,
            Reservation.status == "confirmed",
        ).all()
        for r in reservations:
            r.status = "cancelled"
            cancelled_count += 1

    table.manual_status = data.status
    table.manual_status_date = data.date
    db.commit()
    db.refresh(table)
    return {
        "ok": True,
        "table_id": table.id,
        "status": data.status,
        "date": data.date,
        "cancelled_reservations": cancelled_count,
        "removed_blocks": removed_blocks,
    }


# ─── Restaurant floor shape ─────────────────────────────────────

@router.patch("/restaurants/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant_floor(
    restaurant_id: int,
    data: RestaurantUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    admin_rest_id = admin.get("restaurant_id")
    if admin_rest_id is not None and admin_rest_id != restaurant_id:
        raise HTTPException(status_code=403, detail="You can only manage your own restaurant")
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if data.floor_shape is not None:
        restaurant.floor_shape = data.floor_shape

    db.commit()
    db.refresh(restaurant)
    return restaurant
