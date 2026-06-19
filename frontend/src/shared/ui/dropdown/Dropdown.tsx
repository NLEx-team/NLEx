import { useEffect, useId, useRef, useState } from "react";
import { IconWrapper } from "../icon";
import type { DropdownProps } from "./Dropdown.types";
import "./Dropdown.css";

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

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);

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

  const handleSelect = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
    setOpen(false);
  };

  const containerClassName = ["dropdown", open ? "dropdown--open" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName} ref={containerRef}>
      <button
        type="button"
        className="dropdown__trigger"
        onClick={handleTriggerClick}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span className="dropdown__value">
          {selectedOption ? (
            selectedOption.label
          ) : (
            <span className="dropdown__placeholder">{placeholder}</span>
          )}
        </span>

        <span className="dropdown__icon">
          <IconWrapper>
            <DropdownArrow direction={open ? "up" : "down"} />
          </IconWrapper>
        </span>
      </button>

      {open && (
        <ul className="dropdown__list" id={listboxId} role="listbox">
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <li
                key={option.value}
                className={["dropdown__option", isSelected ? "dropdown__option--selected" : ""]
                  .filter(Boolean)
                  .join(" ")}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
