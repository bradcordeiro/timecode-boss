import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
  input: './timecode/timecode.ts',
  output: [
    {
      file: './dist/timecode.js',
      format: 'umd',
      name: 'timecode-boss',
    },
    {
      file: './dist/timecode.min.js',
      format: 'umd',
      name: 'timecode-boss',
      plugins: [terser()],
    },
  ],
  plugins: [typescript()],
};
