from pydantic import BaseModel
from typing import Optional


class RestaurantOut(BaseModel):
    id: int
    name: str
    location_id: int
    address: Optional[str] = None
    phone: Optional[str] = None
    floor_shape: Optional[str] = None

    class Config:
        from_attributes = True


class RestaurantUpdate(BaseModel):
    floor_shape: Optional[str] = None
