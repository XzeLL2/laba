#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/lib/lab/backups"
DB_FILE="/var/lib/lab/labdb.sqlite"
ATTACHMENTS_DIR="/var/lib/lab/attachments"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="lab_backup_${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

tar -czf "${BACKUP_DIR}/${ARCHIVE_NAME}" \
    -C "$(dirname "$DB_FILE")" "$(basename "$DB_FILE")" \
    -C "$(dirname "$ATTACHMENTS_DIR")" "$(basename "$ATTACHMENTS_DIR")"

echo "Резервная копия создана: ${BACKUP_DIR}/${ARCHIVE_NAME}"

# Удаляем бэкапы старше 30 дней
find "$BACKUP_DIR" -name "lab_backup_*.tar.gz" -type f -mtime +30 -delete
