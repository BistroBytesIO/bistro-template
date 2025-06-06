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
    https: {
      key: fs.readFileSync('./localhost+3-key.pem'),
      cert: fs.readFileSync('./localhost+3.pem'),
    },
    host: '0.0.0.0',
    port: 5173,
  },
});