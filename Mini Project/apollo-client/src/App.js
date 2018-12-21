import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { ApolloProvider } from 'react-apollo';
import ApolloClient, { InMemoryCache } from 'apollo-boost';

// Home.
import Home from './components/Home';
// User-related mutations.
import AddUser from './components/user/AddUser';
import AddJobToUser from './components/user/AddJobToUser';
import UpdateUser from './components/user/UpdateUser';
import DeleteUser from './components/user/DeleteUser';
// User-related queries.
import GetAllUsers from './components/user/GetAllUsers';
import FindUser from './components/user/FindUser';
// LocationBlog-related mutations.
import AddLocationBlog from './components/locationblog/AddLocationBlog';
import LikeLocationBlog from './components/locationblog/LikeLocationBlog';
import UpdateLocationBlog from './components/locationblog/UpdateLocationBlog';
import DeleteLocationBlog from './components/locationblog/DeleteLocationBlog';
// LocationBlog-related queries.
import GetAllLocationBlogs from './components/locationblog/GetAllLocationBlogs';
import FindLocationBlog from './components/locationblog/FindLocationBlog';
import FindAuthorLocationBlogs from './components/locationblog/FindAuthorLocationBlogs';
// Login.
import Login from './components/Login';

const client = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  cache: new InMemoryCache({
    addTypename: false // Don't send the typename along with the requests (GraphQL fail with certain queries/mutations).
  })
});

const App = () => (
  <Router>
    <ApolloProvider client={client}>
      <div className='container'>
        <Route path='/' exact component={Home} />

        <Route path='/addUser/' component={AddUser} />
        <Route path='/addJobToUser/' component={AddJobToUser} />
        <Route path='/updateUser/' component={UpdateUser} />
        <Route path='/deleteUser/' component={DeleteUser} />

        <Route path='/getAllUsers/' component={GetAllUsers} />
        <Route path='/findUser/' component={FindUser} />

        <Route path='/addLocationBlog/' component={AddLocationBlog} />
        <Route path='/likeLocationBlog/' component={LikeLocationBlog} />
        <Route path='/updateLocationBlog/' component={UpdateLocationBlog} />
        <Route path='/deleteLocationBlog/' component={DeleteLocationBlog} />

        <Route path='/getAllLocationBlogs/' component={GetAllLocationBlogs} />
        <Route path='/findLocationBlog/' component={FindLocationBlog} />
        <Route path='/findLocationBlogsByAuthor/' component={FindAuthorLocationBlogs} />

        <Route path='/login/' component={Login} />
      </div>
    </ApolloProvider>
  </Router>
);

export default App;
