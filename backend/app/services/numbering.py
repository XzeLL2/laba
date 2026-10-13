from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from app.models import Counter
from app.utils.exceptions import InternalServerError


async def get_next_number(db: AsyncSession, entity_type: str, prefix: str, seq_width: int) -> str:
    current_year = datetime.now().year
    year_suffix = str(current_year)[-2:]
    result = await db.execute(
        select(Counter).where(Counter.entity_type == entity_type, Counter.year == current_year)
    )
    counter = result.scalar_one_or_none()
    if not counter:
        counter = Counter(entity_type=entity_type, prefix=prefix, year=current_year, last_number=0)
        db.add(counter)
        await db.flush()
    counter.last_number += 1
    number = f"{prefix}-{year_suffix}-{counter.last_number:0{seq_width}d}"
    await db.commit()
    await db.refresh(counter)
    return number


async def get_next_order_number(db: AsyncSession) -> str:
    return await get_next_number(db, "order", "ORD", 4)


async def get_next_protocol_number(db: AsyncSession) -> str:
    return await get_next_number(db, "protocol", "PT", 5)
