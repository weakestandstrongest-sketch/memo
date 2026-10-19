/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // `host: true` listens on all network interfaces (0.0.0.0), so an iPhone on
    // the same Wi-Fi can open http://<your-PC-IP>:5173. See README.md.
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    // Safari 14+ on iPhone, current Chrome / Edge on Windows.
    target: ['es2020', 'safari14', 'chrome100', 'edge100'],
  },
  test: {
    environment: 'node',
  },
});
