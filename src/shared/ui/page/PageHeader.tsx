import type { ReactNode } from "react";
import cn from "@/shared/lib/cn";

type ErrorLike = { message?: unknown } | string;

export type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  errors?: Array<ErrorLike | null | undefined>;
  className?: string;
};

function toMessage(error: ErrorLike | null | undefined): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string") return message;
    if (message != null) return String(message);
  }
  return null;
}

export default function PageHeader({
  title,
  description,
  errors,
  className,
}: PageHeaderProps) {
  const messages = (errors ?? [])
    .map(toMessage)
    .filter((message): message is string => Boolean(message));

  const uniqueMessages = Array.from(new Set(messages));

  return (
    <div className={cn(className)}>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description ? (
        <p className="text-sm text-muted-foreground-1">{description}</p>
      ) : null}
      {uniqueMessages.map((message) => (
        <p key={message} className="mt-2 text-sm text-muted-foreground-1">
          {message}
        </p>
      ))}
    </div>
  );
}

