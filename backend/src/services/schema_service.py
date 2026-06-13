from typing import Any
from src.services.distributed_db import DistributedDatabaseService

class SchemaService:
    def __init__(self, db: DistributedDatabaseService):
        self.db = db

    async def get_catalogs(self) -> list[str]:
        return await self.db.get_catalogs()

    async def get_full_schema(self, catalog: str) -> dict[str, Any]:
        namespaces = await self.db.get_namespaces(catalog)
        
        schemas = []
        for namespace in namespaces:
            if namespace in ("information_schema", "system"):
                continue
                
            tables = await self.db.get_tables(catalog, namespace)
            tables_data = []
            
            for table in tables:
                columns = await self.db.get_columns(catalog, namespace, table)
                
                # Fetch samples
                # We fetch a few rows and then map them to columns
                # SELECT * should match the ordinal_position order in Trino
                sample_rows = []
                try:
                    sample_rows = await self.db.execute_query_async(
                        f"SELECT * FROM {catalog}.{namespace}.{table} LIMIT 3"
                    )
                except Exception as e:
                    # Log error or just skip samples for this table
                    # Some tables might be views or unpopulated materialized views
                    print(f"Error fetching samples for {catalog}.{namespace}.{table}: {e}")
                
                formatted_columns = []
                for i, col in enumerate(columns):
                    samples = []
                    for row in sample_rows:
                        if i < len(row):
                            val = row[i]
                            if val is not None:
                                samples.append(str(val))
                    
                    formatted_columns.append({
                        "name": col["name"],
                        "type": col["type"],
                        "nullable": col["nullable"],
                        "samples": samples
                    })
                
                tables_data.append({
                    "name": table,
                    "columns": formatted_columns,
                    "relationships": []  # Relationships are not natively exposed by Trino metadata
                })
            
            schemas.append({
                "name": namespace,
                "tables": tables_data
            })
            
        return {
            "catalog": catalog,
            "schemas": schemas
        }
