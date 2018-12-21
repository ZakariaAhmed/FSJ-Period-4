import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
  <div>
    <h1 className='text-center'>Home</h1>

    <hr />
    
    <nav>
      <h3>Mutations</h3>
      <ul>
        <strong>User-related mutations</strong>
        <li>
          <Link to='/addUser/'>Add User</Link>
        </li>
        <li>
          <Link to='/addJobToUser/'>Add Job To User</Link>
        </li>
        <li>
          <Link to='/updateUser/'>Update User</Link>
        </li>
        <li>
          <Link to='/deleteUser/'>Delete User</Link>
        </li>

        <strong>LocationBlog-related mutations</strong>
        <li>
          <Link to='/addLocationBlog/'>Add Location Blog</Link>
        </li>
        <li>
          <Link to='/likeLocationBlog/'>Like Location Blog</Link>
        </li>
        <li>
          <Link to='/updateLocationBlog/'>Update Location Blog</Link>
        </li>
        <li>
          <Link to='/deleteLocationBlog/'>Delete Location Blog</Link>
        </li>
      </ul>

      <hr />

      <h3>Queries</h3>
      <ul>
        <strong>User-related queries</strong>
        <li>
          <Link to='/getAllUsers/'>Get All Users</Link>
        </li>
        <li>
          <Link to='/findUser/'>Find User</Link>
        </li>
        <strong>LocationBlog-related queries</strong>
        <li>
          <Link to='/getAllLocationBlogs/'>Get All Locations Blogs</Link>
        </li>
        <li>
          <Link to='/findLocationBlog/'>Find Location Blog</Link>
        </li>
        <li>
          <Link to='/findLocationBlogsByAuthor/'>Find All Location Blogs By Author</Link>
        </li>
      </ul>

      <hr />
      
      <h3>Login</h3>
      <ul>
        <li>
          <Link to='/login/'>Login</Link>
        </li>
      </ul>
    </nav>
  </div>
);

export default Home;
