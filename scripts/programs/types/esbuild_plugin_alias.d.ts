declare module 'esbuild-plugin-alias' {
  import { Plugin } from 'esbuild';
  export default function (aliases: Record<string, string>): Plugin;
}
