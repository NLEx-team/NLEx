export interface MultiSelectOption {
  label: string;
  value: string;
}

export interface MultiSelectDropdownProps {
  options: MultiSelectOption[];

  value: string[];
  onChange: (value: string[]) => void;

  placeholder?: string;
  disabled?: boolean;

  className?: string;
}
