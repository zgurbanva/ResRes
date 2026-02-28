from sqlalchemy.orm import Session
from sqlalchemy import and_
import datetime

from app.models.reservation import Reservation
from app.models.table_block import TableBlock


def check_time_overlap(
    db: Session,
    table_id: int,
    date: datetime.date,
    start_time: datetime.time,
    end_time: datetime.time,
    exclude_reservation_id: int = None,
) -> bool:
    """
    Returns True if there is a time conflict (overlap) for the given table on a date.
    Checks both reservations and table blocks.
    """
    # Check reservation overlaps
    reservation_query = db.query(Reservation).filter(
        and_(
            Reservation.table_id == table_id,
            Reservation.date == date,
            Reservation.status != "cancelled",
            Reservation.status != "declined",
            Reservation.start_time < end_time,
            Reservation.end_time > start_time,
        )
    )
    if exclude_reservation_id:
        reservation_query = reservation_query.filter(Reservation.id != exclude_reservation_id)

    if reservation_query.first():
        return True

    # Check table block overlaps
    block_query = db.query(TableBlock).filter(
        and_(
            TableBlock.table_id == table_id,
            TableBlock.date == date,
            TableBlock.start_time < end_time,
            TableBlock.end_time > start_time,
        )
    )
    if block_query.first():
        return True

    return False


def get_table_status(
    db: Session,
    table_id: int,
    date: datetime.date,
    table_obj=None,
) -> str:
    """
    Returns the status of a table for a given date.
    If the admin has set a manual status for this date, that takes priority.
    Otherwise shows 'reserved' if any confirmed reservation exists,
    and 'blocked' if any block exists.
    """
    # Check manual status override (set by admin)
    if table_obj is None:
        from app.models.table import Table
        table_obj = db.query(Table).filter(Table.id == table_id).first()
    if table_obj and table_obj.manual_status and table_obj.manual_status_date == str(date):
        status_map = {"occupied": "reserved", "empty": "available", "blocked": "blocked"}
        return status_map.get(table_obj.manual_status, table_obj.manual_status)

    # Check if blocked (any block on that date)
    block = db.query(TableBlock).filter(
        and_(
            TableBlock.table_id == table_id,
            TableBlock.date == date,
        )
    ).first()
    if block:
        return "blocked"

    # Check if reserved (any confirmed reservation on that date)
    reservation = db.query(Reservation).filter(
        and_(
            Reservation.table_id == table_id,
            Reservation.date == date,
            Reservation.status == "confirmed",
        )
    ).first()
    if reservation:
        return "reserved"

    return "available"
