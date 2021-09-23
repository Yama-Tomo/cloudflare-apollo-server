#!/bin/sh

set -e

if [ "${NODE_ENV}" = "production" ]; then
  pnpm lint
fi

pnpm build:code
