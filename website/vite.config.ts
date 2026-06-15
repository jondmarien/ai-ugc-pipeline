import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three.js core alone is ~600 kB minified, so the WebGL bundle can't go
    // under 500 kB. It's already lazy-loaded (see Hero.tsx), so set the warning
    // to a realistic budget for the 3D vendor chunk instead of crying wolf.
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        // Split rarely-changing three/R3F into its own long-cached vendor chunk,
        // separate from the frequently-edited scene code.
        codeSplitting: {
          groups: [
            { name: "three-vendor", test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/ },
          ],
        },
      },
    },
  },
});
