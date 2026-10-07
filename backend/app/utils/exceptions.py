class LabError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(LabError):
    def __init__(self, message: str = "Запись не найдена"):
        super().__init__(message, status_code=404)


class ForbiddenError(LabError):
    def __init__(self, message: str = "Доступ запрещён"):
        super().__init__(message, status_code=403)


class ConflictError(LabError):
    def __init__(self, message: str = "Конфликт данных"):
        super().__init__(message, status_code=409)


class InternalServerError(LabError):
    def __init__(self, message: str = "Внутренняя ошибка сервера"):
        super().__init__(message, status_code=500)
