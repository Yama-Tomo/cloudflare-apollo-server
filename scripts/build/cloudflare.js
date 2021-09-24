const build = require('esbuild');
const opts = require('./build_opts');

build.build(opts()).catch((err) => {
  console.error(err);
  process.exit(1);
});
