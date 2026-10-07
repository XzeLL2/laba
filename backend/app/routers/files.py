from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import ServerFile, Employee
from app.schemas.file import ServerFileCreate, ServerFileOut
from app.routers.auth import get_current_employee, require_admin
from app.config import settings
import os
import uuid
import aiofiles
import magic

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/", response_model=list[ServerFileOut])
async def list_files(
    db: AsyncSession = Depends(get_db),
    current: Employee = Depends(get_current_employee),
):
    query = select(ServerFile).order_by(ServerFile.uploaded_at.desc())
    if current.role != EmployeeRole.ADMIN:
        query = query.where((ServerFile.can_download == True) | (ServerFile.uploader_id == current.id))
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/upload", response_model=ServerFileOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    can_download: bool = Query(False),
    can_upload: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current: Employee = Depends(get_current_employee),
):
    storage = settings.storage_path
    os.makedirs(storage, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(storage, unique_name)
    content = await file.read()
    mime = magic.from_buffer(content, mime=True)
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
    server_file = ServerFile(
        file_name=file.filename,
        file_path=file_path,
        file_size=len(content),
        mime_type=mime,
        uploader_id=current.id,
        can_download=can_download,
        can_upload=can_upload,
    )
    db.add(server_file)
    await db.commit()
    await db.refresh(server_file)
    return server_file


@router.get("/{file_id}", response_model=ServerFileOut)
async def get_file_info(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current: Employee = Depends(get_current_employee),
):
    result = await db.execute(select(ServerFile).where(ServerFile.id == file_id))
    server_file = result.scalar_one_or_none()
    if not server_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")
    if current.role != EmployeeRole.ADMIN and not server_file.can_download and server_file.uploader_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    return server_file


@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current: Employee = Depends(get_current_employee),
):
    result = await db.execute(select(ServerFile).where(ServerFile.id == file_id))
    server_file = result.scalar_one_or_none()
    if not server_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")
    if current.role != EmployeeRole.ADMIN and not server_file.can_download and server_file.uploader_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    from fastapi.responses import FileResponse
    return FileResponse(path=server_file.file_path, filename=server_file.file_name, media_type=server_file.mime_type or "application/octet-stream")


@router.patch("/{file_id}", response_model=ServerFileOut)
async def update_file(
    file_id: int,
    data: ServerFileCreate,
    db: AsyncSession = Depends(get_db),
    _: Employee = Depends(require_admin),
):
    result = await db.execute(select(ServerFile).where(ServerFile.id == file_id))
    server_file = result.scalar_one_or_none()
    if not server_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")
    server_file.can_download = data.can_download
    server_file.can_upload = data.can_upload
    await db.commit()
    await db.refresh(server_file)
    return server_file


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    _: Employee = Depends(require_admin),
):
    result = await db.execute(select(ServerFile).where(ServerFile.id == file_id))
    server_file = result.scalar_one_or_none()
    if not server_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")
    if os.path.exists(server_file.file_path):
        os.remove(server_file.file_path)
    await db.delete(server_file)
    await db.commit()
