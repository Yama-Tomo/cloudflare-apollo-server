type User = {
  name: string;
  id: string;
};

type Context = {
  user?: User;
};

export type { User, Context };
