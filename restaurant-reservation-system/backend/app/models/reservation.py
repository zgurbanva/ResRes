from sqlalchemy import Column, Integer, String, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from app.db.session import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    user_name = Column(String, nullable=False)
    user_phone = Column(String, nullable=True)
    user_email = Column(String, nullable=True)
    preorder_note = Column(String, nullable=True)
    status = Column(String, nullable=False, default="confirmed")  # confirmed, cancelled, declined

    table = relationship("Table", back_populates="reservations")
    restaurant = relationship("Restaurant", back_populates="reservations")
