import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Same-origin door to the backend, so its httpOnly admin cookies work in dev.
      "/api": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
  resolve: {
    alias: { "@": "/src" },
  },
});
