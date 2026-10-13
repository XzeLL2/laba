from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.schemas.customer import CustomerOut


class OrderBase(BaseModel):
    customer_id: int
    contact_person: Optional[str] = None
    external_number: Optional[str] = None
    external_date: Optional[datetime] = None
    object_name: str
    sample_count: int = 1
    address: Optional[str] = None
    payer: Optional[str] = None
    planned_date: Optional[datetime] = None
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    customer_id: Optional[int] = None
    contact_person: Optional[str] = None
    external_number: Optional[str] = None
    external_date: Optional[datetime] = None
    object_name: Optional[str] = None
    sample_count: Optional[int] = None
    address: Optional[str] = None
    payer: Optional[str] = None
    planned_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class OrderOut(OrderBase):
    id: int
    number: str
    status: str
    author_id: int
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerOut] = None

    model_config = {"from_attributes": True}


class OrderFilter(BaseModel):
    q: Optional[str] = None
    customer: Optional[str] = None
    object_name: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
