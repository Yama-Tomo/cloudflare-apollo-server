#!/bin/sh

set -e

dirname=$(cd $(dirname $0);pwd)

pnpm -- node -r esbuild-register ${dirname}/programs/prepare_cfworker_dev_ext.ts

ext_js=${dirname}/programs/.cfworker_dev_ext.js
CFWORKER_CUSTOM_BUNDLER=${ext_js} CFWORKER_CUSTOM_TEST_HOST=${ext_js} pnpm -- cfworker test -p 7001 ${@}
