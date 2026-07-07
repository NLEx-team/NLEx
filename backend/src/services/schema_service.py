from typing import Any
import asyncio
from src.services.distributed_db import (
    DistributedDatabaseService,
    quote_identifier,
    escape_string_literal,
)
from src.services.relationship_service import RelationshipService

IGNORED_SCHEMAS = {
    "information_schema", "system", "pg_catalog", "pg_toast",
    "sys", "outln", "dbsnmp", "appqossys", "ctxsys", "xdb", 
    "gsmadmin_internal", "lbacsys", "dvsys", "mdsys", "olapsys", 
    "orddata", "ordsys", "wmsys", "ojvmsys", "sysback", "sysdg", 
    "syskm", "sysrac", "syssm", "dbsfwuser", "gdsys", "o7_dictionary_accessibility",
    "xs$null", "ops$oracle"
}

# Prefixes of system views/tables that typically require elevated privileges.
# Filtering by prefix covers ALL Oracle/Postgres system objects instead of
# trying to enumerate them one by one.
_IGNORED_TABLE_PREFIXES = (
    "dba_", "v$", "gv$", "all_", "user$",
    "pg_stat_", "pg_statio_",
)

class SchemaService:
    def __init__(self, db: DistributedDatabaseService):
        self.db = db
        self.relationship_service = RelationshipService(db)

    async def get_catalogs(self) -> list[str]:
        return await self.db.get_catalogs()

    async def get_full_schema(self, catalog: str) -> dict[str, Any]:
        namespaces = await self.db.get_namespaces(catalog)
        db_type = await self.db.get_catalog_type(catalog)
        
        # Filter out system schemas
        namespaces = [
            ns for ns in namespaces
            if ns.lower() not in IGNORED_SCHEMAS
            and not ns.lower().startswith("pg_temp")
            and not ns.lower().startswith("pg_toast_temp")
        ]
        
        # Batch fetch ALL columns for the entire catalog in one query
        all_columns = await self._batch_get_columns(catalog, namespaces)
        
        schemas = []
        all_relationships = []
        for namespace in namespaces:
            raw_tables = await self.db.get_tables(catalog, namespace)
            
            # Filter out system views/tables BEFORE any queries to avoid
            # permission denied errors on read-only database users.
            tables = [
                t for t in raw_tables
                if not t.lower().startswith(_IGNORED_TABLE_PREFIXES)
            ]
            
            # Fetch relationships for all tables (these are lightweight metadata queries)
            rel_tasks = [
                self.relationship_service.get_relationships(catalog, namespace, table, db_type)
                for table in tables
            ]
            rel_results = await asyncio.gather(*rel_tasks, return_exceptions=True)
            
            # Fetch samples for all tables IN PARALLEL
            sample_tasks = [
                self._fetch_samples(catalog, namespace, table)
                for table in tables
            ]
            sample_results = await asyncio.gather(*sample_tasks)
            
            tables_data = []
            for table, rels, sample_rows in zip(tables, rel_results, sample_results):
                    
                # Handle relationship exceptions gracefully
                if isinstance(rels, Exception):
                    rels = []
                all_relationships.extend(rels)
                
                # Get columns from batch result
                columns = all_columns.get((namespace, table), [])
                
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
                    "columns": formatted_columns
                })
            
            schemas.append({
                "name": namespace,
                "tables": tables_data
            })
            
        return {
            "catalog": catalog,
            "schemas": schemas,
            "relationships": all_relationships
        }

    async def _batch_get_columns(
        self, catalog: str, namespaces: list[str]
    ) -> dict[tuple[str, str], list[dict[str, Any]]]:
        """
        Fetch columns for ALL tables in all given namespaces with a single query.
        Returns a dict mapping (schema_name, table_name) -> [column_dicts]
        """
        if not namespaces:
            return {}
        
        # Build WHERE clause for all namespaces (escape values to prevent injection)
        ns_list = ", ".join(f"'{escape_string_literal(ns)}'" for ns in namespaces)
        query = f"""
            SELECT
                table_schema,
                table_name,
                column_name,
                data_type,
                is_nullable,
                ordinal_position
            FROM {quote_identifier(catalog)}.information_schema.columns
            WHERE table_schema IN ({ns_list})
            ORDER BY table_schema, table_name, ordinal_position
        """
        
        rows = await self.db.execute_query_async(query)
        
        result: dict[tuple[str, str], list[dict[str, Any]]] = {}
        for row in rows:
            key = (row[0], row[1])
            if key not in result:
                result[key] = []
            result[key].append({
                "name": row[2],
                "type": row[3],
                "nullable": row[4] == "YES",
                "position": row[5],
            })
        
        return result

    async def _fetch_samples(
        self, catalog: str, namespace: str, table: str
    ) -> list:
        """Fetch sample rows for a single table. Returns empty list on error."""
        try:
            table_ref = f"{quote_identifier(catalog)}.{quote_identifier(namespace)}.{quote_identifier(table)}"
            return await self.db.execute_query_async(
                f'SELECT * FROM {table_ref} LIMIT 5'
            )
        except Exception as e:
            print(f"Error fetching samples for {catalog}.{namespace}.{table}: {e}")
            return []
