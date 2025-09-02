"use client";
import {
  composeRenderProps,
  Button as RACButton,
  ButtonProps as RACButtonProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { focusRing } from "./utils";

export interface ButtonProps extends RACButtonProps {
  /** @default 'primary' */
  variant?: "primary" | "themed" | "secondary";
}

let button = tv({
  extend: focusRing,
  base: "inset-ring text-ctp-base px-3 py-2 text-sm text-center rounded-lg cursor-default shadow-sm shadow-ctp-surface1 dark:shadow-ctp-mantle hover:shadow-md",
  variants: {
    variant: {
      primary:
        "bg-ctp-mauve-700 hover:bg-ctp-mauve pressed:bg-ctp-mauve-950 inset-ring-ctp-mauve-300",
      secondary:
        "inset-ring-ctp-surface2 hover:bg-ctp-mantle dark:hover:bg-ctp-surface1 pressed:bg-ctp-surface2 text-ctp-text",
      themed:
        "bg-hue-700 inset-ring-hue hover:bg-hue pressed:bg-hue-700 text-ctp-base",
    },
    isDisabled: {
      true: "text-ctp-subtext0 bg-ctp-surface1 inset-ring-ctp-surface1 opacity-60 cursor-not-allowed hover:bg-ctp-surface1 pressed:bg-ctp-surface1 forced-colors:text-[GrayText]",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export function Button(props: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        button({ ...renderProps, variant: props.variant, className }),
      )}
    />
  );
}
