#!/bin/sh

set -e

dirname=$(cd $(dirname $0);pwd)

COVERAGE=true ${dirname}/test.sh ${@}
pnpm nyc report --reporter=html
