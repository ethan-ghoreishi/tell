/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// Nothing leaves the device: the shipped app may reach only its own files.
// Static hosts can't set headers, so the policy ships as a meta tag. Build
// only, because the dev server needs an inline preamble.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
].join('; ');

export default defineConfig({
  // Relative base: the build runs from any host or sub-path; hash routing needs no rewrites.
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version) },
  server: { port: 5291 },
  preview: { port: 4291 },
  plugins: [
    react(),
    {
      name: 'inject-csp',
      apply: 'build',
      transformIndexHtml: () => [
        { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
      ],
    },
    VitePWA({
      // The app asks before updating; it never reloads itself mid-round.
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Tell',
        short_name: 'Tell',
        description: 'See what would make a choice clearer: short stories to think with, and a workshop for your own choices.',
        lang: 'en-GB',
        theme_color: '#f4f1ea',
        background_color: '#f4f1ea',
        display: 'standalone',
        // Tell is a phone app (owner decision 2026-10-08).
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // Browser journeys start a dev server and drive real engines.
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
});
