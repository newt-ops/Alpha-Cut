import * as React from "react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import {
  CheckmarkCircle02Icon,
  Alert02Icon,
  InformationCircleIcon,
  AlertDiamondIcon,
} from "hugeicons-react";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        className:
          "!rounded-[16px] !border !border-[#E5E5EA] dark:!border-[#33302C] !bg-white dark:!bg-[#252321] !text-[#181818] dark:!text-[#F5F3EC] !shadow-lg !font-sans !p-4",
      }}
    />
  );
}

export const notify = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, {
      description,
      icon: <CheckmarkCircle02Icon className="h-5 w-5 text-emerald-500" />,
    }),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, {
      description,
      icon: <AlertDiamondIcon className="h-5 w-5 text-red-500" />,
    }),
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, {
      description,
      icon: <Alert02Icon className="h-5 w-5 text-amber-500" />,
    }),
  info: (message: string, description?: string) =>
    sonnerToast.info(message, {
      description,
      icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
    }),
};

