"use client";
import {
  TextField as AriaTextField,
  TextFieldProps as AriaTextFieldProps,
  ValidationResult,
} from "react-aria-components";
import { Description, FieldError, Input, Label, FieldGroup } from "./Field";
import { composeTailwindRenderProps } from "./utils";
import { tv } from "tailwind-variants";

export interface TextFieldProps extends AriaTextFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  variant?: "default" | "themed";
}

export function TextField({
  label,
  description,
  errorMessage,
  variant = "default",
  ...props
}: TextFieldProps) {
  const themedBorder = tv({
    variants: {
      isFocusWithin: {
        false: "border-hue/20",
        true: "border-hue",
      },
    },
  });
  return (
    <AriaTextField
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex flex-col gap-1"
      )}
    >
      {label && <Label>{label}</Label>}
      <FieldGroup
        className={
          variant === "themed"
            ? (renderProps) =>
                renderProps.isInvalid ? "" : themedBorder(renderProps)
            : undefined
        }
      >
        <Input
          className={variant === "themed" ? "text-ctp-text" : undefined}
        />
      </FieldGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
