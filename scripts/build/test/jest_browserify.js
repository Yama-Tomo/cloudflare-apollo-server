// jest-mock, マッチャをブラウザ上で実行できるようにする js をバンドルするためのエントリポイント

window.jest = require('jest-mock');
window.expect = require('expect');
