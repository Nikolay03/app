"use client";

import type { SelectHTMLAttributes } from "react";
import cn from "@/shared/lib/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

export default function Select({
  label,
  helperText,
  error,
  className,
  id,
  children,
  ...rest
}: SelectProps) {
  const finalId = id ?? rest.name;
  const base =
    "py-2.5 sm:py-3 px-4 block w-full rounded-lg bg-layer border border-layer-line text-sm text-foreground focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none";
  const errorInput = error
    ? "border-destructive focus:border-destructive focus:ring-destructive"
    : "";

  return (
    <div className="space-y-2">
      {label ? (
        <label
          htmlFor={finalId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      ) : null}
      <select
        id={finalId}
        className={cn(base, errorInput, className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${finalId}-error` : undefined}
        {...rest}
      >
        {children}
      </select>
      {helperText ? (
        <div className="text-xs text-muted-foreground-1">{helperText}</div>
      ) : null}
      {error ? (
        <div id={`${finalId}-error`} className="text-xs text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
