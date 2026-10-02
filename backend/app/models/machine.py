from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    machine_code = Column(String, unique=True, index=True, nullable=False)
    machine_name = Column(String, nullable=False)
    machine_type = Column(String, nullable=False)
    department = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)
    installation_date = Column(Date, nullable=True)
    status = Column(String, nullable=False, default="Available")
    condition = Column(String, nullable=False, default="Good")
    current_operator_id = Column(Integer, ForeignKey("workers.id", ondelete="SET NULL"), nullable=True)
    last_maintenance_date = Column(Date, nullable=True)
    next_maintenance_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    current_operator = relationship("Worker", backref="assigned_machines")
    history = relationship("MachineStatusHistory", backref="machine", cascade="all, delete-orphan")


class MachineStatusHistory(Base):
    __tablename__ = "machine_status_history"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    previous_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    reason = Column(Text, nullable=True)
    downtime_minutes = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
