import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: 'lib/index.ts',
      name: 'dantian',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
        },
      },
    },
  },
  plugins: [dts({ include: ['lib'], insertTypesEntry: true })],
});
