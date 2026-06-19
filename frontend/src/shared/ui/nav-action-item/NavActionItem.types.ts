import type { ReactNode } from "react";

export interface NavActionItemProps {
  label: string;
  /** Pass a node already wrapped in `IconWrapper`. */
  iconRight?: ReactNode;
  onClick: () => void;
  className?: string;
}
