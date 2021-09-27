import { Resolvers } from './generated_types';

const resolvers: Resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
};

export { resolvers };
