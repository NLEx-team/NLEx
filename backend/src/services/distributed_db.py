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

    def execute_query_sync(
        self,
        query: str,
    ) -> list[list[Any]]:
        with closing(self._get_connection()) as conn:
            with closing(conn.cursor()) as cursor:
                cursor.execute(query)

                if cursor.description is None:
                    return []

                return cursor.fetchall()

    async def connect_catalog(
        self,
        name: str,
        catalog: CatalogConnection,
    ) -> None:
        self._validate_catalog_name(name)

        sql = f"""
        CREATE CATALOG {name}
        USING {catalog.type.value}
        WITH (
            "connection-url" = '{catalog.url}',
            "connection-user" = '{catalog.user}',
            "connection-password" = '{catalog.password}'
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

    @staticmethod
    def _validate_catalog_name(name: str) -> None:
        if not CATALOG_NAME_RE.fullmatch(name):
            raise ValueError(
                f"Invalid catalog name: {name}"
            )