import { useRef, useEffect } from "react";
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
  hintText,
  multiline,
  ...inputProps
}: FieldProps) {
  const isError = mode === "error";
  const fieldId = id ?? (label ? `field-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const errorId = fieldId ? `${fieldId}-error` : undefined;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const inputClassName = [
    "field__input",
    leftIcon ? "field__input--has-left-icon" : "",
    rightIcon ? "field__input--has-right-icon" : "",
    multiline ? "field__input--multiline" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const wrapperClassName = "field__input-wrapper";

  useEffect(() => {
    if (multiline && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [multiline, value]);

  if (mode === "readonly") {
    return (
      <div className="field field--readonly">
        {label && (
          <label className="field__label" htmlFor={fieldId}>
            {label}
          </label>
        )}
        <div className="field__readonly" id={fieldId} aria-readonly="true" style={multiline ? { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } : undefined}>
          {value || (placeholder ? <span className="field__placeholder">{placeholder}</span> : null)}
        </div>
      </div>
    );
  }

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
    if (inputProps.onInput) {
      inputProps.onInput(e as any);
    }
  };

  return (
    <div className={`field${isError ? " field--error" : ""}`}>
      {label && (
        <label className="field__label" htmlFor={fieldId}>
          {label}
        </label>
      )}

      <div className={wrapperClassName}>
        {multiline ? (
          <textarea
            {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            id={fieldId}
            disabled={disabled}
            placeholder={placeholder}
            value={value}
            className={inputClassName}
            aria-invalid={isError}
            aria-describedby={isError && errorText ? errorId : undefined}
            ref={textareaRef}
            onInput={handleTextareaInput}
            rows={1}
            style={{ overflow: 'hidden', resize: 'none' }}
          />
        ) : (
          <input
            {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
            id={fieldId}
            type={type}
            disabled={disabled}
            placeholder={placeholder}
            value={value}
            className={inputClassName}
            aria-invalid={isError}
            aria-describedby={isError && errorText ? errorId : undefined}
          />
        )}

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
      
      {!isError && hintText && (
        <span className="field__hint">
          {hintText}
        </span>
      )}
    </div>
  );
}
