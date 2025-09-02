"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  NumberField as AriaNumberField,
  NumberFieldProps as AriaNumberFieldProps,
  Button,
  ButtonProps,
  ValidationResult,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import {
  Description,
  FieldError,
  FieldGroup,
  Input,
  Label,
  fieldBorderStyles,
} from "./Field";
import { composeTailwindRenderProps, focusRing } from "./utils";

const fieldGroupThemedStyles = tv({
  extend: focusRing,
  base: "group flex items-center h-9 border-2 rounded-lg overflow-hidden bg-ctp-surface0 inset-shadow-xs inset-shadow-ctp-base",
  variants: {
    isFocusWithin: fieldBorderStyles.variants.isFocusWithin,
    isInvalid: fieldBorderStyles.variants.isInvalid,
    isDisabled: fieldBorderStyles.variants.isDisabled,
    variant: {
      default: "forced-colors:bg-[Field]",
      themed: "border-hue/20",
    },
  },
  compoundVariants: [
    {
      isFocusWithin: true,
      variant: "themed",
      className: "border-hue",
    },
  ],
  defaultVariants: {
    variant: "default",
  },
});

const stepperBorderStyles = tv({
  base: "flex flex-col",
  variants: {
    isFocusWithin: fieldBorderStyles.variants.isFocusWithin,
    isInvalid: fieldBorderStyles.variants.isInvalid,
    isDisabled: fieldBorderStyles.variants.isDisabled,
    variant: {
      default: "border-s-2",
      themed: "border-s-2 border-hue/20",
    },
  },
  compoundVariants: [
    {
      isFocusWithin: true,
      variant: "themed",
      className: "border-hue",
    },
  ],
  defaultVariants: {
    variant: "default",
  },
});

const stepperDividerStyles = tv({
  variants: {
    isFocusWithin: fieldBorderStyles.variants.isFocusWithin,
    isInvalid: fieldBorderStyles.variants.isInvalid,
    isDisabled: fieldBorderStyles.variants.isDisabled,
    variant: {
      default: "border-b-2",
      themed: "border-b-2 border-hue/20",
    },
  },
  compoundVariants: [
    {
      isFocusWithin: true,
      variant: "themed",
      className: "border-hue",
    },
  ],
  defaultVariants: {
    variant: "default",
  },
});

const inputThemedStyles = tv({
  base: "px-2 py-1.5 flex-1 min-w-0 outline-0 text-sm disabled:text-ctp-subtext0",
  variants: {
    variant: {
      default: "",
      themed: "text-ctp-text",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface NumberFieldProps extends AriaNumberFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  variant?: "default" | "themed";
}

export function NumberField({
  label,
  description,
  errorMessage,
  variant = "default",
  ...props
}: NumberFieldProps) {
  return (
    <AriaNumberField
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "group flex flex-col gap-1",
      )}
    >
      <Label>{label}</Label>
      <FieldGroup
        className={(renderProps) =>
          fieldGroupThemedStyles({ ...renderProps, variant })
        }
      >
        {(renderProps) => (
          <>
            <Input className={inputThemedStyles({ variant })} />
            <div
              className={stepperBorderStyles({
                ...renderProps,
                variant,
              })}
            >
              <StepperButton slot="increment" variant={variant}>
                <ChevronUp aria-hidden className="w-4 h-4" />
              </StepperButton>
              <div
                className={stepperDividerStyles({
                  ...renderProps,
                  variant,
                })}
              />
              <StepperButton slot="decrement" variant={variant}>
                <ChevronDown aria-hidden className="w-4 h-4" />
              </StepperButton>
            </div>
          </>
        )}
      </FieldGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaNumberField>
  );
}

interface StepperButtonProps extends ButtonProps {
  variant?: "default" | "themed";
}

const stepperButtonStyles = tv({
  base: "px-0.5 cursor-default pressed:bg-gray-100 group-disabled:text-gray-200 dark:pressed:bg-zinc-800 dark:group-disabled:text-zinc-600 forced-colors:group-disabled:text-[GrayText]",
  variants: {
    variant: {
      default: "text-gray-500 dark:text-zinc-400",
      themed: "text-ctp-text",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function StepperButton({ variant = "default", ...props }: StepperButtonProps) {
  return <Button {...props} className={stepperButtonStyles({ variant })} />;
}
