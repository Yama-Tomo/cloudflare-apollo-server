// fork node_modules/@cfworker/dev/src/test-host.js

import path from 'path';
import { promises as fs } from 'fs';
import { EventEmitter } from 'events';
import build from 'esbuild';
import alias from 'esbuild-plugin-alias';
import { fromSource } from 'convert-source-map';
import v8toIstanbul from 'v8-to-istanbul';
import libCov from 'istanbul-lib-coverage';

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

    if (process.env.COVERAGE === 'true') {
      await page.coverage.startJSCoverage({ includeRawScriptCoverage: true });
    }
    const failures = await page.evaluate(
      // eslint-disable-next-line no-undef
      () => new Promise((resolve) => mocha.run(resolve))
    );

    if (process.env.COVERAGE === 'true') {
      const covs = await page.coverage.stopJSCoverage();
      await this.collectCoverage(covs);
    }

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

  async collectCoverage(coverages) {
    const covTarget = coverages.find((cov) => cov.url.includes('/test.js'));
    if (!covTarget) {
      return;
    }

    const bundledTestCode = this.stripCfWorkerDevAppendCodes(covTarget.text);

    const sourceMap = fromSource(bundledTestCode);
    await this.fillEmptyStringSourcesContent(sourceMap);

    // このパスは実在しないパスでも OK．ただし 1 階層ディレクトリをはさむパスにする必要がある
    // source map に記載されているパスが 1 階層深いのでこのパスも階層を合わせないとカバレッジレポートを出力する際にソースコードを探し出せないため
    const dummyScriptPath = `.dummy/bundled_test_code.js`;
    const converter = v8toIstanbul(
      dummyScriptPath,
      0,
      { source: bundledTestCode, sourceMap: sourceMap },
      (path) => path.includes('/node_modules/')
    );

    await converter.load();
    converter.applyCoverage(this.reCalcScriptCoverageRanges(covTarget.rawScriptCoverage.functions));

    const cmap = libCov.createCoverageMap(converter.toIstanbul());
    await fs.mkdir('.nyc_output', { recursive: true });
    await fs.writeFile('.nyc_output/out.json', JSON.stringify(cmap.toJSON(), null, 2), 'utf-8');

    converter.destroy();
  }

  stripCfWorkerDevAppendCodes(bundledTestCode) {
    const bundledTestCodeLines = bundledTestCode.split('\n');
    return bundledTestCodeLines.slice(3, bundledTestCodeLines.length - 3).join('\n');
  }

  // v8toIstanbul で null の sourcesContent があるとエラーが発生するのでその workaround
  async fillEmptyStringSourcesContent(sourceMap) {
    sourceMap.sourcemap.sourcesContent.forEach((content, idx) => {
      if (content) {
        return;
      }

      const filePath = sourceMap.sourcemap.sources[idx];
      if (!filePath.includes('/node_modules/')) {
        this.logger.warn(`sourcesContent is null: ${filePath}`);
      }

      sourceMap.sourcemap.sourcesContent[idx] = '';
    });
  }

  // @cfworker/dev が追加するコードの文字数分削除したカバレッジに計算し直す
  reCalcScriptCoverageRanges(scriptCoverages) {
    const cfWorkerDevAppendCodesLen = 72;
    return scriptCoverages.map((cov) => {
      return !('ranges' in cov)
        ? cov
        : {
            ...cov,
            ranges: cov.ranges.map(({ startOffset, endOffset, ...rest }) => ({
              ...rest,
              startOffset: startOffset - cfWorkerDevAppendCodesLen,
              endOffset: endOffset - cfWorkerDevAppendCodesLen,
            })),
          };
    });
  }
}
