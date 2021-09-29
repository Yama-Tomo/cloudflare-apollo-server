const path = require('path');
const build = require('esbuild');
const opts = require('./build_opts');

build
  .build({ ...opts(), entryPoints: [path.resolve(__dirname, '..', '..', 'src', 'index.ts')] })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
