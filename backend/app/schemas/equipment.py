from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EquipmentBase(BaseModel):
    name: str
    type: Optional[str] = None
    serial_number: Optional[str] = None


class EquipmentCreate(EquipmentBase):
    calibration_date: Optional[datetime] = None
    next_calibration: Optional[datetime] = None


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    serial_number: Optional[str] = None
    calibration_date: Optional[datetime] = None
    next_calibration: Optional[datetime] = None
    is_active: Optional[bool] = None


class EquipmentOut(EquipmentBase):
    id: int
    calibration_date: Optional[datetime]
    next_calibration: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
