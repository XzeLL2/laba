from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models import EmployeeRole


class EmployeeBase(BaseModel):
    login: str
    full_name: str
    role: EmployeeRole


class EmployeeCreate(EmployeeBase):
    password: str = Field(min_length=6)


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[EmployeeRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)


class EmployeeOut(EmployeeBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    login: str
    password: str
