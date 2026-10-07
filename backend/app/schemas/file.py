from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ServerFileBase(BaseModel):
    file_name: str
    file_size: int
    mime_type: Optional[str] = None
    can_download: bool = False
    can_upload: bool = False


class ServerFileOut(ServerFileBase):
    id: int
    file_path: str
    uploaded_at: datetime
    uploader_id: int

    model_config = {"from_attributes": True}


class ServerFileCreate(BaseModel):
    can_download: bool = False
    can_upload: bool = False
