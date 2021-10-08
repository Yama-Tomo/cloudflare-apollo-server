#!/bin/sh

set -e

dirname=$(cd $(dirname $0);pwd)

pnpm lint
pnpm -- node -r esbuild-register ${dirname}/programs/production_build.ts
