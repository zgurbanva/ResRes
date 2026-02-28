from pydantic import BaseModel


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
