# app/api/routes/cities.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.city import City
from app.schemas.city import CityPublic  # нужно создать: id, name, region

router = APIRouter(prefix="/cities", tags=["cities"])

@router.get("", response_model=list[CityPublic])
async def list_cities(search: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    stmt = select(City).where(City.is_active == True)
    if search:
        stmt = stmt.where(City.name.ilike(f"%{search}%"))
    result = await db.execute(stmt)
    return result.scalars().all()