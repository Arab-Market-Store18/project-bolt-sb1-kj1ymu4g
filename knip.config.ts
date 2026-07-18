import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/app/**/*.{ts,tsx}",
    "src/features/**/*.{ts,tsx}",
    "src/components/**/*.{ts,tsx}",
    "src/hooks/**/*.{ts,tsx}",
    "scripts/**/*.{js,ts}",
    "tools/**/*.{js,ts}",
    "supabase/functions/**/*.{ts,js}",
  ],
  project: [
    "src/**/*.{ts,tsx}",
    "scripts/**/*.{js,ts}",
    "tools/**/*.{js,ts}",
  ],
  ignore: [
    "next.config.js",
    "tailwind.config.ts",
    "postcss.config.js",
    "vercel.json",
  ],
};

export default config;