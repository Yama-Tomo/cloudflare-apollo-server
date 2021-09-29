// eslint-disable-next-line @typescript-eslint/no-var-requires
const bufferBrowserify = require('node_modules/buffer');

global.Buffer = bufferBrowserify.Buffer;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export = bufferBrowserify;
