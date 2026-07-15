import { defineConfig } from 'vite';

export default defineConfig({
  base: '/love-letter/',
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
