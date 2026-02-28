from pydantic import BaseModel
from typing import Optional
import datetime


class TableBlockCreate(BaseModel):
    table_id: int
    restaurant_id: int
    date: datetime.date
    start_time: datetime.time
    end_time: datetime.time
    reason: Optional[str] = None


class TableBlockOut(BaseModel):
    id: int
    table_id: int
    restaurant_id: int
    date: datetime.date
    start_time: datetime.time
    end_time: datetime.time
    reason: Optional[str] = None

    class Config:
        from_attributes = True
