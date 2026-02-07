import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
const externalPackages = ['react', 'react-dom', 'lodash', 'rxjs'];

export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: 'lib/index.ts',
      name: 'dantian',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: (id) =>
        externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`)),
      output: {
        globals: {
          react: 'React',
        },
      },
    },
  },
  plugins: [
    dts({ tsconfigPath: './tsconfig.build.json', insertTypesEntry: true }),
  ],
});
