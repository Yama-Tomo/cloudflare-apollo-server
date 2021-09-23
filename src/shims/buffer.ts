// eslint-disable-next-line @typescript-eslint/no-var-requires
const bufferBrowserify = require('node_modules/buffer');

global.Buffer = bufferBrowserify.Buffer;

export = bufferBrowserify;
