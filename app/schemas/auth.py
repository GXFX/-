from datetime import date

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., examples=["+79261234567"])
    name: str
    date_of_birth: date
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    phone: str
    password: str


class OtpVerifyRequest(BaseModel):
    phone: str
    code: str = Field(..., min_length=4, max_length=6)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
