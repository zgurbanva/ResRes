from pydantic import BaseModel
from typing import Optional


class LocationOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
