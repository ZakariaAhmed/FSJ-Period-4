const userFacade = require('../../facades/userFacade');
const locationBlogFacade = require('../../facades/locationBlogFacade');
const login = require('../../facades/loginFacade');

const { DateTime, EmailAddress, URL } = require('@okgrow/graphql-scalars');

const resolvers = {
  // Custom scalar types.
  DateTime,
  EmailAddress,
  URL,

  Mutation: {
    // User-related mutations.
    addUser: (_, { input }) => {
      const firstName = input.firstName;
      const lastName = input.lastName;
      const userName = input.userName;
      const password = input.password;
      const email = EmailAddress.serialize(input.email); // Check if it's a valid email. If it fails, error will be thrown.
      const job = input.job;
      // Check if it's a valid URL for all jobs (multiple jobs can be added). If it fails, error will be thrown.
      job.forEach((element) => URL.serialize(element.companyUrl));
      return userFacade.addUser(firstName, lastName, userName, password, email, job);
    },
    addJobToUser: async (_, { userId, input }) => {
      const user = await userFacade.findById(userId);
      if (user !== null) {
        // Check if it's a valid URL for all jobs (multiple jobs can be added). If it fails, error will be thrown.
        input.forEach((element) => {
          URL.serialize(element.companyUrl);
        });
        await userFacade.addJobToUser(user, input);
      }
      return user;
    },
    updateUser: (_, { userId, input }) => {
      if (input.email) {
        // Check if it's a valid email. If it fails, error will be thrown.
        EmailAddress.serialize(input.email);
      }

      if (input.job.length > 0) {
        // Check if it's a valid URL for all jobs (multiple jobs can be added). If it fails, error will be thrown.
        input.job.forEach((element) => URL.serialize(element.companyUrl));
      }

      input._id = userId; // Assign the userId to the input.
      return userFacade.updateUser(input);
    },
    deleteUser: (_, { userId }) => {
      return userFacade.deleteUser(userId);
    },

    // LocationBlog-related mutations.
    addLocationBlog: (_, { input }) => {
      const author = input.author;
      const info = input.info;
      const longitude = input.longitude;
      const latitude = input.latitude;
      return locationBlogFacade.addLocationBlog({ _id: author }, info, longitude, latitude);
    },
    likeLocationBlog: (_, { blogId, authorId }) => {
      return locationBlogFacade.likeLocationBlog(blogId, authorId);
    },
    updateLocationBlog: (_, { blogId, input }) => {
      input.pos = { longitude: input.longitude, latitude: input.latitude };
      input._id = blogId; // Assign the blogId to the input.
      return locationBlogFacade.updateLocationBlog(input);
    },
    deleteLocationBlog: (_, { blogId }) => {
      return locationBlogFacade.deleteLocationBlog(blogId);
    },
  },

  Query: {
    // User-related queries.
    getAllUsers: () => {
      return userFacade.getAllUsers();
    },
    findUserById: (_, { userId }) => {
      return userFacade.findById(userId);
    },
    findUserByUserName: (_, { userName }) => {
      return userFacade.findByUserName(userName);
    },
    findUserByEmail: (_, { email }) => {
      return userFacade.findByEmail(email);
    },
    
    // LocationBlog-related queries.
    // By default, populate the fields of "author" and "likedBy", so not only the ID is retrieveable from those fields.
    // GraphQL allows the customization of queries anyways.
    getAllLocationBlogs: () => {
      return locationBlogFacade.getAllLocationBlogs(true); // true = populate.
    },
    findLocationBlogById: (_, { blogId }) => {
      return locationBlogFacade.findOneById(blogId, true); // true = populate.
    },
    findLocationBlogsByAuthor: (_, { authorId }) => {
      return locationBlogFacade.findAllByAuthor(authorId, true); // true = populate.
    },

    // Login query.
    login: async (_, { input }) => {
      try {
        const userName = input.userName;
        const password = input.password;
        const longitude = input.longitude;
        const latitude = input.latitude;
        const distance = input.distance;
        const friends = await login(userName, password, longitude, latitude, distance);
        return friends;
      }
      catch (err) {
        throw Error('Wrong username or password!');
      }
    }
  }
};

module.exports = resolvers;
