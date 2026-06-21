export type AuthToggleValue = "login" | "register";

export interface AuthToggleProps {
  value: AuthToggleValue;
  onChange: (value: AuthToggleValue) => void;
  className?: string;
}
