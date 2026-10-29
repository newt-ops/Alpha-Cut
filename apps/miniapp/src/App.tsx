import React, { useEffect } from "react";
import { CheckmarkCircle02Icon } from "hugeicons-react";

export default function App() {
  useEffect(() => {
    // Notify Telegram WebApp that the interface is mounted and expanded
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  return (
    <main className="p-4 flex flex-col items-center justify-center min-h-screen text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tg-secondaryBg mb-4">
        <CheckmarkCircle02Icon className="h-7 w-7 text-tg-button" />
      </div>
      <h1 className="text-xl font-bold text-tg-text">Alpha Cut Client Portal</h1>
      <p className="mt-1 text-xs text-tg-hint max-w-xs">
        Native Telegram mobile workspace for reviewing project cuts and accepting proposals.
      </p>
      <div className="mt-6 w-full max-w-xs">
        <button
          className="w-full py-3 px-4 rounded-xl font-medium bg-tg-button text-tg-buttonText active:opacity-90 transition-opacity"
          onClick={() => {
            if (window.Telegram?.WebApp?.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
            }
          }}
        >
          View Active Proposals
        </button>
      </div>
    </main>
  );
}

