import type { ReactNode } from "react";

export interface IconWrapperProps {
  children: ReactNode;

  /** делает иконку кликабельной */
  onClick?: () => void;

  /** accessible label for clickable icons */
  "aria-label"?: string;

  /** дополнительный className */
  className?: string;
}
