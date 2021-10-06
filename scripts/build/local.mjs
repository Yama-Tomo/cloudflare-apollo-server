// fork node_modules/@cfworker/dev/src/bundler.js

import { EventEmitter } from 'events';
import build from 'esbuild';
import buildOpts from './build_opts.js';
import glob from 'glob';
import path from 'path';

const dirname = path.dirname(new URL(import.meta.url).pathname);

export class Bundler extends EventEmitter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(globs, watch, external = [], typeCheck = true, treeShake = true, { logger }) {
    super();

    this.globs = globs;
    this.logger = logger;
    this.watch = watch;
    this.code = '';
    this.bundled = new Promise((resolve) => (this.setBundled = resolve));
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.dispose = () => {};
  }

  async bundle() {
    const entryPoints = this.globs.map((g) => glob.sync(g)).flat();

    const opts = {
      ...buildOpts(),
      stdin: {
        contents: entryPoints.map((f) => `import "./${f}"`).join('\n'),
        resolveDir: path.resolve(dirname, '..', '..'),
        loader: 'ts',
      },
      minify: false,
      write: false,
    };
    if (this.watch) {
      build
        .build({
          ...opts,
          watch: {
            onRebuild: (err, res) => {
              this.updateCode(res);
            },
          },
        })
        .then((res) => this.updateCode(res));
    } else {
      this.emit('bundle-start');

      build.build(opts).then((res) => this.updateCode(res));
    }

    return this.bundled;
  }

  updateCode(buildResult) {
    const code = buildResult?.outputFiles.map((out) => out?.text || '').join(' ');
    if (!code) {
      return;
    }

    this.dispose = () => typeof buildResult.stop === 'function' && buildResult.stop();
    this.code = code;
    this.emit('bundle-end');
    this.logger.success(`bundle successfully`);
    this.setBundled();
  }
}
