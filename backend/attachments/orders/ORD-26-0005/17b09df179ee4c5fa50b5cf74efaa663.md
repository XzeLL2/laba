# Lab — серверное веб-приложение для автоматизации лабораторных испытаний

## Архитектура
- **Frontend**: React + TypeScript + Vite (основное хранилище данных в браузере через IndexedDB/Dexie.js).
- **Backend**: FastAPI (Python 3.12), SQLAlchemy 2.0 (async), Alembic. Только для авторизации и управления файлами на сервере.
- **Database**: SQLite по умолчанию (только auth + метаданные файлов).
- **Развёртывание**: Docker Compose.

## Структура
- `backend/app/` — основной код FastAPI.
  - `main.py` — точка входа, роутеры.
  - `config.py` — конфигурация через pydantic-settings.
  - `database.py` — асинхронное подключение к БД.
  - `models/` — SQLAlchemy модели (Employee, ServerFile).
  - `schemas/` — Pydantic схемы.
  - `routers/` — эндпоинты FastAPI (auth, files).
  - `utils/` — утилиты (security, ip_auth, middleware, exceptions).
- `backend/alembic/` — миграции.
- `frontend/src/` — React приложение.
  - `lib/db.ts` — Dexie.js база IndexedDB.
  - `lib/api.ts` — Axios клиент.
  - `hooks/useAuth.tsx` — контекст авторизации.
  - `pages/` — страницы приложения.
  - `components/Layout.tsx` — layout с навигацией.
- `scripts/` — скрипты развёртывания и бэкапа.
- `frontend/` — React приложение.

## Пути данных
- `/var/lib/lab/labdb.sqlite` — база данных (auth + файлы).
- `/var/lib/lab/attachments/` — файлы на сервере.

## Конфигурация
Переменные окружения в `backend/.env`:
- `DATABASE_URL` — URL базы данных.
- `APP_IP_SUBNETS` — разрешённые подсети (через запятую).
- `APP_ALLOWED_ORIGINS` — CORS origins.
- `APP_SECRET_KEY` — секретный ключ для JWT.
- `STORAGE_PATH` — путь для файлов на сервере.

## Роли
- `engineer` — инженер-испытатель.
- `admin` — администратор.
- `manager` — руководитель отдела.

## Развёртывание
1. `bash scripts/deploy.sh`
2. `docker compose up -d`

## Резервное копирование
`bash scripts/backup.sh`
