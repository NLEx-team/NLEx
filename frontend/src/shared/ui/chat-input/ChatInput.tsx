import { useCallback, useLayoutEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { IconWrapper } from "../icon";
import type { ChatInputProps } from "./ChatInput.types";
import "./ChatInput.css";

const DEFAULT_PLACEHOLDER = "Describe the data you want to analyse...";

function getMaxHeightPx() {
  return window.innerHeight * 0.2;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = DEFAULT_PLACEHOLDER,
  disabled,
  className = "",
  ...textareaProps
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const maxHeight = getMaxHeightPx();
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useLayoutEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const containerClassName = ["chat-input", className].filter(Boolean).join(" ");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  const isSubmitDisabled = disabled || !value.trim();

  return (
    <div className={containerClassName}>
      <textarea
        {...textareaProps}
        ref={textareaRef}
        className="chat-input__textarea"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
      />

      <button
        type="button"
        className="chat-input__submit"
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        aria-label="Send message"
      >
        <IconWrapper>
          <Icon icon="ic:round-send" aria-hidden="true" />
        </IconWrapper>
      </button>
    </div>
  );
}
