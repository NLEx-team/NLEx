import { useState } from "react";
import { Field } from "../field";
import { IconWrapper } from "../icon";
import type { PasswordFieldProps } from "./PasswordField.types";
import { Icon } from "@iconify/react";

export function PasswordField({ mode = "default", ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  if (mode === "readonly") {
    return <Field {...props} mode="readonly" />;
  }

  return (
    <Field
      {...props}
      mode={mode}
      type={visible ? "text" : "password"}
      rightIcon={
        <IconWrapper
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <Icon icon='mdi:hide-outline' /> : <Icon icon='mdi:eye-outline' />}
        </IconWrapper>
      }
    />
  );
}
