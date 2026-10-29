import * as React from "react";
import { Folder01Icon } from "hugeicons-react";
import { cn } from "../utils.js";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <Folder01Icon className="h-10 w-10 text-[#868686] dark:text-[#8C8A89]" />,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-[20px] border border-dashed border-[#E5E5EA] dark:border-[#33302C] bg-white/50 dark:bg-[#252321]/50",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 mb-4">
        {icon}
      </div>
      <h4 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC]">
        {title}
      </h4>
      <p className="mt-1 max-w-sm text-xs text-[#868686] dark:text-[#8C8A89]">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

