const { gql } = require("apollo-server");
module.exports = gql`
  type User {
    username: String!
    email: String!
  }
  type Query {
    getUsers: [User]!
  }
  type Mutation {
    register(
      username: String!
      email: String!
      password: String!
      imageUrl: String
      confirmPassword: String!
    ): User!
  }
`;