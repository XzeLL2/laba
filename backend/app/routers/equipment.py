from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import Equipment
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate, EquipmentOut
from app.routers.auth import get_current_employee

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("/", response_model=list[EquipmentOut])
async def list_equipment(
    q: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    query = select(Equipment).where(Equipment.is_active == True)
    if q:
        query = query.where(
            Equipment.name.ilike(f"%{q}%")
            | Equipment.type.ilike(f"%{q}%")
            | Equipment.serial_number.ilike(f"%{q}%")
        )
    query = query.order_by(Equipment.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=EquipmentOut, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    data: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    equipment = Equipment(**data.model_dump())
    db.add(equipment)
    await db.commit()
    await db.refresh(equipment)
    return equipment


@router.patch("/{equipment_id}", response_model=EquipmentOut)
async def update_equipment(
    equipment_id: int,
    data: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equipment = result.scalar_one_or_none()
    if not equipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Оборудование не найдено")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(equipment, field, value)
    await db.commit()
    await db.refresh(equipment)
    return equipment


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equipment = result.scalar_one_or_none()
    if not equipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Оборудование не найдено")
    equipment.is_active = False
    await db.commit()
