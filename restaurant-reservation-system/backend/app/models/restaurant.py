from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    floor_shape = Column(Text, nullable=True)  # JSON string: SVG path or polygon points for restaurant outline

    location = relationship("Location", back_populates="restaurants")
    tables = relationship("Table", back_populates="restaurant", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="restaurant")
    table_blocks = relationship("TableBlock", back_populates="restaurant")
