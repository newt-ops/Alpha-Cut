/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: "var(--tg-theme-bg-color, #ffffff)",
          text: "var(--tg-theme-text-color, #000000)",
          hint: "var(--tg-theme-hint-color, #707579)",
          link: "var(--tg-theme-link-color, #2481cc)",
          button: "var(--tg-theme-button-color, #2481cc)",
          buttonText: "var(--tg-theme-button-text-color, #ffffff)",
          secondaryBg: "var(--tg-theme-secondary-bg-color, #f4f4f5)",
          headerBg: "var(--tg-theme-header-bg-color, #ffffff)",
          sectionBg: "var(--tg-theme-section-bg-color, #ffffff)",
          sectionHeader: "var(--tg-theme-section-header-text-color, #707579)",
          subtitle: "var(--tg-theme-subtitle-text-color, #707579)",
          destructive: "var(--tg-theme-destructive-text-color, #ff3b30)",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

