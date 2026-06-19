import type { InputHTMLAttributes, ReactNode } from "react";

export type FieldMode = "default" | "error" | "readonly";

export interface FieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  mode?: FieldMode;
  label?: string;
  errorText?: string;
  /** Icon slot — pass a node already wrapped in `IconWrapper`.
   *  Icons are decorative overlays inside the wrapper padding area;
   *  when absent, layout is unchanged. When present, Field adjusts input
   *  padding internally so text positioning stays stable. */
  leftIcon?: ReactNode;
  /** Icon slot — pass a node already wrapped in `IconWrapper`.
   *  See leftIcon for overlay layout rules. */
  rightIcon?: ReactNode;
}
