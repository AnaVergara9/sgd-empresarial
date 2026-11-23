import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        discord: {
          darkest: "#1e1f22",
          dark: "#2b2d31",
          medium: "#313338",
          light: "#383a40",
          accent: "#5865f2",
          text: "#ffffff",
          muted: "#949ba4",
        },
      },
    },
  },
  plugins: [animate],
};

export default config;
