type User = {
  name: string;
  id: string;
};

type Context = {
  user?: User;
};

type ContextFunctionParams = {
  request: Request;
};

const context = ({ request }: ContextFunctionParams): Context => {
  if (request.headers.get('agent-number') === '007') {
    return { user: { id: '007', name: 'James Bond' } };
  }

  return {};
};

export type { User, Context, ContextFunctionParams };
export { context };
