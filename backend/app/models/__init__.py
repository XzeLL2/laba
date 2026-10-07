from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class EmployeeRole(str, enum.Enum):
    ENGINEER = "engineer"
    ADMIN = "admin"
    MANAGER = "manager"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(EmployeeRole), nullable=False, default=EmployeeRole.ENGINEER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    uploaded_files = relationship("ServerFile", foreign_keys="ServerFile.uploader_id", back_populates="uploader")


class ServerFile(Base):
    __tablename__ = "server_files"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100))
    uploaded_at = Column(DateTime, default=func.now())
    uploader_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    can_download = Column(Boolean, default=False)
    can_upload = Column(Boolean, default=False)

    uploader = relationship("Employee", back_populates="uploaded_files", foreign_keys=[uploader_id])
