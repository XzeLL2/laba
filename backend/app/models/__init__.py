from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, JSON
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
    position = Column(String(255))
    role = Column(Enum(EmployeeRole), nullable=False, default=EmployeeRole.ENGINEER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    uploaded_attachments = relationship(
        "Attachment", foreign_keys="Attachment.uploader_id", back_populates="uploader"
    )
    orders = relationship("Order", back_populates="author")
    protocols = relationship("Protocol", back_populates="author")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    contact_person = Column(String(255))
    contact_phone = Column(String(100))
    contact_email = Column(String(255))
    address = Column(String(500))
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    orders = relationship("Order", back_populates="customer")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    contact_person = Column(String(255))
    external_number = Column(String(100))
    external_date = Column(DateTime)
    object_name = Column(String(255), nullable=False)
    sample_count = Column(Integer, default=1)
    address = Column(String(500))
    payer = Column(String(255))
    planned_date = Column(DateTime)
    notes = Column(Text)
    status = Column(String(50), nullable=False, default="new")
    author_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="orders")
    author = relationship("Employee", back_populates="orders")
    protocols = relationship("Protocol", back_populates="order")
    attachments = relationship(
        "Attachment",
        foreign_keys="Attachment.order_id",
        back_populates="order",
        cascade="all, delete-orphan",
    )


class Protocol(Base):
    __tablename__ = "protocols"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(50), unique=True, nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    status = Column(String(50), nullable=False, default="draft")
    snapshot = Column(Text)
    result = Column(Text)
    author_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    order = relationship("Order", back_populates="protocols")
    author = relationship("Employee", back_populates="protocols")
    methods = relationship("Method", secondary="protocol_methods", back_populates="protocols")
    attachments = relationship(
        "Attachment",
        foreign_keys="Attachment.protocol_id",
        back_populates="protocol",
        cascade="all, delete-orphan",
    )


class ProtocolMethod(Base):
    __tablename__ = "protocol_methods"

    protocol_id = Column(Integer, ForeignKey("protocols.id"), primary_key=True)
    method_id = Column(Integer, ForeignKey("methods.id"), primary_key=True)


class Method(Base):
    __tablename__ = "methods"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    version = Column(String(20), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    protocols = relationship(
        "Protocol", secondary="protocol_methods", back_populates="methods"
    )


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(100))
    serial_number = Column(String(100))
    calibration_date = Column(DateTime)
    next_calibration = Column(DateTime)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    checksum = Column(String(64), nullable=False)
    mime_type = Column(String(100))
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    protocol_id = Column(Integer, ForeignKey("protocols.id"), nullable=True)
    uploaded_at = Column(DateTime, default=func.now())
    uploader_id = Column(Integer, ForeignKey("employees.id"), nullable=False)

    uploader = relationship("Employee", back_populates="uploaded_attachments")
    order = relationship("Order", back_populates="attachments", foreign_keys=[order_id])
    protocol = relationship("Protocol", back_populates="attachments", foreign_keys=[protocol_id])


class Counter(Base):
    __tablename__ = "counters"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), unique=True, nullable=False)
    prefix = Column(String(20), nullable=False)
    year = Column(Integer, nullable=False)
    last_number = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


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

    uploader = relationship("Employee", foreign_keys=[uploader_id])
