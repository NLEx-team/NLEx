import { useEffect, useId, useRef, useState } from "react";
import { IconWrapper } from "../icon";
import type { MultiSelectDropdownProps } from "./MultiSelectDropdown.types";
import "./MultiSelectDropdown.css";

function DropdownArrow({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === "down" ? (
        <path d="M6 9l6 6 6-6" />
      ) : (
        <path d="M6 15l6-6 6 6" />
      )}
    </svg>
  );
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <rect width="16" height="16" rx="2" fill="currentColor" />
        <path
          d="M4.5 8.2L7.1 10.8L11.5 5.5"
          stroke="var(--color-on-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="0.75"
        y="0.75"
        width="14.5"
        height="14.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleTriggerClick = () => {
    if (disabled) return;
    setOpen((current) => !current);
  };

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
      return;
    }

    onChange([...value, optionValue]);
  };

  const containerClassName = [
    "multi-select-dropdown",
    open ? "multi-select-dropdown--open" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName} ref={containerRef}>
      <button
        type="button"
        className="multi-select-dropdown__trigger"
        onClick={handleTriggerClick}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span className="multi-select-dropdown__value">
          {selectedLabels.length > 0 ? (
            selectedLabels.join(", ")
          ) : (
            <span className="multi-select-dropdown__placeholder">{placeholder}</span>
          )}
        </span>

        <span className="multi-select-dropdown__icon">
          <IconWrapper>
            <DropdownArrow direction={open ? "up" : "down"} />
          </IconWrapper>
        </span>
      </button>

      {open && (
        <ul className="multi-select-dropdown__list" id={listboxId} role="listbox" aria-multiselectable="true">
          {options.map((option) => {
            const isSelected = value.includes(option.value);

            return (
              <li
                key={option.value}
                className={[
                  "multi-select-dropdown__option",
                  isSelected ? "multi-select-dropdown__option--selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleToggle(option.value)}
              >
                <span className="multi-select-dropdown__checkbox">
                  <CheckboxIcon checked={isSelected} />
                </span>
                <span className="multi-select-dropdown__label">{option.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
