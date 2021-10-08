import path from 'path';
import build from 'esbuild';

build
  .build({
    stdin: {
      contents: `
export * from './cfworker_dev_ext/bundler';
export * from './cfworker_dev_ext/test_host';
`,
      resolveDir: path.resolve(__dirname),
      loader: 'ts',
    },
    outfile: path.resolve(__dirname, '.cfworker_dev_ext.js'),
    bundle: true,
    external: [
      'events',
      'glob',
      'path',
      'fs',
      'esbuild',
      'esbuild-plugin-alias',
      'convert-source-map',
      'v8-to-istanbul',
      'istanbul-lib-coverage',
      'puppeteer',
    ],
    platform: 'node',
    format: 'cjs',
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
