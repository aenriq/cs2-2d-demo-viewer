import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  resolve: {
    alias: {
      "cs2-demo-viewer": path.resolve(__dirname, "../src"),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, ".."), path.resolve(__dirname, "../..")],
    },
  },
});
