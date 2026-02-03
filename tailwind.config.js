export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Custom Tactical Palette - STRICT ENFORCEMENT
        "background-light": "#f6f8f6",
        "background-dark": "#102210",
        "surface-light": "#ffffff",
        "surface-dark": "#1a2e1a",

        "semantic-red": "#ef4444",
        "semantic-yellow": "#eab308",
        "semantic-green": "#22c55e",

        primary: {
          DEFAULT: "#13ec13", // Neon Green
          foreground: "#1a2e1a", // Dark contrast text
        },
        secondary: {
          DEFAULT: "#1a2e1a", // Surface Dark
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#1a2e1a", // Surface Dark as muted
          foreground: "#a3a3a3",
        },
        accent: {
          DEFAULT: "#eab308", // Yellow accent
          foreground: "#1a2e1a",
        },
        popover: {
          DEFAULT: "#1a2e1a",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#1a2e1a",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ['Lexend', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Lexend', 'sans-serif'],
        body: ['Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
