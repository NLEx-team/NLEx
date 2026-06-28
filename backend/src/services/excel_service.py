import logging
import os
from io import BytesIO
from typing import Any, Dict, List, Optional
from uuid import UUID

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

logger = logging.getLogger(__name__)

EXPORTS_DIR = os.environ.get("EXPORTS_DIR", "/app/exports")


class ExcelExportService:
    """
    Service responsible for generating and caching Excel files
    from chat query results.
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
        catalog_mapping: Dict[str, str] = None
    ) -> None:
        import json
        meta_path = self._get_metadata_path(export_id)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({
                "sql": sql, 
                "headers": headers,
                "catalog_mapping": catalog_mapping or {}
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
        
        # Use WriteOnlyWorkbook for memory efficiency
        wb = Workbook(write_only=True)
        ws = wb.create_sheet("Query Results")

        # --- Header styling ---
        # Note: In write-only mode, we write Cell objects to apply styles
        from openpyxl.cell import WriteOnlyCell
        
        header_font = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_alignment = Alignment(horizontal="center", vertical="center")
        thin_border = Border(
            left=Side(style="thin"), right=Side(style="thin"),
            top=Side(style="thin"), bottom=Side(style="thin")
        )
        data_alignment = Alignment(vertical="center")

        # Apply default column widths (can't auto-fit easily in write_only mode)
        for col_idx, column_name in enumerate(headers, start=1):
            from openpyxl.utils import get_column_letter
            ws.column_dimensions[get_column_letter(col_idx)].width = max(len(str(column_name)) + 4, 15)

        # Write header row
        header_cells = []
        for h in headers:
            cell = WriteOnlyCell(ws, value=h)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border
            header_cells.append(cell)
        ws.append(header_cells)
        
        # Stream data from DB
        row_count = 0
        for row_data in db_service.execute_query_sync_stream(sql, chunk_size=2000):
            data_cells = []
            for val in row_data:
                # Openpyxl doesn't support UUIDs, Decimals, dicts natively
                if val is not None and not isinstance(val, (int, float, str, bool)):
                    val = str(val)
                
                if isinstance(val, str) and catalog_mapping:
                    for t_name, d_name in catalog_mapping.items():
                        if t_name in val:
                            val = val.replace(t_name, d_name)

                cell = WriteOnlyCell(ws, value=val)
                cell.border = thin_border
                cell.alignment = data_alignment
                data_cells.append(cell)
            ws.append(data_cells)
            row_count += 1
            
        # Freeze panes is not supported in write_only mode
        wb.save(file_path)
        logger.info(f"Excel file streamed and saved: {file_path} ({row_count} rows)")
        return file_path
