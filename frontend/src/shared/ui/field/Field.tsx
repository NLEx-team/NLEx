import "./Field.css";
import type { FieldProps } from "./Field.types";

export function Field({
  mode = "default",
  label,
  errorText,
  type = "text",
  disabled,
  leftIcon,
  rightIcon,
  className = "",
  id,
  placeholder,
  value,
  ...inputProps
}: FieldProps) {
  const isError = mode === "error";
  const fieldId = id ?? (label ? `field-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const errorId = fieldId ? `${fieldId}-error` : undefined;

  const inputClassName = [
    "field__input",
    leftIcon ? "field__input--has-left-icon" : "",
    rightIcon ? "field__input--has-right-icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const wrapperClassName = "field__input-wrapper";

  if (mode === "readonly") {
    return (
      <div className="field field--readonly">
        {label && (
          <label className="field__label" htmlFor={fieldId}>
            {label}
          </label>
        )}
        <div className="field__readonly" id={fieldId} aria-readonly="true">
          {value || (placeholder ? <span className="field__placeholder">{placeholder}</span> : null)}
        </div>
      </div>
    );
  }

  return (
    <div className={`field${isError ? " field--error" : ""}`}>
      {label && (
        <label className="field__label" htmlFor={fieldId}>
          {label}
        </label>
      )}

      <div className={wrapperClassName}>
        <input
          {...inputProps}
          id={fieldId}
          type={type}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          className={inputClassName}
          aria-invalid={isError}
          aria-describedby={isError && errorText ? errorId : undefined}
        />

        {leftIcon && (
          <div className="field__icon field__icon--left">{leftIcon}</div>
        )}

        {rightIcon && (
          <div className="field__icon field__icon--right">{rightIcon}</div>
        )}
      </div>

      {isError && errorText && (
        <span className="field__error" id={errorId} role="alert">
          {errorText}
        </span>
      )}
    </div>
  );
}
