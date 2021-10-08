import path from 'path';
import alias from 'esbuild-plugin-alias';
import { BuildOptions } from 'esbuild';

const shims = {
  empty: path.resolve(__dirname, '..', '..', 'src', 'shims', 'empty.ts'),
  buffer: path.resolve(__dirname, '..', '..', 'src', 'shims', 'buffer.ts'),
};

const options = (): BuildOptions => ({
  outfile: path.resolve(__dirname, '..', '..', 'dist', 'index.js'),
  bundle: true,
  minify: true,
  define: {
    global: 'self',
    'process.env.NODE_ENV': process.env.NODE_ENV ? `'${process.env.NODE_ENV}'` : `'development'`,
  },
  plugins: [
    alias({
      crypto: shims.empty,
      zlib: shims.empty,
      https: shims.empty,
      os: shims.empty,
      buffer: shims.buffer,
    }),
  ],
});

export { options, shims };
