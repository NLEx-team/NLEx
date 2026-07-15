import logging
import os
from typing import Dict, List, Optional

import xlsxwriter

logger = logging.getLogger(__name__)

EXPORTS_DIR = os.environ.get("EXPORTS_DIR", "/app/exports")

# How many data rows to sample for auto-width calculation (keeps it fast).
_WIDTH_SAMPLE_ROWS = 200
_MAX_COL_WIDTH = 60
_MIN_COL_WIDTH = 10


class ExcelExportService:
    """
    Service responsible for generating and caching Excel files
    from chat query results.

    Uses xlsxwriter for high-performance streaming writes — 3-5x faster
    than openpyxl and avoids the costly post-processing step.
    """

    def __init__(self, exports_dir: str = EXPORTS_DIR):
        self.exports_dir = exports_dir
        os.makedirs(self.exports_dir, exist_ok=True)

    def _get_file_path(self, export_id: str) -> str:
        """Returns the file path for a given export_id."""
        return os.path.join(self.exports_dir, f"{export_id}.xlsx")

    def get_cached_file(self, export_id: str) -> Optional[str]:
        """
        Returns the path to a cached Excel file if it exists,
        otherwise None.
        """
        path = self._get_file_path(export_id)
        if os.path.exists(path):
            return path
        return None

    def _get_metadata_path(self, export_id: str) -> str:
        return os.path.join(self.exports_dir, f"{export_id}.meta.json")

    def save_export_metadata(
        self,
        export_id: str,
        sql: str,
        headers: List[str],
        catalog_mapping: Dict[str, str] = None,
        filename: str = None
    ) -> None:
        import json
        meta_path = self._get_metadata_path(export_id)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({
                "sql": sql, 
                "headers": headers,
                "catalog_mapping": catalog_mapping or {},
                "filename": filename or f"export_{export_id}"
            }, f)

    def generate_and_get_excel(self, export_id: str, db_service) -> str:
        file_path = self._get_file_path(export_id)
        if os.path.exists(file_path):
            return file_path
            
        import json
        meta_path = self._get_metadata_path(export_id)
        if not os.path.exists(meta_path):
            raise ValueError("Export metadata not found.")
            
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
            
        sql = meta["sql"]
        headers = meta["headers"]
        catalog_mapping = meta.get("catalog_mapping", {})

        # xlsxwriter with constant_memory=True flushes rows to disk
        # as they are written, keeping RAM usage flat even for 500k+ rows.
        wb = xlsxwriter.Workbook(file_path, {"constant_memory": True})
        ws = wb.add_worksheet("Query Results")

        # --- Styles (created once, reused for every cell) ---
        header_fmt = wb.add_format({
            "font_name": "Calibri",
            "font_size": 11,
            "bold": True,
            "font_color": "#FFFFFF",
            "bg_color": "#4472C4",
            "align": "center",
            "valign": "vcenter",
            "border": 1,
        })
        data_fmt = wb.add_format({
            "align": "center",
            "valign": "vcenter",
            "border": 1,
        })

        # Track max width per column (seeded with header lengths)
        col_widths = [min(len(str(h)) + 4, _MAX_COL_WIDTH) for h in headers]

        # Write header row
        for ci, h in enumerate(headers):
            ws.write(0, ci, h, header_fmt)

        # Freeze header row so it stays visible when scrolling
        ws.freeze_panes(1, 0)

        # Stream data from DB via the read-only guarded path: export must never
        # execute anything other than a single SELECT/CTE, even on re-run.
        row_idx = 1
        for row_data in db_service.execute_readonly_sync_stream(sql, chunk_size=2000):
            for ci, val in enumerate(row_data):
                # xlsxwriter doesn't support UUIDs, Decimals, dicts natively
                if val is not None and not isinstance(val, (int, float, str, bool)):
                    val = str(val)
                
                if isinstance(val, str) and catalog_mapping:
                    for t_name, d_name in catalog_mapping.items():
                        if t_name in val:
                            val = val.replace(t_name, d_name)

                # Sample first N rows for auto-width
                if row_idx <= _WIDTH_SAMPLE_ROWS and ci < len(col_widths):
                    cell_len = len(str(val)) + 2 if val is not None else 0
                    if cell_len > col_widths[ci]:
                        col_widths[ci] = min(cell_len, _MAX_COL_WIDTH)

                ws.write(row_idx, ci, val, data_fmt)
            row_idx += 1

        # Apply auto-fitted column widths (xlsxwriter handles this natively,
        # no need to re-read the file like openpyxl required).
        for ci, width in enumerate(col_widths):
            ws.set_column(ci, ci, max(width, _MIN_COL_WIDTH))

        wb.close()

        row_count = row_idx - 1
        logger.info(f"Excel file streamed and saved: {file_path} ({row_count} rows)")
        return file_path
