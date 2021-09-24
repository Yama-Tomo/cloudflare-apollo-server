// fork node_modules/@cfworker/dev/src/bundler.js

import { EventEmitter } from 'events';
import build from 'esbuild';
import buildOpts from './build_opts.js';

export class Bundler extends EventEmitter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(globs, watch, external = [], typeCheck = true, logger) {
    super();

    this.logger = logger;
    this.watch = watch;
    this.code = '';
    this.bundled = new Promise((resolve) => (this.setBundled = resolve));
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.dispose = () => {};
  }

  async bundle() {
    const opts = { ...buildOpts(), minify: false, write: false };
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
    const code = buildResult?.outputFiles[0]?.text;
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
