import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/auth": "http://localhost:3000",
      "/videos": "http://localhost:3000",
      "/users": "http://localhost:3000",
      "/audit": "http://localhost:3000",
      "/health": "http://localhost:3000",
      "/download-requests": "http://localhost:3000",
      "/hls": "http://localhost:3000",
      "/key": "http://localhost:3000",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: mode === "development",
  },
}));
