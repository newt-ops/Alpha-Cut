/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Alpha Cut Brand Browns & Creams
        brand: {
          brown: "#451D13", // Primary brand brown (Light mode accent)
          cream: "#FBEFE1", // Complementary warm cream
          terracotta: "#C58A76", // Dark mode primary accent
          darkbrown: "#754637", // Dark mode supporting surface
        },
        // Apple HIG-inspired Centum surfaces
        surface: {
          lightBg: "#F5F5F7",
          lightCard: "#FFFFFF",
          lightBorder: "#E5E5EA",
          lightDivider: "rgba(24, 24, 24, 0.06)",
          darkBg: "#161412",
          darkCard: "#252321",
          darkBorder: "#33302C",
          darkDivider: "rgba(245, 243, 236, 0.08)",
        },
        // Semantic tokens
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};

