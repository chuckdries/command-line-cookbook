"use client";
import React from "react";
import {
  Switch as AriaSwitch,
  SwitchProps as AriaSwitchProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { composeTailwindRenderProps, focusRing } from "./utils";

export interface SwitchProps extends Omit<AriaSwitchProps, "children"> {
  children: React.ReactNode;
  variant?: "default" | "themed" | "inverted";
}

const track = tv({
  extend: focusRing,
  base: "flex h-4 w-7 px-px items-center shrink-0 cursor-default rounded-full transition duration-200 ease-in-out inset-shadow-sm inset-shadow-ctp-surface2/50 border border-transparent",
  variants: {
    isSelected: {
      false: "",
      true: "",
    },
    isDisabled: {
      false: "",
      true: "",
    },
    variant: {
      default: "",
      themed: "",
      inverted: "",
    },
  },
  compoundVariants: [
    // Default variant styles
    {
      variant: "default",
      isSelected: false,
      isDisabled: false,
      class:
        "bg-gray-400 dark:bg-zinc-400 group-pressed:bg-gray-500 dark:group-pressed:bg-zinc-300",
    },
    {
      variant: "default",
      isSelected: true,
      isDisabled: false,
      class:
        "bg-gray-700 dark:bg-zinc-300 forced-colors:bg-[Highlight]! group-pressed:bg-gray-800 dark:group-pressed:bg-zinc-200",
    },
    {
      variant: "default",
      isDisabled: true,
      class:
        "bg-gray-200 dark:bg-zinc-700 forced-colors:group-selected:bg-[GrayText]! forced-colors:border-[GrayText]",
    },
    // Themed variant styles
    {
      variant: "themed",
      isSelected: false,
      isDisabled: false,
      class: "bg-gray-400 dark:bg-zinc-400",
    },
    {
      variant: "themed",
      isSelected: true,
      isDisabled: false,
      class: "bg-hue",
    },
    {
      variant: "themed",
      isDisabled: true,
      class:
        "bg-gray-400 dark:bg-gray-600 border-gray-400 dark:border-gray-600",
    },
    {
      variant: "inverted",
      isSelected: false,
      isDisabled: false,
      class: "bg-gray-400 dark:bg-zinc-400",
    },
    {
      variant: "inverted",
      isSelected: true,
      isDisabled: false,
      class: "bg-gray-100 dark:bg-gray-900",
    },
    {
      variant: "inverted",
      isDisabled: true,
      class:
        "bg-gray-400 dark:bg-gray-600 border-gray-400 dark:border-gray-600",
    },
  ],
  defaultVariants: {
    variant: "default",
  },
});

const handle = tv({
  base: "h-3 w-3 transform rounded-full outline outline-1 -outline-offset-1 outline-transparent shadow-xs transition duration-200 ease-in-out",
  variants: {
    isSelected: {
      false: "translate-x-0",
      true: "translate-x-[100%]",
    },
    isDisabled: {
      true: "forced-colors:outline-[GrayText]",
    },
    variant: {
      default: "bg-white dark:bg-zinc-900",
      themed: "bg-white dark:bg-zinc-900",
      inverted: "bg-white dark:bg-zinc-900",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export function Switch({
  children,
  variant = "default",
  ...props
}: SwitchProps) {
  return (
    <AriaSwitch
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "group relative flex gap-2 items-center disabled:text-gray-300 dark:disabled:text-zinc-600 forced-colors:disabled:text-[GrayText] text-sm transition",
      )}
    >
      {(renderProps) => (
        <>
          <div className={track({ ...renderProps, variant })}>
            <span className={handle({ ...renderProps, variant })} />
          </div>
          {children}
        </>
      )}
    </AriaSwitch>
  );
}
