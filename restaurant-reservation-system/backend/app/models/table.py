from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    name = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False, default=4)
    position_x = Column(Integer, nullable=False, default=0)
    position_y = Column(Integer, nullable=False, default=0)
    width = Column(Integer, nullable=False, default=100)
    height = Column(Integer, nullable=False, default=80)
    shape = Column(String, nullable=False, default="rect")  # rect or circle
    zone = Column(String, nullable=True)  # Window, Front, Patio, Center, Terrace, Bar, VIP, etc.
    manual_status = Column(String, nullable=True)  # null = auto, "occupied", "empty", "blocked"
    manual_status_date = Column(String, nullable=True)  # date the manual status applies to (YYYY-MM-DD)

    restaurant = relationship("Restaurant", back_populates="tables")
    reservations = relationship("Reservation", back_populates="table", cascade="all, delete-orphan")
    blocks = relationship("TableBlock", back_populates="table", cascade="all, delete-orphan")
