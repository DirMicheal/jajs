import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/jajs.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/jajs.umd.js',
      format: 'umd',
      name: 'JaJS',
      sourcemap: true,
    },
    {
      file: 'dist/jajs.esm.min.js',
      format: 'esm',
      sourcemap: true,
      plugins: [terser()],
    },
    {
      file: 'dist/jajs.umd.min.js',
      format: 'umd',
      name: 'JaJS',
      sourcemap: true,
      plugins: [terser()],
    },
  ],
  plugins: [typescript()],
};
