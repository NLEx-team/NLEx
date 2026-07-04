export interface MultiSelectOption {
  label: string;
  value: string;
}

import type { ReactNode } from "react";

export interface MultiSelectDropdownProps {
  options: MultiSelectOption[];

  value: string[];
  onChange: (value: string[]) => void;

  placeholder?: string;
  disabled?: boolean;

  /** Show a search box inside the dropdown to filter options by label. */
  searchable?: boolean;
  searchPlaceholder?: string;

  /** Optional content pinned to the bottom of the dropdown (e.g. a mode toggle). */
  footer?: ReactNode;

  /** When set, renders a "select all" master checkbox with this label at the top. */
  selectAllLabel?: string;

  className?: string;
}
