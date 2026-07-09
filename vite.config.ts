import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig(({ command }) => ({
  plugins: [
    dts({
      // rollupTypes: true,
      include: ['src/index.ts', 'src/yk-player.ts', 'src/utils.ts'],
    }),
  ],
  // public/ only holds demo assets (sample videos) - keep it served in dev,
  // but don't ship it as part of the built library
  publicDir: command === 'build' ? false : 'public',
  build: {
    lib: {
      entry: 'src/index.ts',
      fileName: 'yk-player',
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^lit/, 'hls.js'],
    },
  },
}))
