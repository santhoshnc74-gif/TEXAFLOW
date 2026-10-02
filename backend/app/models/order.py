from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey, func, DECIMAL
from sqlalchemy.orm import relationship
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False)
    product_name = Column(String, nullable=False)
    product_category = Column(String, nullable=True)
    fabric_type = Column(String, nullable=True)
    color = Column(String, nullable=True)
    size_details = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False)
    completed_quantity = Column(Integer, default=0)
    order_date = Column(Date, nullable=False)
    expected_delivery_date = Column(Date, nullable=False)
    actual_delivery_date = Column(Date, nullable=True)
    priority = Column(String, default="Normal")
    status = Column(String, default="Pending")
    unit_price = Column(DECIMAL(10, 2), nullable=True)
    total_amount = Column(DECIMAL(12, 2), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="orders")
