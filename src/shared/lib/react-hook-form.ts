"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useFormContext,
  type FieldValues,
  type UseFormProps,
  type Resolver,
} from "react-hook-form";
import { z } from "zod";

type UseZodFormProps<
  TValues extends FieldValues,
  TSchema extends z.ZodType<TValues>
> = Omit<UseFormProps<TValues>, "resolver"> & {
  schema: TSchema;
};

export const useZodForm = <
  TValues extends FieldValues,
  TSchema extends z.ZodType<TValues>
>({
  schema,
  ...rest
}: UseZodFormProps<TValues, TSchema>) => {
  type Values = TValues;
  type ZodResolverSchema = Parameters<typeof zodResolver>[0];

  const form = useForm<Values>({
    ...rest,
    resolver: zodResolver(
      schema as unknown as ZodResolverSchema
    ) as unknown as Resolver<Values>,
  });

  return { ...form, schema } as typeof form & { schema: TSchema };
};

export const useZodFormContext = <T extends FieldValues = FieldValues>() => {
  const form = useFormContext<T>();
  const schema = (form as unknown as { schema?: z.ZodTypeAny }).schema;

  type HookFormType = typeof form & { schema?: z.ZodTypeAny };

  return { ...form, schema } as HookFormType;
};

export const checkRequired = (
  schema: unknown,
  name: string
): boolean => {
  const pathParts = name.split(".");
  let currentSchema: unknown = schema;

  for (const part of pathParts) {
    if (currentSchema instanceof z.ZodObject) {
      const next = (currentSchema.shape as Record<string, unknown>)[part];
      if (!next) {
        return false;
      }
      currentSchema = next;
    } else if (currentSchema instanceof z.ZodArray) {
      const indexMatch = part.match(/^(\d+)$/);
      if (!indexMatch) {
        return false;
      }
      currentSchema = (currentSchema as unknown as { element: unknown }).element;
    } else {
      return false;
    }
  }

  if (
    typeof (currentSchema as { isOptional?: () => boolean }).isOptional ===
    "function"
  ) {
    return !(currentSchema as { isOptional: () => boolean }).isOptional();
  }
  return false;
};
