from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import Method
from app.schemas.method import MethodCreate, MethodUpdate, MethodOut
from app.routers.auth import get_current_employee

router = APIRouter(prefix="/methods", tags=["methods"])


@router.get("/", response_model=list[MethodOut])
async def list_methods(
    q: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    query = select(Method).where(Method.is_active == True)
    if q:
        query = query.where(Method.name.ilike(f"%{q}%") | Method.code.ilike(f"%{q}%"))
    query = query.order_by(Method.code)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=MethodOut, status_code=status.HTTP_201_CREATED)
async def create_method(
    data: MethodCreate,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    method = Method(**data.model_dump())
    db.add(method)
    await db.commit()
    await db.refresh(method)
    return method


@router.patch("/{method_id}", response_model=MethodOut)
async def update_method(
    method_id: int,
    data: MethodUpdate,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Method).where(Method.id == method_id))
    method = result.scalar_one_or_none()
    if not method:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Методика не найдена")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(method, field, value)
    await db.commit()
    await db.refresh(method)
    return method


@router.delete("/{method_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_method(
    method_id: int,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Method).where(Method.id == method_id))
    method = result.scalar_one_or_none()
    if not method:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Методика не найдена")
    method.is_active = False
    await db.commit()
