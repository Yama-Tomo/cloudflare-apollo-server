#!/bin/sh

set -e

dirname=$(cd $(dirname $0);pwd)

pnpm -- node -r esbuild-register ${dirname}/programs/prepare_cfworker_dev_ext.ts
CFWORKER_CUSTOM_BUNDLER=${dirname}/programs/.cfworker_dev_ext.js pnpm -- cfworker run -w ${dirname}/../src/index.ts
