import { gql } from 'apollo-server-cloudflare';

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

export { typeDefs };
