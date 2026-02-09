"use client";

import type { InputHTMLAttributes } from "react";
import { useController } from "react-hook-form";
import {
  checkRequired,
  useZodFormContext,
} from "@/shared/lib/react-hook-form";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label?: string;
  helperText?: string;
};

export default function Input({
  name,
  label,
  helperText,
  required,
  className,
  ...rest
}: InputProps) {
  const { control, schema } = useZodFormContext();
  const { field, fieldState } = useController({
    name,
    control,
  });

  const isRequired =
    Boolean(required) || (schema ? checkRequired(schema, name) : false);
  const errorMessage = fieldState.error?.message;
  const baseInput =
    "py-2.5 sm:py-3 px-4 block w-full rounded-lg bg-layer border border-layer-line text-sm text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus disabled:opacity-50 disabled:pointer-events-none";
  const errorInput = errorMessage
    ? "border-destructive focus:border-destructive focus:ring-destructive"
    : "";

  return (
    <div className="space-y-2">
      {label ? (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-foreground"
        >
          {label}
          {isRequired ? (
            <span className="ml-1 text-destructive">*</span>
          ) : null}
        </label>
      ) : null}
      <input
        id={name}
        {...field}
        value={field.value ?? ""}
        className={[baseInput, errorInput, className].filter(Boolean).join(" ")}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorMessage ? `${name}-error` : undefined}
        required={required}
        {...rest}
      />
      {helperText ? (
        <div className="text-xs text-muted-foreground-1">{helperText}</div>
      ) : null}
      {errorMessage ? (
        <div id={`${name}-error`} className="text-xs text-destructive">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
