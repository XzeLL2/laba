import os
import hashlib
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import Attachment, Order, Protocol
from app.schemas.attachment import AttachmentOut
from app.routers.auth import get_current_employee
from app.config import settings
import aiofiles
import magic

router = APIRouter(prefix="/attachments", tags=["attachments"])


def compute_checksum(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


async def get_entity_path(entity_type: str, entity_id: int, db: AsyncSession) -> str:
    if entity_type == "order":
        result = await db.execute(select(Order).where(Order.id == entity_id))
        order = result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")
        return os.path.join(settings.storage_path, "orders", order.number)
    elif entity_type == "protocol":
        result = await db.execute(select(Protocol).where(Protocol.id == entity_id))
        protocol = result.scalar_one_or_none()
        if not protocol:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Протокол не найден")
        return os.path.join(settings.storage_path, "protocols", protocol.number)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неизвестный тип сущности")


@router.get("/{entity_type}/{entity_id}", response_model=list[AttachmentOut])
async def list_attachments(
    entity_type: str,
    entity_id: int,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    query = select(Attachment).where(
        Attachment.entity_type == entity_type,
        Attachment.entity_id == entity_id,
    ).order_by(Attachment.uploaded_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{entity_type}/{entity_id}", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    entity_type: str,
    entity_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    base_path = await get_entity_path(entity_type, entity_id, db)
    os.makedirs(base_path, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(base_path, unique_name)
    relative_path = os.path.relpath(file_path, settings.storage_path)

    content = await file.read()
    checksum = compute_checksum(content)
    mime = magic.from_buffer(content, mime=True)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    attachment = Attachment(
        file_name=file.filename,
        file_path=relative_path,
        file_size=len(content),
        checksum=checksum,
        mime_type=mime,
        entity_type=entity_type,
        entity_id=entity_id,
        uploader_id=current.id,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return attachment


@router.get("/{entity_type}/{entity_id}/{attachment_id}/download")
async def download_attachment(
    entity_type: str,
    entity_id: int,
    attachment_id: int,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(
        select(Attachment).where(
            Attachment.id == attachment_id,
            Attachment.entity_type == entity_type,
            Attachment.entity_id == entity_id,
        )
    )
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Вложение не найдено")

    full_path = os.path.join(settings.storage_path, attachment.file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")

    return FileResponse(
        path=full_path,
        filename=attachment.file_name,
        media_type=attachment.mime_type or "application/octet-stream",
    )


@router.delete("/{entity_type}/{entity_id}/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    entity_type: str,
    entity_id: int,
    attachment_id: int,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(
        select(Attachment).where(
            Attachment.id == attachment_id,
            Attachment.entity_type == entity_type,
            Attachment.entity_id == entity_id,
        )
    )
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Вложение не найдено")

    full_path = os.path.join(settings.storage_path, attachment.file_path)
    if os.path.exists(full_path):
        os.remove(full_path)

    await db.delete(attachment)
    await db.commit()
