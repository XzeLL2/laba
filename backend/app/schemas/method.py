from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MethodBase(BaseModel):
    code: str
    name: str
    version: str
    description: Optional[str] = None


class MethodCreate(MethodBase):
    pass


class MethodUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class MethodOut(MethodBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
