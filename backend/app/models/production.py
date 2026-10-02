from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey, func, Float, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class Production(Base):
    __tablename__ = "production"

    id = Column(Integer, primary_key=True, index=True)
    production_code = Column(String, unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False)
    department = Column(String, nullable=False)
    planned_start_date = Column(Date, nullable=False)
    planned_end_date = Column(Date, nullable=False)
    actual_start_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)
    target_quantity = Column(Integer, nullable=False)
    completed_quantity = Column(Integer, default=0)
    rejected_quantity = Column(Integer, default=0)
    remaining_quantity = Column(Integer, nullable=False)
    status = Column(String, default="Planned")
    progress_percentage = Column(Float, default=0.0)
    priority = Column(String, nullable=True)
    supervisor_id = Column(Integer, ForeignKey("workers.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    order = relationship("Order", backref="production_plans")
    supervisor = relationship("Worker", backref="supervised_productions")
    stages = relationship("ProductionStage", back_populates="production", cascade="all, delete-orphan")
    updates = relationship("ProductionUpdate", back_populates="production", cascade="all, delete-orphan")
    workers = relationship("ProductionWorker", back_populates="production", cascade="all, delete-orphan")
    machines = relationship("ProductionMachine", back_populates="production", cascade="all, delete-orphan")

class ProductionStage(Base):
    __tablename__ = "production_stages"

    id = Column(Integer, primary_key=True, index=True)
    production_id = Column(Integer, ForeignKey("production.id", ondelete="CASCADE"), nullable=False)
    stage_name = Column(String, nullable=False)
    department = Column(String, nullable=True)
    sequence_number = Column(Integer, nullable=False)
    target_quantity = Column(Integer, nullable=False)
    completed_quantity = Column(Integer, default=0)
    rejected_quantity = Column(Integer, default=0)
    status = Column(String, default="Not Started")
    planned_start_date = Column(Date, nullable=True)
    planned_end_date = Column(Date, nullable=True)
    actual_start_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    production = relationship("Production", back_populates="stages")
    updates = relationship("ProductionUpdate", back_populates="stage", cascade="all, delete-orphan")

class ProductionUpdate(Base):
    __tablename__ = "production_updates"

    id = Column(Integer, primary_key=True, index=True)
    production_id = Column(Integer, ForeignKey("production.id", ondelete="CASCADE"), nullable=False)
    stage_id = Column(Integer, ForeignKey("production_stages.id", ondelete="SET NULL"), nullable=True)
    production_date = Column(Date, nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="SET NULL"), nullable=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="SET NULL"), nullable=True)
    quantity_produced = Column(Integer, default=0)
    rejected_quantity = Column(Integer, default=0)
    working_hours = Column(Numeric(5, 2), nullable=True)
    overtime_hours = Column(Numeric(5, 2), default=0)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    production = relationship("Production", back_populates="updates")
    stage = relationship("ProductionStage", back_populates="updates")
    worker = relationship("Worker")
    machine = relationship("Machine")

class ProductionWorker(Base):
    __tablename__ = "production_workers"

    id = Column(Integer, primary_key=True, index=True)
    production_id = Column(Integer, ForeignKey("production.id", ondelete="CASCADE"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    stage_id = Column(Integer, ForeignKey("production_stages.id", ondelete="SET NULL"), nullable=True)
    assigned_date = Column(Date, nullable=True)
    role = Column(String, nullable=True)
    status = Column(String, default="Active")

    production = relationship("Production", back_populates="workers")
    worker = relationship("Worker")
    stage = relationship("ProductionStage")

class ProductionMachine(Base):
    __tablename__ = "production_machines"

    id = Column(Integer, primary_key=True, index=True)
    production_id = Column(Integer, ForeignKey("production.id", ondelete="CASCADE"), nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    stage_id = Column(Integer, ForeignKey("production_stages.id", ondelete="SET NULL"), nullable=True)
    assigned_date = Column(Date, nullable=True)
    status = Column(String, default="Active")

    production = relationship("Production", back_populates="machines")
    machine = relationship("Machine")
    stage = relationship("ProductionStage")
