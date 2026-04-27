import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: {
    tsconfig: './tsconfig.json',
    compilerOptions: {
      composite: false,
    },
  },
  sourcemap: true,
  clean: true,
  target: 'node20',
  splitting: false,
});
