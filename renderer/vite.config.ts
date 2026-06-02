import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Static preview app used by Playwright to screenshot exact-size slide roots.
// No Tailwind plugin: slides are styled with inline styles from src/design/tokens.ts.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: { port: 4317, strictPort: true },
  preview: { port: 4317, strictPort: true },
});
