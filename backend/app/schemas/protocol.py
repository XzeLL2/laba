from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.schemas.method import MethodOut


class ProtocolBase(BaseModel):
    method_ids: List[int] = []
    result: Optional[str] = None


class ProtocolCreate(ProtocolBase):
    order_id: Optional[int] = None


class ProtocolUpdate(BaseModel):
    status: Optional[str] = None
    method_ids: Optional[List[int]] = None
    result: Optional[str] = None


class ProtocolOut(ProtocolBase):
    id: int
    number: str
    status: str
    snapshot: Optional[str]
    author_id: int
    created_at: datetime
    updated_at: datetime
    methods: List[MethodOut] = []

    model_config = {"from_attributes": True}
