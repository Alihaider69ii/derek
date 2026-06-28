import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-base)",
        foreground: "var(--text-primary)",
        bg: {
          base: "var(--bg-base)",
          panel: "var(--bg-panel)",
          input: "var(--bg-input)",
          hover: "var(--bg-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        accent2: {
          DEFAULT: "var(--accent-2)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        border: "var(--border)",
        gold: {
          DEFAULT: "var(--gold)",
          text: "var(--gold-text)",
        },
        success: "var(--success)",
        danger: "var(--danger)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        btn: "var(--radius-btn)",
        badge: "var(--radius-badge)",
      },
      fontFamily: {
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      }
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
