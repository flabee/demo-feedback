import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  // Apply hover styles only on devices that actually support hover, so a touch
  // tap fires the click immediately instead of being swallowed by a sticky
  // :hover state (the "have to tap twice" bug on mobile).
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        // Brand accent. Change these three values to re-skin the whole app.
        brand: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          tint: "#EEF2FF",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "check-draw": {
          "0%": { strokeDashoffset: "26" },
          "100%": { strokeDashoffset: "0" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "drawer-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "pop-in": "pop-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "check-draw": "check-draw 420ms cubic-bezier(0.65, 0, 0.35, 1) 140ms both",
        "slide-in-right": "slide-in-right 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in-left": "slide-in-left 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 200ms ease-out both",
        "drawer-in": "drawer-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
