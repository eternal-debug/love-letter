import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          animation: ['gsap', 'lenis', 'split-type'],
          visual: ['three'],
          interface: ['lucide']
        }
      }
    }
  }
});
