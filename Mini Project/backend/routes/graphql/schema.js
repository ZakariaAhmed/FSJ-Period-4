const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

// To remove e.g. the password field from User, simply delete the line, and it won't be possible to retrieve it.
const typeDefs = `
  scalar DateTime
  scalar EmailAddress
  scalar URL

  type User {
    _id: ID
    firstName: String
    lastName: String
    userName: String
    password: String
    email: EmailAddress
    job: [Job]
    created: DateTime
    lastUpdated: DateTime
  }

  input UserInput {
    firstName: String!
    lastName: String!
    userName: String!
    password: String!
    email: EmailAddress!
    job: [JobInput]
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    userName: String
    password: String
    email: EmailAddress
    job: [JobInput]
  }

  type Job {
    type: String
    company: String
    companyUrl: URL
  }

  input JobInput {
    type: String
    company: String
    companyUrl: URL
  }

  type Author {
    _id: ID
    userName: String
    email: EmailAddress
  }

  type LocationBlog {
    _id: ID
    author: Author
    info: String
    pos: Position
    likedBy: [Author]
    likedByCount: Int
    created: DateTime
    lastUpdated: DateTime
  }

  type LocationBlogMutation {
    _id: ID
    author: ID
    info: String
    pos: Position
    likedBy: [ID]
    likedByCount: Int
    created: DateTime
    lastUpdated: DateTime
  }

  input LocationBlogInput {
    author: ID!
    info: String!
    longitude: Float!
    latitude: Float!
  }

  input UpdateLocationBlogInput {
    info: String
    longitude: Float
    latitude: Float
  }

  type Position {
    longitude: Float
    latitude: Float
  }

  type Mutation {
    addUser(input: UserInput!): User
    addJobToUser(userId: ID!, input: [JobInput!]): User
    updateUser(userId: ID!, input: UpdateUserInput!): User
    deleteUser(userId: ID!): User

    addLocationBlog(input: LocationBlogInput!): LocationBlogMutation
    likeLocationBlog(blogId: ID!, authorId: ID!): LocationBlogMutation
    updateLocationBlog(blogId: ID!, input: UpdateLocationBlogInput!): LocationBlogMutation
    deleteLocationBlog(blogId: ID!): LocationBlogMutation
  }

  input LoginInput {
    userName: String!
    password: String!
    longitude: Float!
    latitude: Float!
    distance: Int!
  }

  type Friend {
    userName: String
    latitude: Float
    longitude: Float
  }

  type Friends {
    friends: [Friend]
  }

  type Query {
    getAllUsers: [User]
    findUserById(userId: ID!): User
    findUserByUserName(userName: String!): User
    findUserByEmail(email: EmailAddress!): User

    getAllLocationBlogs: [LocationBlog]
    findLocationBlogById(blogId: ID!): LocationBlog
    findLocationBlogsByAuthor(authorId: ID!): [LocationBlog]

    login(input: LoginInput!): Friends
  }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });
module.exports = schema;
