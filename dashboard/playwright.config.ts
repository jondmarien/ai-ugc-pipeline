import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:4410", viewport: { width: 1440, height: 900 } },
  webServer: [
    { command: "bun server/index.ts", port: 4400, reuseExistingServer: true },
    { command: "bunx vite", port: 4410, reuseExistingServer: true, env: { VITE_E2E: "1" } },
  ],
});
