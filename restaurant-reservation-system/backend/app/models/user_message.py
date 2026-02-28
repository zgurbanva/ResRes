from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.db.session import Base


class UserMessage(Base):
    __tablename__ = "user_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
