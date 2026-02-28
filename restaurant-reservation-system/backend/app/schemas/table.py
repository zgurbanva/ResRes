from pydantic import BaseModel
from typing import Optional


class TableCreate(BaseModel):
    restaurant_id: int
    name: str
    capacity: int = 4
    position_x: int = 0
    position_y: int = 0
    width: int = 100
    height: int = 80
    shape: str = "rect"
    zone: Optional[str] = None


class TableUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    shape: Optional[str] = None
    zone: Optional[str] = None


class TableOut(BaseModel):
    id: int
    restaurant_id: int
    name: str
    capacity: int
    position_x: int
    position_y: int
    width: int
    height: int
    shape: str
    zone: Optional[str] = None

    class Config:
        from_attributes = True


class TableAvailability(BaseModel):
    id: int
    restaurant_id: int
    name: str
    capacity: int
    position_x: int
    position_y: int
    width: int
    height: int
    shape: str
    zone: Optional[str] = None
    status: str  # available, reserved, blocked

    class Config:
        from_attributes = True
