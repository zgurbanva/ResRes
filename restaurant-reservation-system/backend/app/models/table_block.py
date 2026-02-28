from sqlalchemy import Column, Integer, String, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from app.db.session import Base


class TableBlock(Base):
    __tablename__ = "table_blocks"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    reason = Column(String, nullable=True)

    table = relationship("Table", back_populates="blocks")
    restaurant = relationship("Restaurant", back_populates="table_blocks")
