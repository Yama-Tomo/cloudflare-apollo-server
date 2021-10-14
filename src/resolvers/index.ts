import { Resolvers } from './generated_types';

const resolvers: Resolvers = {
  Query: {
    hello: (parent, args, ctx) => {
      const name = ctx.user?.name ? `${ctx.user.name} ` : '';
      return `${name}Hello world!`;
    },
  },
};

export { resolvers };
