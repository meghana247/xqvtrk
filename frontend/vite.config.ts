import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // In development, forward API calls to the local backend.
  server: { proxy: { "/api": "http://localhost:8000" } },
});
