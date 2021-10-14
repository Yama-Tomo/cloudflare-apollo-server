// fork node_modules/@cfworker/dev/src/bundler.js

import { EventEmitter } from 'events';
import build, { BuildOptions, BuildResult, OutputFile } from 'esbuild';
import glob from 'glob';
import path from 'path';
import { CustomBundler, Logger } from './types';
import { options } from '../build_opts';

const isAbsolute = (path: string) => path.startsWith('/');

type Depends = { logger: Logger };
export class Bundler extends EventEmitter implements CustomBundler {
  public code;
  public bundled;
  public dispose;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private buildDone = () => {};
  private globs;
  private logger;
  private watch;

  constructor(
    globs: string[],
    watch: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    external: string[] = [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    typeCheck = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    treeShake = true,
    { logger }: Depends
  ) {
    super();

    this.globs = globs;
    this.logger = logger;
    this.watch = watch;
    this.code = '';
    this.bundled = new Promise<void>((resolve) => (this.buildDone = resolve));
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.dispose = () => {};
  }

  async bundle(): Promise<void> {
    const entryPoints = this.globs.map((g) => glob.sync(g)).flat();

    const opts: BuildOptions = {
      ...options(),
      stdin: {
        contents: entryPoints.map((f) => `import "${isAbsolute(f) ? '' : './'}${f}"`).join('\n'),
        resolveDir: path.resolve(__dirname, '..', '..'),
        loader: 'ts',
      },
      minify: false,
      sourcemap: 'inline',
      write: false,
    };
    if (this.watch) {
      build
        .build({
          ...opts,
          watch: {
            onRebuild: (_, res) => {
              if (res != null) {
                this.updateCode(res);
              }
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

  private updateCode(buildResult: BuildResult & { outputFiles?: OutputFile[] }) {
    const code = buildResult?.outputFiles?.map((out) => out.text).join(' ');
    if (!code) {
      return;
    }

    this.dispose = () => buildResult.stop?.();
    this.code = code;
    this.emit('bundle-end');
    this.logger.success(`bundle successfully`);
    this.buildDone();
  }
}
