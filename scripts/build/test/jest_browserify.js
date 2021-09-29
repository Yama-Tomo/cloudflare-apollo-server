// jest-mock, マッチャをブラウザ上で実行できるようにする js をバンドルするためのエントリポイント

// 循環参照している変数の console.log ができるようにするための目的で使う
window._fss = require('fast-safe-stringify');

window.jest = require('jest-mock');
window.expect = require('expect');
