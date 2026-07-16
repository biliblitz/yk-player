import { defineConfig } from 'vite'

// Builds the demo page (index.html) as a static site for GitHub Pages,
// as opposed to vite.config.ts which builds the library for npm.
export default defineConfig({
  base: '/yk-player/',
  build: {
    outDir: 'dist-pages',
  },
})
