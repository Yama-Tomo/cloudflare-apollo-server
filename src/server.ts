import { ApolloServer } from 'apollo-server-cloudflare';
import { graphqlCloudflare } from 'apollo-server-cloudflare/dist/cloudflareApollo';

export class ExtendApolloServer extends ApolloServer {
  serverlessFramework(): boolean {
    return true;
  }

  dispatch(request: Request): Promise<Response> {
    const options = () => this.createGraphQLServerOptions(request);
    return graphqlCloudflare(options)(request) as Promise<Response>;
  }
}
