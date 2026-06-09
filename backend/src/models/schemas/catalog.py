from enum import Enum
from pydantic import BaseModel, HttpUrl

class DatabaseType(str, Enum):
    POSTGRESQL = "postgresql"
    SQLITE = "sqlite"

class CatalogConnection(BaseModel):
    type: DatabaseType
    url: str
    user: str
    password: str

