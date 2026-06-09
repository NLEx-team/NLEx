from pydantic import BaseModel, HttpUrl

class DatabaseType(str, Enum):
    POSTGRESQL = "postgresql"
    SQLITE = "sqlite"

class CatalogConnection(BaseModel):
    type: DatabaseType
    host: str
    port: int
    user: str
    password: str

