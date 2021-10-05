import { ApolloServer, Config } from 'apollo-server-cloudflare';
import { graphqlCloudflare } from 'apollo-server-cloudflare/dist/cloudflareApollo';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { applyForCORS } from './cors';

type CFOpts = { enableCORS?: boolean };

class ExtendApolloServer extends ApolloServer {
  protected cfOpts;

  constructor(config: Config, cfOpts?: CFOpts) {
    super(config);

    this.cfOpts = cfOpts || {};
    if (!('enableCORS' in this.cfOpts)) {
      this.cfOpts.enableCORS = true;
    }
  }

  serverlessFramework(): boolean {
    return true;
  }

  dispatch(request: Request): Response | Promise<Response> {
    const _dispatch = () => {
      const options = () => this.createGraphQLServerOptions(request);
      return graphqlCloudflare(options)(request) as Promise<Response>;
    };

    return this.cfOpts.enableCORS ? applyForCORS(request, _dispatch) : _dispatch();
  }
}

const createServer = (cfOpts?: CFOpts) => {
  return new ExtendApolloServer(
    {
      typeDefs,
      resolvers,
      introspection: process.env.NODE_ENV === 'development',
    },
    cfOpts
  );
};

export { createServer };
export type { CFOpts };
