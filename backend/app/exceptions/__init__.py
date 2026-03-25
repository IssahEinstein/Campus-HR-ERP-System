from fastapi import HTTPException, status


class InvalidCredentials(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )


class TokenExpired(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


class InvalidToken(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate token",
            headers={"WWW-Authenticate": "Bearer"},
        )


class SessionRevoked(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )


class PermissionDenied(HTTPException):
    def __init__(self, detail: str = "Permission denied"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
