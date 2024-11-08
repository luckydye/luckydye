const colors = {
  "bg-0": "var(--color-bg-0)",
  "bg-1": "var(--color-bg-1)",
  "fg-0": "var(--color-fg-0)",
  "fg-1": "var(--color-fg-1)",
  accent: "var(--color-accent)",
  text: "var(--color-text)",
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,md,mdx,ts,tsx}"],
  theme: {
    fontFamily: {
      copy: ["Lato", "sans-serif"],
      headline: ["Domine", "serif"],
    },
    extend: {
      colors: colors,
      backgroundColor: colors,
    },
  },
};
