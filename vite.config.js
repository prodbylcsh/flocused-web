import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths, so the build works from any host or sub-path.
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});
