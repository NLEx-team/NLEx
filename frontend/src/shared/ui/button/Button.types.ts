import type { ReactNode, MouseEventHandler, CSSProperties } from "react";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
  style?: CSSProperties;
}