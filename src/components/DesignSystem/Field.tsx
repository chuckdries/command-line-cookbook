"use client";
import {
  FieldErrorProps,
  Group,
  GroupProps,
  InputProps,
  LabelProps,
  FieldError as RACFieldError,
  Input as RACInput,
  Label as RACLabel,
  Text,
  TextProps,
  composeRenderProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";
import { composeTailwindRenderProps, focusRing } from "./utils";

export function Label(props: LabelProps) {
  return (
    <RACLabel
      {...props}
      className={twMerge(
        "text-sm text-gray-500 dark:text-zinc-400 font-medium cursor-default w-fit",
        props.className,
      )}
    />
  );
}

export function Description(props: TextProps) {
  return (
    <Text
      {...props}
      slot="description"
      className={twMerge("text-sm text-gray-600", props.className)}
    />
  );
}

export function FieldError(props: FieldErrorProps) {
  return (
    <RACFieldError
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "text-sm text-ctp-red-600 forced-colors:text-[Mark]",
      )}
    />
  );
}

export const fieldBorderStyles = tv({
  variants: {
    isFocusWithin: {
      false: "border-ctp-mauve-100 dark:border-ctp-mauve-950 forced-colors:border-[ButtonBorder]",
      true: "border-ctp-mauve-600 forced-colors:border-[Highlight]",
    },
    isInvalid: {
      true: "border-ctp-red-600 forced-colors:border-[Mark]",
    },
    isDisabled: {
      true: "border-ctp-subtext0 forced-colors:border-[GrayText]",
    },
  },
});

export const fieldGroupStyles = tv({
  extend: focusRing,
  base: "group flex items-center h-9 bg-ctp-surface1 forced-colors:bg-[Field] border-2 rounded-lg overflow-hidden",
  variants: fieldBorderStyles.variants,
});

export function FieldGroup(props: GroupProps) {
  return (
    <Group
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        fieldGroupStyles({ ...renderProps, className }),
      )}
    />
  );
}

export function Input(props: InputProps) {
  return (
    <RACInput
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "px-2 py-1.5 flex-1 min-w-0 outline-0 text-sm disabled:text-ctp-subtext0 bg-ctp-mantle dark:bg-ctp-surface0",
        "rounded-md inset-shadow-xs inset-shadow-surface2 dark:inset-shadow-ctp-base",
      )}
    />
  );
}
