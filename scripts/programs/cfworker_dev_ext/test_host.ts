/* eslint-disable @typescript-eslint/ban-ts-comment */

// fork node_modules/@cfworker/dev/src/test-host.js

import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import build from 'esbuild';
import alias from 'esbuild-plugin-alias';
import { fromSource, SourceMapConverter } from 'convert-source-map';
import v8toIstanbul from 'v8-to-istanbul';
import libCov from 'istanbul-lib-coverage';
import { JSCoverageEntry, Page } from 'puppeteer';
import { CustomTestHost, KV, Logger, StaticSite, WorkerHost } from './types';
import { shims } from '../build_opts';

type Depends = { WorkerHost: typeof WorkerHost; logger: Logger };
export class TestHost extends EventEmitter implements CustomTestHost {
  public workerHost;
  private inspect;
  private logger;
  private testsRan = false;
  private _jestBrowserify = '';

  constructor(
    port: number,
    inspect: boolean,
    site: StaticSite | null,
    kv: KV,
    { WorkerHost, logger }: Depends
  ) {
    super();
    this.inspect = inspect;
    this.logger = logger;
    this.workerHost = new WorkerHost(port, inspect, site, kv);
  }

  start(): Promise<void> {
    return this.workerHost.start();
  }

  dispose(): void {
    this.workerHost.dispose();
  }

  async runTests(code: string, manifest: Record<string, string> | null): Promise<unknown> {
    this.emit('test-start');

    const startTime = Date.now();
    this.testsRan = true;
    this.logger.progress('Waiting for worker host...');

    const page = await this.workerHost.pageReady;
    if (this.testsRan) {
      this.logger.progress('Reloading worker host...');
      await this.workerHost.reloadPage(); // reset so that tests can be rerun.
    }

    this.testsRan = true;
    this.logger.progress('Loading mocha and chai...');
    await this.setup(page, this.workerHost.server.pathPrefix);
    const globals = ['mocha'];

    await this.workerHost.setWorkerCode(code, '/test.js', globals, manifest);

    this.logger.progress('Running tests...');

    if (process.env.COVERAGE === 'true') {
      await page.coverage.startJSCoverage({ includeRawScriptCoverage: true });
    }
    const failures = await page.evaluate(
      () => new Promise<number>((resolve) => mocha.run(resolve))
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

  private async setup(page: Page, pathnamePrefix: string) {
    // @ts-ignore
    await page.evaluate(() => (document.body.id = 'mocha'));
    await page.addStyleTag({ url: `${pathnamePrefix}/node_modules/mocha/mocha.css` });
    await page.addScriptTag({ url: `${pathnamePrefix}/node_modules/mocha/mocha.js` });
    await page.addScriptTag({ content: await this.jestBrowserify() });

    await page.evaluate<(inspect: boolean) => void>((inspect) => {
      mocha.setup({
        ui: 'bdd',
        reporter: inspect ? 'html' : 'spec',
        color: !this.inspect,
      });

      mocha.checkLeaks();

      // テストランナーは mocha だけど jest ライクにテストコードを記述できるように関数をカスタマイズする
      const originalMochaFunctions: Record<string, Mocha.TestFunction> = {
        // @ts-ignore
        it: self.it,
      };

      // @ts-ignore
      self.it = function (name: string, fn: () => Promise<void>, timeout?: number) {
        originalMochaFunctions.it(name, async function () {
          if (timeout) {
            this.timeout(timeout);
          }
          await fn();
        });
      };

      // mocha doesn't catch unhandledrejections yet.
      // https://github.com/mochajs/mocha/issues/2640
      addEventListener('unhandledrejection', (event) => event.reason);
    }, this.inspect);
  }

  private async jestBrowserify() {
    if (this._jestBrowserify) {
      return this._jestBrowserify;
    }

    const jestCode = await build
      .build({
        // entryPoints: [path.resolve(__dirname, 'test', 'jest_browserify.js')],
        stdin: {
          contents: `
// jest-mock, マッチャをブラウザ上で実行できるようにする js をバンドルするためのエントリポイント

// 循環参照している変数の console.log ができるようにするための目的で使う
window._fss = require('fast-safe-stringify');

window.jest = require('jest-mock');
window.expect = require('expect');
`,
          resolveDir: path.resolve(__dirname),
          loader: 'js',
        },
        bundle: true,
        write: false,
        define: {
          global: 'self',
          process: JSON.stringify({ env: {} }),
        },
        plugins: [
          alias({
            url: shims.empty,
            path: shims.empty,
            module: shims.empty,
            util: shims.empty,
            'graceful-fs': shims.empty,
          }),
        ],
      })
      .then(
        (res) =>
          res.outputFiles.pop()?.text || 'throw new Error("bundle error of jest for browser")'
      )
      .catch(() => {
        console.trace();
      });

    if (jestCode) {
      this.logger.success('bundle jest-browserify successfully');
      this._jestBrowserify = jestCode;
    }

    return this._jestBrowserify;
  }

  private async collectCoverage(coverages: JSCoverageEntry[]) {
    const covTarget = coverages.find((cov) => cov.url.includes('/test.js'));
    if (!covTarget) {
      return;
    }

    const bundledTestCode = this.stripCfWorkerDevAppendCodes(covTarget.text);

    const sourceMap = fromSource(bundledTestCode);
    if (!sourceMap) {
      return;
    }

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
    converter.applyCoverage(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.reCalcScriptCoverageRanges(covTarget.rawScriptCoverage!.functions)
    );

    const cmap = libCov.createCoverageMap(converter.toIstanbul());
    await fs.mkdir('.nyc_output', { recursive: true });
    await fs.writeFile('.nyc_output/out.json', JSON.stringify(cmap.toJSON(), null, 2), 'utf-8');

    converter.destroy();
  }

  private stripCfWorkerDevAppendCodes(bundledTestCode: string) {
    const bundledTestCodeLines = bundledTestCode.split('\n');
    return bundledTestCodeLines.slice(3, bundledTestCodeLines.length - 3).join('\n');
  }

  // v8toIstanbul で null の sourcesContent があるとエラーが発生するのでその workaround
  private fillEmptyStringSourcesContent(sourceMap: SourceMapConverter) {
    sourceMap.sourcemap.sourcesContent.forEach((content: string, idx: number) => {
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
  private reCalcScriptCoverageRanges(
    scriptCoverages: NonNullable<JSCoverageEntry['rawScriptCoverage']>['functions']
  ) {
    const cfWorkerDevAppendCodesLen = 72;
    return scriptCoverages.map((cov) => ({
      ...cov,
      ranges: cov.ranges.map(({ startOffset, endOffset, ...rest }) => ({
        ...rest,
        startOffset: startOffset - cfWorkerDevAppendCodesLen,
        endOffset: endOffset - cfWorkerDevAppendCodesLen,
      })),
    }));
  }
}
