import * as React from "react";
import { cn } from "../utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-black/5 dark:bg-white/5",
        className
      )}
      {...props}
    />
  );
}

