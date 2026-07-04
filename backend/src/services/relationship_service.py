from typing import Any
from src.services.distributed_db import DistributedDatabaseService, escape_string_literal
from src.models.schemas.catalog import DatabaseType

class RelationshipService:
    def __init__(self, db: DistributedDatabaseService):
        self.db = db

    async def get_relationships(
        self, 
        catalog: str, 
        namespace: str, 
        table: str,
        db_type: str
    ) -> list[dict[str, Any]]:
        # 1. Try generic Trino information_schema.referential_constraints first
        relationships = await self._get_from_trino_info_schema(catalog, namespace, table)
        if relationships:
            return relationships

        # 2. Fallback to DB specific implementations
        if db_type == DatabaseType.POSTGRESQL.value:
            return await self._get_postgresql_relationships(catalog, namespace, table)
        elif db_type == DatabaseType.MYSQL.value:
            return await self._get_mysql_relationships(catalog, namespace, table)
        elif db_type == DatabaseType.CLICKHOUSE.value:
            return await self._get_clickhouse_relationships(catalog, namespace, table)
        
        return []

    async def _get_from_trino_info_schema(self, catalog: str, namespace: str, table: str) -> list[dict[str, Any]]:
        # Standard Trino information_schema query
        query = f"""
        SELECT
            kcu1.table_schema AS from_schema,
            kcu1.table_name AS from_table,
            kcu1.column_name AS from_column,
            kcu2.table_schema AS to_schema,
            kcu2.table_name AS to_table,
            kcu2.column_name AS to_column
        FROM {catalog}.information_schema.key_column_usage kcu1
        JOIN {catalog}.information_schema.referential_constraints rc
          ON kcu1.constraint_name = rc.constraint_name
          AND kcu1.table_schema = rc.constraint_schema
        JOIN {catalog}.information_schema.key_column_usage kcu2
          ON rc.unique_constraint_name = kcu2.constraint_name
          AND rc.unique_constraint_schema = kcu2.table_schema
        WHERE kcu1.table_schema = '{escape_string_literal(namespace)}'
          AND kcu1.table_name = '{escape_string_literal(table)}'
        """
        try:
            rows = await self.db.execute_query_async(query)
            return [self._format_relationship(row[0], row[1], row[2], row[3], row[4], row[5]) for row in rows]
        except Exception:
            return []

    async def _get_postgresql_relationships(self, catalog: str, namespace: str, table: str) -> list[dict[str, Any]]:
        # Postgres-specific query via Trino
        query = f"""
        SELECT
            kcu.table_schema AS from_schema,
            kcu.table_name AS from_table,
            kcu.column_name AS from_column,
            ccu.table_schema AS to_schema,
            ccu.table_name AS to_table,
            ccu.column_name AS to_column
        FROM {catalog}.information_schema.table_constraints AS tc
        JOIN {catalog}.information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN {catalog}.information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = '{escape_string_literal(namespace)}'
          AND tc.table_name = '{escape_string_literal(table)}'
        """
        try:
            rows = await self.db.execute_query_async(query)
            return [self._format_relationship(row[0], row[1], row[2], row[3], row[4], row[5]) for row in rows]
        except Exception:
            return []

    async def _get_mysql_relationships(self, catalog: str, namespace: str, table: str) -> list[dict[str, Any]]:
        # MySQL-specific query via Trino
        query = f"""
        SELECT
            TABLE_SCHEMA AS from_schema,
            TABLE_NAME AS from_table,
            COLUMN_NAME AS from_column,
            REFERENCED_TABLE_SCHEMA AS to_schema,
            REFERENCED_TABLE_NAME AS to_table,
            REFERENCED_COLUMN_NAME AS to_column
        FROM {catalog}.information_schema.key_column_usage
        WHERE table_schema = '{escape_string_literal(namespace)}'
          AND table_name = '{escape_string_literal(table)}'
          AND referenced_table_name IS NOT NULL
        """
        try:
            rows = await self.db.execute_query_async(query)
            return [self._format_relationship(row[0], row[1], row[2], row[3], row[4], row[5]) for row in rows]
        except Exception:
            return []

    async def _get_clickhouse_relationships(self, catalog: str, namespace: str, table: str) -> list[dict[str, Any]]:
        # ClickHouse does not support traditional foreign keys
        return []

    def _format_relationship(
        self, 
        from_schema: str, 
        from_table: str, 
        from_column: str, 
        to_schema: str, 
        to_table: str, 
        to_column: str
    ) -> dict[str, Any]:
        return {
            "from_table": f"{from_schema}.{from_table}",
            "from_column": from_column,
            "to_table": f"{to_schema}.{to_table}",
            "to_column": to_column,
            "type": "many_to_one",
            "source": "foreign_key",
            "confidence": 1.0
        }
