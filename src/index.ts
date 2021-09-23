import { ExtendApolloServer } from './server';
import { resolvers } from './resolvers';
import { typeDefs } from './schema';
import { applyForCORS } from './cors';

const server = new ExtendApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV === 'development',
});

const enableCORS = true;

addEventListener('fetch', (event) => {
  const graphqlResponse = () => server.dispatch(event.request);
  const response = enableCORS ? applyForCORS(event.request, graphqlResponse) : graphqlResponse();

  event.respondWith(response);
});
