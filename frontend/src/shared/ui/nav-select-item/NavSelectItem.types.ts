import type { ReactNode } from 'react';

export interface NavSelectItemProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  actions?: ReactNode;
}
