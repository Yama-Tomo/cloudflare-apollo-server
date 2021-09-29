// fork node_modules/@cfworker/dev/src/test-host.js

import path from 'path';
import { EventEmitter } from 'events';
import build from 'esbuild';
import alias from 'esbuild-plugin-alias';

const dirname = path.dirname(new URL(import.meta.url).pathname);

export class TestHost extends EventEmitter {
  testsRan = false;
  _jestBrowserify = '';

  /**
   * @param {number} port
   * @param {boolean} inspect
   * @param {StaticSite | null} site
   * @param {KV} kv
   */
  constructor(port, inspect, site, kv, { WorkerHost, logger }) {
    super();
    this.inspect = inspect;
    this.logger = logger;
    this.workerHost = new WorkerHost(port, inspect, site, kv);
  }

  start() {
    return this.workerHost.start();
  }

  dispose() {
    this.workerHost.dispose();
  }

  /**
   * @param {string} code
   * @param {Record<string, string> | null} manifest
   */
  async runTests(code, manifest) {
    this.emit('test-start');

    const startTime = Date.now();
    const testsRan = this.testsRan;
    this.testsRan = true;
    this.logger.progress('Waiting for worker host...');

    const page = await this.workerHost.pageReady;
    if (testsRan) {
      this.logger.progress('Reloading worker host...');
      await this.workerHost.reloadPage(); // reset so that tests can be rerun.
    }

    this.testsRan = true;
    this.logger.progress('Loading mocha and chai...');
    await this.setup(page, this.workerHost.server.pathPrefix);
    const globals = ['mocha'];

    await this.workerHost.setWorkerCode(code, '/test.js', globals, manifest);
    /** @type {number} */
    this.logger.progress('Running tests...');

    const failures = await page.evaluate(
      // eslint-disable-next-line no-undef
      () => new Promise((resolve) => mocha.run(resolve))
    );

    if (failures) {
      this.logger.error('Failed');
    } else {
      this.logger.success('Passed', Date.now() - startTime);
    }

    this.emit('test-end', failures);
    return failures;
  }

  /**
   * @param {import('puppeteer').Page} page
   * @param {string} pathnamePrefix
   */
  async setup(page, pathnamePrefix) {
    await page.evaluate(() => (document.body.id = 'mocha'));
    await page.addStyleTag({ url: `${pathnamePrefix}/node_modules/mocha/mocha.css` });
    await page.addScriptTag({ url: `${pathnamePrefix}/node_modules/mocha/mocha.js` });
    await page.addScriptTag({ content: await this.jestBrowserify() });

    await page.evaluate((inspect) => {
      // eslint-disable-next-line no-undef
      mocha.setup({
        ui: 'bdd',
        reporter: inspect ? 'html' : 'spec',
        color: !this.inspect,
      });

      // eslint-disable-next-line no-undef
      mocha.checkLeaks();

      // テストランナーは mocha だけど jest ライクにテストコードを記述できるように関数をカスタマイズする
      const originalMochaFunctions = {
        it: self.it,
      };

      self.it = function (name, fn, timeout) {
        originalMochaFunctions.it(name, async function () {
          this.timeout(timeout);
          await fn();
        });
      };

      // mocha doesn't catch unhandledrejections yet.
      // https://github.com/mochajs/mocha/issues/2640
      addEventListener('unhandledrejection', (event) => event.reason);
    }, this.inspect);
  }

  async jestBrowserify() {
    if (this._jestBrowserify) {
      return this._jestBrowserify;
    }

    const emptyModule = path.resolve(dirname, '..', '..', 'src', 'shims', 'empty.ts');
    this._jestBrowserify = await build
      .build({
        entryPoints: [path.resolve(dirname, 'test', 'jest_browserify.js')],
        bundle: true,
        write: false,
        define: {
          global: 'self',
          process: JSON.stringify({ env: {} }),
        },
        plugins: [
          alias({
            path: emptyModule,
            module: emptyModule,
            util: emptyModule,
            'graceful-fs': emptyModule,
          }),
        ],
      })
      .then(
        (res) => res.outputFiles[0]?.text || 'throw new Error("bundle error of jest for browser")'
      )
      .catch(() => {
        console.trace();
      });

    this.logger.success('bundle jest-browserify successfully');

    return this._jestBrowserify;
  }
}
