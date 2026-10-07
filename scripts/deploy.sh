#!/bin/bash
set -euo pipefail

echo "Развёртывание Lab..."

BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)/backend"

mkdir -p "$BACKEND_DIR/attachments" "$BACKEND_DIR/backups"

DB_FILE="$BACKEND_DIR/labdb.sqlite"
if [ ! -f "$DB_FILE" ]; then
    echo "Создаю базу данных..."
    touch "$DB_FILE"
fi

chmod 666 "$DB_FILE"
chmod -R 777 "$BACKEND_DIR/attachments" "$BACKEND_DIR/backups"

echo "Создаю администратора по умолчанию..."
cd "$BACKEND_DIR"
/home/ivlevdv/projects/laba/.venv/bin/python3 -c "
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.models import Base, Employee, EmployeeRole
from app.utils.security import hash_password
from app.config import settings

async def init():
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        from sqlalchemy.future import select
        result = await session.execute(select(Employee).where(Employee.login == 'admin'))
        if not result.scalar_one_or_none():
            admin = Employee(login='admin', password_hash=hash_password('admin'), full_name='Администратор', role=EmployeeRole.ADMIN)
            session.add(admin)
            await session.commit()
            print('Администратор создан: admin / admin')
        else:
            print('Администратор уже существует')

asyncio.run(init())
"

cd ..

echo "Развёртывание завершено."
