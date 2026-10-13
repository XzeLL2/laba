from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_size: int
    checksum: str
    mime_type: Optional[str] = None
    entity_type: str
    entity_id: int


class AttachmentOut(AttachmentBase):
    id: int
    uploaded_at: datetime
    uploader_id: int

    model_config = {"from_attributes": True}
