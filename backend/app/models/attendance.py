from sqlalchemy import Column, Integer, String, Date, Time, Float, Text, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    attendance_date = Column(Date, nullable=False, index=True)
    status = Column(String, nullable=False)
    check_in = Column(Time, nullable=True)
    check_out = Column(Time, nullable=True)
    shift = Column(String, nullable=True)
    overtime_hours = Column(Float, default=0.0)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Ensure one attendance record per worker per day
    __table_args__ = (
        UniqueConstraint('worker_id', 'attendance_date', name='uq_worker_attendance_date'),
    )

    worker = relationship("Worker", backref="attendance_records")
