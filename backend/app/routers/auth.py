from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import Employee, EmployeeRole
from app.schemas.employee import LoginIn, TokenOut, EmployeeOut, EmployeeCreate, EmployeeUpdate
from app.utils.security import create_access_token, hash_password, verify_password, decode_access_token
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_employee(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Employee:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный токен")
    employee_id = payload.get("sub")
    if not employee_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный токен")
    result = await db.execute(select(Employee).where(Employee.id == employee_id, Employee.is_active == True))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")
    return employee


async def require_admin(current: Employee = Depends(get_current_employee)) -> Employee:
    if current.role != EmployeeRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Требуются права администратора")
    return current


@router.post("/login", response_model=TokenOut)
async def login(data: LoginIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.login == data.login, Employee.is_active == True))
    employee = result.scalar_one_or_none()
    if not employee or not verify_password(data.password, employee.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")
    access_token = create_access_token(
        data={"sub": str(employee.id), "role": employee.role.value},
        expires_delta=timedelta(minutes=settings.auth_access_token_expire_minutes),
    )
    return TokenOut(access_token=access_token)


@router.get("/me", response_model=EmployeeOut)
async def me(current: Employee = Depends(get_current_employee)):
    return current


@router.post("/employees", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    _: Employee = Depends(require_admin),
):
    result = await db.execute(select(Employee).where(Employee.login == data.login))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Логин уже существует")
    employee = Employee(
        login=data.login,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    db.add(employee)
    await db.commit()
    await db.refresh(employee)
    return employee


@router.get("/employees", response_model=list[EmployeeOut])
async def list_employees(
    db: AsyncSession = Depends(get_db),
    _: Employee = Depends(require_admin),
):
    result = await db.execute(select(Employee).order_by(Employee.full_name))
    return result.scalars().all()


@router.patch("/employees/{employee_id}", response_model=EmployeeOut)
async def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    _: Employee = Depends(require_admin),
):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сотрудник не найден")
    if data.full_name is not None:
        employee.full_name = data.full_name
    if data.role is not None:
        employee.role = data.role
    if data.is_active is not None:
        employee.is_active = data.is_active
    if data.password is not None:
        employee.password_hash = hash_password(data.password)
    await db.commit()
    await db.refresh(employee)
    return employee


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    _: Employee = Depends(require_admin),
):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сотрудник не найден")
    employee.is_active = False
    await db.commit()
