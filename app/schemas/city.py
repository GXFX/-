import uuid
from pydantic import BaseModel, ConfigDict


class CityPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    region: str