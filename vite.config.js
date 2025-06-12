import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from 'fs'
import Terminal from 'vite-plugin-terminal'

export default defineConfig({
  plugins: [
    react(),
    Terminal({
      console: 'terminal'
    })
  ],
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
    host: true, // Allow external connections for mobile testing
    port: 5173,
    hmr: {
      port: 5174, // Use a different port for HMR
    },
    allowedHosts: [
      "darling-treefrog-settled.ngrok-free.app",
      "thorough-suitable-bonefish.ngrok-free.app",
      "localhost",
      "127.0.0.1"
    ]
  }
});