import path from 'path';
import build from 'esbuild';
import { options } from './build_opts';

build
  .build({ ...options(), entryPoints: [path.resolve(__dirname, '..', '..', 'src', 'index.ts')] })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
