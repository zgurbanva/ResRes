from pydantic import BaseModel
from typing import Optional
import datetime


class ReservationCreate(BaseModel):
    table_id: int
    restaurant_id: int
    date: datetime.date
    start_time: datetime.time
    end_time: datetime.time
    user_name: str
    user_phone: str
    user_email: str
    preorder_note: Optional[str] = None


class ReservationOut(BaseModel):
    id: int
    table_id: int
    restaurant_id: int
    date: datetime.date
    start_time: datetime.time
    end_time: datetime.time
    user_name: str
    user_phone: Optional[str] = None
    user_email: Optional[str] = None
    preorder_note: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class ReservationUpdate(BaseModel):
    status: str  # confirmed, cancelled, declined
