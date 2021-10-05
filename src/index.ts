import { createServer } from './server';

const server = createServer();

addEventListener('fetch', (event) => {
  event.respondWith(server.dispatch(event.request));
});
