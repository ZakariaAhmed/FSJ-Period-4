var express = require('express');
var router = express.Router();

const graphqlHTTP = require('express-graphql');
const schema = require('./schema');

router.use('/', graphqlHTTP({
  schema,
  graphiql: true,
  pretty: true
}));

module.exports = router;

/*

Usages:

  Mutations:
    mutation {
      addUser(input: {
        firstName: "Test"
        lastName: "GraphQL"
        userName: "test_graphql"
        password: "test"
        email: "graphql@live.dk"
        job: {
          type: "Private"
          company: "DC"
          companyUrl: "https://www.graphql.dk"
        }
        // For more than 1 job.
        job: [
          {
            type: "Private"
            company: "DC"
            companyUrl: "https://www.graphql.dk"
          }
          {
            type: "Private"
            company: "DC"
            companyUrl: "https://www.dc.dk"
          }
        ]
      })
      {
        _id
        firstName
        lastName
        userName
        password
        email
        job {
          type
          company
          companyUrl
        }
      }
    }

    mutation {
      addJobToUser(userId: "5c0487999a756d0e389d1c3c", input: {
        type: "Private"
        company: "Job"
        companyUrl: "https://www.private.dk"
      }) {
      // For more than one job.
      addJobToUser(userId: "5c0487999a756d0e389d1c3c", input: [
        {
          type: "Private"
          company: "Job 1"
          companyUrl: "https://www.private.dk"
        }, {
          type: "Public"
          company: "Job 2"
          companyUrl: "https://www.public.dk"
        }
      ]) {
        _id
        firstName
        lastName
        userName
        password
        email
        job {
          type
          company
          companyUrl
        }
        created
        lastUpdated
      }
    }

    mutation {
      updateUser(userId: "5c0487999a756d0e389d1c3a", input: {
        // Any of these fields below can be removed (there are no required fields for UpdateUserInput).
        firstName: "Test"
        lastName: "Account"
        userName: "Test_Account"
        password: "test"
        email: "test@live.dk"
        job: []
      })
      {
        _id
        firstName
        lastName
        userName
        password
        email
        job {
          type
          company
          companyUrl
        }
      }
    }

    mutation {
      deleteUser(userId: "5c0487999a756d0e389d1c") {
        _id
        firstName
        lastName
        userName
        password
        email
        created
        lastUpdated
      }
    }
    
    mutation {
      addLocationBlog(input: {
        author: "5bfabeb5c017d52f607c4f4a"
        info: "GraphQL - Location Blog"
        longitude: 12.409005314111708
        latitude: 55.7847898805561
      })
      {
        _id
        author
        info
        pos {
          longitude
          latitude
        }
        likedBy
        likedByCount
      }
    }
    
    mutation {
      likeLocationBlog(
        blogId: "5c02e5bcda89cd3844c2f798"
        authorId: "5c02e70a579c1438d0f1b4a4"
      )
      {
        _id
        author
        info
        pos {
          longitude
          latitude
        }
        likedBy
        likedByCount
      }
    }

    mutation {
      updateLocationBlog(blogId: "5c04973e3f7853045c59dfb8", input: {
        info: "Test updateLocationBlog"
        longitude: 1751
        latitude: 2750
      }) {
        _id
        info
        author
        pos {
          longitude
          latitude
        }
        likedBy
        likedByCount
        created
        lastUpdated
    }}

    mutation {
      deleteLocationBlog(blogId: "5c049d925d400e39e440a8c5") {
        _id
        info
        author
        pos {
          longitude
          latitude
        }
        likedBy
        likedByCount
        created
        lastUpdated
      }
    }
  
  Queries:
    query { 
      getAllUsers {
        _id
        firstName
        lastName
        userName
        password
        email
        job {
          type
          company
          companyUrl
        }
        created
        lastUpdated
      }
    }
    
    query { 
      findUserById(userId: "5c02d47122fd4e248cded615") {
      findUserByUserName(userName: "Dewrano") {
      findUserByEmail(email: "devran-coskun@live.dk") {
        _id
        firstName
        lastName
        userName
        password
        email
        job {
          type
          company
          companyUrl
        }
        created
        lastUpdated
      }
    }

    query {
      getAllLocationBlogs {
        _id
        author {
          _id
          userName
          email
        }
        info
        likedBy {
          _id
          userName
          email
        }
        likedByCount
        created
        lastUpdated
      }
    }

    query {
      findLocationBlogById(blogId: "5c02de7d2dcba93cc89ed6c2") {
      findLocationBlogsByAuthor(authorId: "5c02d47122fd4e248cded615") {
        _id
        author {
          _id
          userName
          email
        }
        info
        likedBy {
          _id 
          userName
          email
        }
        likedByCount
        created
        lastUpdated
      }
    }

    query {
      login(input: {
        userName: "Dewrano"
        password: "test123"
        longitude: 12.409005314111708
        latitude: 55.7847898805561
        distance: 13700
      }) {
        friends {
          userName
          latitude
          longitude
        }
      }
    }
*/
