import type { ChangeEventHandler, TextareaHTMLAttributes } from "react";

export interface ChatInputProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onSubmit"> {
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit: () => void;
  placeholder?: string;
}
