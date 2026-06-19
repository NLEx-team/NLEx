import type { FieldProps } from "../field/Field.types";

export interface PasswordFieldProps extends Omit<FieldProps, "type" | "rightIcon"> {}
