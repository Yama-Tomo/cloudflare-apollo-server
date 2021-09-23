# Cloudflare Apollo Server

## setup

- 1. create `wrangler.toml` (There is a sample in `wrangler.toml.sample`)
  ```bash
  $ touch wrangler.toml
  ```
- 2. start dev server
  ```bash
  $ pnpm install
  $ pnpm dev
  ```
- 3. go to https://studio.apollographql.com/sandbox/explorer and set the `SANDBOX` to `http://127.0.0.1:8787/`

## deploy

```bash
$ pnpm deploy:prod
```
