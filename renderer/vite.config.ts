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
  // This app is built only so Playwright can screenshot exact-size slide roots locally; it is
  // never shipped over a network, so chunk size is cosmetic. Still, split node_modules out of the
  // entry chunk (react / fonts / other vendor) for cleaner output, and lift the warning threshold
  // so the build log stays quiet.
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@fontsource")) return "fonts";
          if (id.includes("/react") || id.includes("react-dom") || id.includes("/scheduler")) return "react-vendor";
          return "vendor";
        },
      },
    },
  },
});
