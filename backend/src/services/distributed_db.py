from __future__ import annotations

import re
from contextlib import closing
from typing import Any
import asyncio

import trino
from trino.exceptions import TrinoUserError

from src.models.schemas.catalog import CatalogConnection


CATALOG_NAME_RE = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")


class DistributedDatabaseService:
    def __init__(
        self,
        host: str,
        port: int,
        user: str,
    ) -> None:
        self._connection_params = {
            "host": host,
            "port": port,
            "user": user,
        }

    def _get_connection(self):
        return trino.dbapi.connect(**self._connection_params)

    async def execute_query_async(
        self,
        query: str,
    ) -> list[list[Any]]:
        return await asyncio.to_thread(
            self.execute_query_sync,
            query,
        )

    async def execute_query_async_preview(
        self,
        query: str,
        limit: int = 5
    ) -> list[list[Any]]:
        def _fetch_limited():
            with closing(self._get_connection()) as conn:
                with closing(conn.cursor()) as cursor:
                    cursor.execute(query)
                    if cursor.description is None:
                        return []
                    return cursor.fetchmany(limit)
                    
        return await asyncio.to_thread(_fetch_limited)

    def execute_query_sync(
        self,
        query: str,
    ) -> list[list[Any]]:
        with closing(self._get_connection()) as conn:
            with closing(conn.cursor()) as cursor:
                cursor.execute(query)

                if cursor.description is None:
                    return []

                # ВНИМАНИЕ: Возвращено fetchall по требованию. Есть риск OOM при больших данных.
                return cursor.fetchall()

    def execute_query_sync_stream(
        self,
        query: str,
        chunk_size: int = 1000
    ):
        """Yields results in chunks for memory-efficient processing."""
        with closing(self._get_connection()) as conn:
            with closing(conn.cursor()) as cursor:
                cursor.execute(query)

                if cursor.description is None:
                    return
                
                while True:
                    rows = cursor.fetchmany(chunk_size)
                    if not rows:
                        break
                    for row in rows:
                        yield row

    async def connect_catalog(
        self,
        name: str,
        catalog: CatalogConnection,
    ) -> None:
        self._validate_catalog_name(name)

        url = catalog.url.replace("'", "''")
        user = catalog.user.replace("'", "''")
        password = catalog.password.replace("'", "''")

        sql = f"""
        CREATE CATALOG {name}
        USING {catalog.type.value}
        WITH (
            "connection-url" = '{url}',
            "connection-user" = '{user}',
            "connection-password" = '{password}'
        )
        """

        await self.execute_query_async(sql)

    async def disconnect_catalog(
        self,
        name: str,
    ) -> None:
        self._validate_catalog_name(name)

        await self.execute_query_async(
            f"DROP CATALOG IF EXISTS {name}"
        )

    async def get_catalogs(self) -> list[str]:
        rows = await self.execute_query_async(
            """
            SELECT catalog_name
            FROM system.metadata.catalogs
            ORDER BY catalog_name
            """
        )
        return [row[0] for row in rows]

    async def get_catalog_type(self, catalog: str) -> str:
        self._validate_catalog_name(catalog)
        rows = await self.execute_query_async(
            f"""
            SELECT connector_id 
            FROM system.metadata.catalogs 
            WHERE catalog_name = '{catalog}'
            """
        )
        if not rows:
            return "unknown"
        # connector_id is usually like "postgresql" or "postgresql-123"
        connector_id = rows[0][0]
        return connector_id.split('-')[0]


    async def get_namespaces(self, catalog: str) -> list[str]:
        self._validate_catalog_name(catalog)

        rows = await self.execute_query_async(
            f"""
            SHOW SCHEMAS FROM {catalog}
            """
        )
        return [row[0] for row in rows]


    async def get_tables(
        self,
        catalog: str,
        namespace: str,
    ) -> list[str]:
        self._validate_catalog_name(catalog)

        rows = await self.execute_query_async(
            f"SHOW TABLES FROM {catalog}.{namespace}"
        )
        return [row[0] for row in rows]


    async def get_columns(
        self,
        catalog: str,
        namespace: str,
        table: str,
    ) -> list[dict[str, Any]]:
        self._validate_catalog_name(catalog)

        rows = await self.execute_query_async(
            f"""
            SELECT
                column_name,
                data_type,
                is_nullable,
                ordinal_position
            FROM {catalog}.information_schema.columns
            WHERE table_schema = '{namespace}'
            AND table_name = '{table}'
            ORDER BY ordinal_position
            """
        )

        return [
            {
                "name": row[0],
                "type": row[1],
                "nullable": row[2] == "YES",
                "position": row[3],
            }
            for row in rows
        ]

    @staticmethod
    def _validate_catalog_name(name: str) -> None:
        if not CATALOG_NAME_RE.fullmatch(name):
            raise ValueError(
                f"Invalid catalog name: {name}"
            )