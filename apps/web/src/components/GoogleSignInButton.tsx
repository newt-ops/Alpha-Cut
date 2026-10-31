import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext.js";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (err: Error) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
  disabled?: boolean;
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "592216295265-6n5uqjepnlvn45nbto2o4chvf3q1cen9.apps.googleusercontent.com";

export function GoogleSignInButton({
  onSuccess,
  onError,
  text = "continue_with",
  disabled = false,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    let interval: any = null;

    const initGsi = () => {
      if (window.google?.accounts?.id && containerRef.current) {
        setSdkReady(true);
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (res: { credential: string }) => {
              if (res.credential) {
                onSuccess(res.credential);
              } else {
                onError?.(new Error("No credential returned by Google"));
              }
            },
            cancel_on_tap_outside: true,
          });

          containerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(containerRef.current, {
            type: "standard",
            theme: resolvedTheme === "dark" ? "filled_black" : "outline",
            size: "large",
            text: text,
            shape: "pill",
            logo_alignment: "left",
            width: "384",
          });
        } catch (e: any) {
          console.error("[Google GSI render error]:", e);
          onError?.(e);
        }
        return true;
      }
      return false;
    };

    if (!initGsi()) {
      interval = setInterval(() => {
        if (initGsi()) {
          clearInterval(interval);
        }
      }, 200);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resolvedTheme, text, onSuccess, onError]);

  const handleFallbackClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      onError?.(new Error("Google Identity Service is loading, please try again in a moment."));
    }
  };

  return (
    <div className="w-full flex justify-center">
      {/* Container where Google renders its official button */}
      <div
        ref={containerRef}
        className={`w-full flex justify-center ${sdkReady ? "" : "hidden"}`}
      />

      {/* Centum styled fallback while GSI loads or if script is blocked */}
      {!sdkReady && (
        <button
          type="button"
          disabled={disabled}
          onClick={handleFallbackClick}
          className="w-full h-11 px-5 rounded-full border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#1E1C1A] text-[#181818] dark:text-[#F5F3EC] font-semibold text-sm flex items-center justify-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all disabled:opacity-50 shadow-sm"
        >
          {/* Multicolor Google G SVG */}
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>
            {text === "signup_with"
              ? "Sign up with Google"
              : "Continue with Google"}
          </span>
        </button>
      )}
    </div>
  );
}

