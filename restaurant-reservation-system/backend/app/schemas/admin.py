from pydantic import BaseModel
from typing import Optional


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    restaurant_id: Optional[int] = None
    restaurant_name: Optional[str] = None
    is_super_admin: bool = False
