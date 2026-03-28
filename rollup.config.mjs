import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
  input: './src/timecode.ts',
  output: [
    {
      file: './dist/timecode.js',
      format: 'es',
      name: 'Timecode',
    },
    {
      file: './dist/timecode.min.js',
      format: 'umd',
      name: 'Timecode',
      plugins: [terser()],
    },
  ],
  strictDeprecations: true,
  plugins: [typescript()],
};
