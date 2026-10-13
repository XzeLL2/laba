from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Order, Customer
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut, OrderFilter
from app.services.numbering import get_next_order_number
from app.routers.auth import get_current_employee

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/", response_model=list[OrderOut])
async def list_orders(
    q: Optional[str] = Query(None),
    customer: Optional[str] = Query(None),
    object_name: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    # Convert empty strings to None
    q = q or None
    customer = customer or None
    object_name = object_name or None
    status_filter = status_filter or None
    
    # Parse datetime strings
    from datetime import datetime
    parsed_date_from = None
    parsed_date_to = None
    if date_from:
        try:
            parsed_date_from = datetime.fromisoformat(date_from)
        except ValueError:
            pass
    if date_to:
        try:
            parsed_date_to = datetime.fromisoformat(date_to)
        except ValueError:
            pass
    
    query = select(Order).options(selectinload(Order.customer))
    if q:
        query = query.where(
            or_(
                Order.number.ilike(f"%{q}%"),
                Order.external_number.ilike(f"%{q}%"),
            )
        )
    if customer:
        query = query.where(Order.customer.has(Customer.name.ilike(f"%{customer}%")))
    if object_name:
        query = query.where(Order.object_name.ilike(f"%{object_name}%"))
    if status_filter:
        query = query.where(Order.status == status_filter)
    if parsed_date_from:
        query = query.where(Order.created_at >= parsed_date_from)
    if parsed_date_to:
        query = query.where(Order.created_at <= parsed_date_to)
    query = query.order_by(Order.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    number = await get_next_order_number(db)
    order = Order(number=number, author_id=current.id, **data.model_dump())
    db.add(order)
    await db.commit()
    await db.refresh(order)
    result = await db.execute(select(Order).options(selectinload(Order.customer)).where(Order.id == order.id))
    order_with_customer = result.scalar_one()
    # Force load customer
    await db.refresh(order_with_customer, ["customer"])
    return order_with_customer


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Order).options(selectinload(Order.customer)).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")
    await db.refresh(order, ["customer"])
    return order


@router.patch("/{order_id}", response_model=OrderOut)
async def update_order(
    order_id: int,
    data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Order).options(selectinload(Order.customer)).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    await db.commit()
    await db.refresh(order, ["customer"])
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")
    await db.delete(order)
    await db.commit()
