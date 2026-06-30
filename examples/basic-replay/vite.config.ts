import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use repo source while developing locally (skip rebuild on every change).
      "cs2-demo-viewer": path.resolve(__dirname, "../../src"),
    },
  },
  server: {
    port: 5174,
  },
});
