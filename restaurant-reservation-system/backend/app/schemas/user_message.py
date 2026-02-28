from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserMessageCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str


class UserMessageOut(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True
