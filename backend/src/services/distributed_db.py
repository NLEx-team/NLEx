from __future__ import annotations

import re
from contextlib import closing
from typing import Any
import asyncio

import trino
from trino.exceptions import TrinoUserError

from urllib.parse import quote_plus

from src.models.schemas.catalog import CatalogConnection, DatabaseType
from src.services.sql_guard import assert_read_only


# JDBC-style connectors that share the generic connection-url/user/password props.
_JDBC_CONNECTORS = {
    DatabaseType.POSTGRESQL,
    DatabaseType.MYSQL,
    DatabaseType.CLICKHOUSE,
    DatabaseType.ORACLE,
    DatabaseType.SQLITE,
}


CATALOG_NAME_RE = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")


def quote_identifier(name: str) -> str:
    """
    Safely quote a SQL identifier (schema/table/column) for Trino.
    Wraps it in double quotes and escapes any embedded double quotes.
    Prevents injection through identifiers that come from external DB metadata.
    """
    return '"' + str(name).replace('"', '""') + '"'


def escape_string_literal(value: str) -> str:
    """
    Escape a value for safe use inside a single-quoted SQL string literal
    (e.g. WHERE table_name = '<value>'). Doubles any single quotes.
    """
    return str(value).replace("'", "''")


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
                    try:
                        return cursor.fetchmany(limit)
                    except Exception:
                        return []
                    
        return await asyncio.to_thread(_fetch_limited)

    def execute_query_sync(
        self,
        query: str,
    ) -> list[list[Any]]:
        with closing(self._get_connection()) as conn:
            with closing(conn.cursor()) as cursor:
                cursor.execute(query)

                try:
                    return cursor.fetchall()
                except Exception:
                    return []

    def execute_query_sync_stream(
        self,
        query: str,
        chunk_size: int = 1000
    ):
        """Yields results in chunks for memory-efficient processing."""
        with closing(self._get_connection()) as conn:
            with closing(conn.cursor()) as cursor:
                cursor.execute(query)

                try:
                    # just to check if it has results, otherwise it will raise on fetchmany
                    _ = cursor.description
                except Exception:
                    # If description itself crashes (the Trino bug), we assume it has results
                    pass
                
                try:
                    while True:
                        rows = cursor.fetchmany(chunk_size)
                        if not rows:
                            break
                        for row in rows:
                            yield row
                except Exception:
                    return

    # --- Read-only guarded execution -------------------------------------
    # Use these for ANY SQL that originates from the LLM or the end user.
    # They enforce the read-only policy (single SELECT/CTE only) BEFORE the
    # query reaches the database. Internal metadata queries (SHOW, CREATE
    # CATALOG, information_schema, ...) intentionally use the raw methods above.

    async def execute_readonly_query_async(
        self,
        query: str,
    ) -> list[list[Any]]:
        assert_read_only(query)
        return await self.execute_query_async(query)

    async def execute_readonly_preview_async(
        self,
        query: str,
        limit: int = 5,
    ) -> list[list[Any]]:
        assert_read_only(query)
        return await self.execute_query_async_preview(query, limit)

    def execute_readonly_sync_stream(
        self,
        query: str,
        chunk_size: int = 1000,
    ):
        # Validate eagerly (before returning the generator) so a violation is
        # raised at call time, not on first iteration.
        assert_read_only(query)
        return self.execute_query_sync_stream(query, chunk_size)

    async def connect_catalog(
        self,
        name: str,
        catalog: CatalogConnection,
    ) -> None:
        self._validate_catalog_name(name)

        connector, props = self._build_connector_config(name, catalog)

        # Property keys are controlled by us; values are user-supplied and
        # escaped for single-quoted SQL string literals.
        with_clause = ",\n            ".join(
            f"\"{key}\" = '{escape_string_literal(value)}'"
            for key, value in props.items()
        )

        sql = f"""
        CREATE CATALOG {name}
        USING {connector}
        WITH (
            {with_clause}
        )
        """

        await self.execute_query_async(sql)

    def _build_connector_config(
        self,
        name: str,
        catalog: CatalogConnection,
    ) -> tuple[str, dict[str, str]]:
        """
        Maps a catalog to its Trino connector name and connector-specific
        properties. Each database type needs different WITH (...) properties.
        """
        db_type = catalog.type

        if db_type == DatabaseType.MONGODB:
            # Trino's MongoDB connector takes a single connection URL that may
            # embed credentials (mongodb://user:pass@host:port/...).
            return "mongodb", {"mongodb.connection-url": self._build_mongo_uri(catalog)}

        if db_type == DatabaseType.MINIO:
            # MinIO is S3-compatible object storage; Trino queries it via the
            # Hive connector. NOTE: to actually see tables you need a metastore
            # and data organised as tables (Parquet/ORC/CSV or Iceberg).
            return "hive", self._build_minio_config(name, catalog)

        # JDBC-style relational connectors (postgresql/mysql/clickhouse/oracle).
        return db_type.value, {
            "connection-url": catalog.url,
            "connection-user": catalog.user,
            "connection-password": catalog.password,
        }

    @staticmethod
    def _build_mongo_uri(catalog: CatalogConnection) -> str:
        """Build a mongodb:// URI, injecting credentials if they aren't already
        embedded in the provided URL."""
        url = (catalog.url or "").strip()
        if not url:
            raise ValueError("MongoDB requires a connection URL (e.g. mongodb://host:27017)")
        if not (url.startswith("mongodb://") or url.startswith("mongodb+srv://")):
            url = "mongodb://" + url

        scheme, _, rest = url.partition("://")
        host_part = rest.split("/", 1)[0]
        # Only inject credentials when provided and not already present in the URI.
        if catalog.user and "@" not in host_part:
            cred = quote_plus(catalog.user)
            if catalog.password:
                cred += ":" + quote_plus(catalog.password)
            url = f"{scheme}://{cred}@{rest}"
        return url

    @staticmethod
    def _build_minio_config(name: str, catalog: CatalogConnection) -> dict[str, str]:
        """
        Hive connector config pointing at a MinIO (S3-compatible) endpoint.
        Uses a file-based metastore so the catalog can register without an
        external Hive Metastore Service. Mapping:
          url      -> S3 endpoint (http://minio:9000)
          user     -> access key
          password -> secret key
        """
        return {
            "hive.metastore": "file",
            "hive.metastore.catalog.dir": f"file:///tmp/trino-metastore/{name}",
            "fs.native-s3.enabled": "true",
            "s3.endpoint": (catalog.url or "").strip(),
            "s3.path-style-access": "true",
            "s3.region": "us-east-1",
            "s3.aws-access-key": catalog.user or "",
            "s3.aws-secret-key": catalog.password or "",
        }

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
            SHOW SCHEMAS FROM "{catalog}"
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
            f'SHOW TABLES FROM "{catalog}".{quote_identifier(namespace)}'
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
            FROM "{catalog}".information_schema.columns
            WHERE table_schema = '{escape_string_literal(namespace)}'
            AND table_name = '{escape_string_literal(table)}'
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