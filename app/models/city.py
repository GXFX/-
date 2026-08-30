import uuid

from geoalchemy2 import Geography
from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class City(Base):
    """
    A city where the app is (or could be) active.
    Admins toggle `is_active` to control the expansion rollout
    (Mytishchi -> Khimki -> Lobnya -> Moscow -> ...).
    """
    __tablename__ = "cities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    center = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=True)
