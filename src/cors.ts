const accessControlAllowOrigin = ['Access-Control-Allow-Origin', '*'] as const;

const handleOptions = (request: Request): Response => {
  const headers = request.headers;

  if (
    headers.get('Origin') != null &&
    headers.get('Access-Control-Request-Method') != null &&
    headers.get('Access-Control-Request-Headers') != null
  ) {
    return new Response(null, {
      headers: {
        ...Object.fromEntries([accessControlAllowOrigin]),
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || '',
      },
    });
  }

  return new Response(null, { headers: { Allow: 'GET, HEAD, POST, OPTIONS' } });
};

const applyForCORS = (
  request: Request,
  next: () => Promise<Response>
): Response | Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  return next().then((response) => {
    response.headers.set(...accessControlAllowOrigin);
    return response;
  });
};

export { applyForCORS };
