const path = require('path');
const alias = require('esbuild-plugin-alias');

const shims = {
  empty: path.resolve(__dirname, '..', '..', 'src', 'shims', 'empty.ts'),
  buffer: path.resolve(__dirname, '..', '..', 'src', 'shims', 'buffer.ts'),
};

module.exports = () => ({
  outdir: path.resolve(__dirname, '..', '..', 'dist'),
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
