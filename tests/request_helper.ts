import { CFOpts, createServer } from '../src/server';

const doRequest = async (
  query: string,
  opts?: Partial<{ cfOpts: CFOpts; headers: HeadersInit }>
): Promise<unknown> => {
  const server = createServer(opts?.cfOpts);

  const request = new Request(`/`, {
    body: JSON.stringify({ query }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.headers ? opts.headers : {}),
    },
  });

  const response = await server.dispatch(request);
  return response.json();
};

export { doRequest };
