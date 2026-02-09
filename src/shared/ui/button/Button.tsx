"use client";

import type { ButtonHTMLAttributes } from "react";
import cn from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground border-transparent hover:bg-primary-hover focus:ring-primary-focus",
  secondary:
    "bg-layer text-foreground border-layer-line hover:bg-layer-hover focus:ring-primary-focus",
  danger:
    "bg-destructive text-destructive-foreground border-transparent hover:bg-destructive-hover focus:ring-destructive-focus",
  ghost:
    "bg-transparent text-foreground border-transparent hover:bg-layer-hover focus:ring-primary-focus",
};

export default function Button({
  variant = "primary",
  className,
  ...rest
}: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...rest} />;
}
