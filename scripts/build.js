const path = require('path');
const build = require('esbuild');
const alias = require('esbuild-plugin-alias');

const shims = {
  empty: path.resolve(__dirname, '..', 'src', 'shims', 'empty.ts'),
  buffer: path.resolve(__dirname, '..', 'src', 'shims', 'buffer.ts'),
};

build
  .build({
    entryPoints: [path.resolve(__dirname, '..', 'src', 'index.ts')],
    outfile: path.resolve(__dirname, '..', 'dist', 'index.js'),
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
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
