import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['sockjs-client']
  },
  server: {
    hmr: {
      port: 5174, // Use a different port for HMR
    },
    allowedHosts: [
      "darling-treefrog-settled.ngrok-free.app",
    ]
  }
});