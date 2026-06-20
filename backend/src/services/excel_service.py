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

    def _get_file_path(self, chat_id: UUID) -> str:
        """Returns the cached file path for a given chat_id."""
        return os.path.join(self.exports_dir, f"{chat_id}.xlsx")

    def get_cached_file(self, chat_id: UUID) -> Optional[str]:
        """
        Returns the path to a cached Excel file if it exists,
        otherwise None.
        """
        path = self._get_file_path(chat_id)
        if os.path.exists(path):
            return path
        return None

    def generate_excel(
        self,
        chat_id: UUID,
        headers: List[str],
        data: List[List[Any]],
    ) -> str:
        """
        Generates a styled .xlsx file from query results,
        saves it to the exports volume, and returns the file path.
        """
        if not headers:
            raise ValueError("Headers list cannot be empty")

        wb = Workbook()
        ws = wb.active
        ws.title = "Query Results"

        # --- Header styling ---
        header_font = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
        header_fill = PatternFill(
            start_color="4472C4", end_color="4472C4", fill_type="solid"
        )
        header_alignment = Alignment(horizontal="center", vertical="center")
        thin_border = Border(
            left=Side(style="thin"),
            right=Side(style="thin"),
            top=Side(style="thin"),
            bottom=Side(style="thin"),
        )

        # Write headers
        ws.append(headers)
        for col_idx, _ in enumerate(headers, start=1):
            cell = ws.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border

        # --- Data rows ---
        data_alignment = Alignment(vertical="center")
        for row_data in data:
            ws.append(row_data)
            current_row = ws.max_row
            for col_idx in range(1, len(headers) + 1):
                cell = ws.cell(row=current_row, column=col_idx)
                cell.border = thin_border
                cell.alignment = data_alignment

        # Auto-fit column widths
        for col_idx, column_name in enumerate(headers, start=1):
            max_length = len(str(column_name))
            for row in ws.iter_rows(min_row=2, min_col=col_idx, max_col=col_idx):
                for cell in row:
                    if cell.value is not None:
                        max_length = max(max_length, len(str(cell.value)))
            col_letter = ws.cell(row=1, column=col_idx).column_letter
            ws.column_dimensions[col_letter].width = min(max_length + 4, 50)

        # Freeze header row
        ws.freeze_panes = "A2"

        # Save to volume
        file_path = self._get_file_path(chat_id)
        wb.save(file_path)
        logger.info(f"Excel file generated and saved: {file_path}")

        return file_path

    def invalidate_cache(self, chat_id: UUID) -> None:
        """Removes cached file for a chat (e.g. when a new query is made)."""
        path = self._get_file_path(chat_id)
        if os.path.exists(path):
            os.remove(path)
            logger.info(f"Invalidated cached export for chat {chat_id}")
