import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4410,
    strictPort: true,
    proxy: { "/api": "http://localhost:4400" },
  },
  resolve: {
    alias: { "@shared": path.resolve(__dirname, "shared") },
  },
});
