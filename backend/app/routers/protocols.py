import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Order, Protocol, ProtocolMethod
from app.schemas.protocol import ProtocolCreate, ProtocolUpdate, ProtocolOut
from app.services.numbering import get_next_protocol_number
from app.routers.auth import get_current_employee

router = APIRouter(prefix="/protocols", tags=["protocols"])


def build_snapshot(order: Order) -> str:
    return json.dumps(
        {
            "customer_id": order.customer_id,
            "contact_person": order.contact_person,
            "external_number": order.external_number,
            "external_date": order.external_date.isoformat() if order.external_date else None,
            "object_name": order.object_name,
            "sample_count": order.sample_count,
            "address": order.address,
            "payer": order.payer,
            "planned_date": order.planned_date.isoformat() if order.planned_date else None,
            "notes": order.notes,
        },
        ensure_ascii=False,
    )


@router.get("/", response_model=list[ProtocolOut])
async def list_protocols(
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    query = select(Protocol).options(selectinload(Protocol.methods)).order_by(Protocol.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/from-order/{order_id}", response_model=ProtocolOut, status_code=status.HTTP_201_CREATED)
async def create_protocol_from_order(
    order_id: int,
    data: ProtocolCreate,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")

    number = await get_next_protocol_number(db)
    protocol = Protocol(
        number=number,
        order_id=order_id,
        status="draft",
        snapshot=build_snapshot(order),
        author_id=current.id,
    )
    db.add(protocol)
    await db.flush()

    if data.method_ids:
        for method_id in data.method_ids:
            db.add(ProtocolMethod(protocol_id=protocol.id, method_id=method_id))

    await db.commit()
    await db.refresh(protocol, attribute_names=["methods"])
    return protocol


@router.get("/{protocol_id}", response_model=ProtocolOut)
async def get_protocol(
    protocol_id: int,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Protocol).options(selectinload(Protocol.methods)).where(Protocol.id == protocol_id))
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Протокол не найден")
    return protocol


@router.patch("/{protocol_id}", response_model=ProtocolOut)
async def update_protocol(
    protocol_id: int,
    data: ProtocolUpdate,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Protocol).options(selectinload(Protocol.methods)).where(Protocol.id == protocol_id))
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Протокол не найден")
    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "method_ids" and value is not None:
            await db.execute(
                ProtocolMethod.__table__.delete().where(ProtocolMethod.protocol_id == protocol.id)
            )
            for method_id in value:
                db.add(ProtocolMethod(protocol_id=protocol.id, method_id=method_id))
        else:
            setattr(protocol, field, value)
    await db.commit()
    await db.refresh(protocol, attribute_names=["methods"])
    return protocol


@router.post("/{protocol_id}/sync", response_model=ProtocolOut)
async def sync_protocol_from_order(
    protocol_id: int,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Protocol).options(selectinload(Protocol.methods)).where(Protocol.id == protocol_id))
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Протокол не найден")

    order_result = await db.execute(select(Order).where(Order.id == protocol.order_id))
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")

    protocol.snapshot = build_snapshot(order)
    await db.commit()
    await db.refresh(protocol, attribute_names=["methods"])
    return protocol


@router.delete("/{protocol_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_protocol(
    protocol_id: int,
    db: AsyncSession = Depends(get_db),
    current=Depends(get_current_employee),
):
    result = await db.execute(select(Protocol).where(Protocol.id == protocol_id))
    protocol = result.scalar_one_or_none()
    if not protocol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Протокол не найден")
    await db.delete(protocol)
    await db.commit()
