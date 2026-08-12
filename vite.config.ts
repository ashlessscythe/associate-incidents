import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Prefer 127.0.0.1 over "localhost" so the Node proxy avoids Windows IPv6 (::1) mismatches.
// Browser access via either http://localhost:5173 or http://127.0.0.1:5173 still works
// because the frontend calls relative "/zapi" on the same origin.
const apiPort = process.env.PORT || "8000";
const apiProxy = {
  "/zapi": {
    target: `http://127.0.0.1:${apiPort}`,
    changeOrigin: true,
    secure: false,
  },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: "node",
    // Node 25+ ships a stub localStorage that shadows jsdom's implementation.
    // Disable it so AuthContext and other jsdom tests can use real Storage APIs.
    execArgv:
      Number(process.versions.node.split(".")[0]) >= 25
        ? ["--no-webstorage"]
        : [],
    setupFiles: ["./src/test/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx,js,jsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx,js,jsx}",
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
    },
  },
});
