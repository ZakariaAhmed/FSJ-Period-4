import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const GET_ALL_LOCATION_BLOGS = gql`
{
  getAllLocationBlogs {
    _id
    author {
      userName
    }
    info
    likedByCount
  }
}
`;

const GetAllLocationBlogs = () => (
  <div className='text-center'>
    <h1>Get All Location Blogs</h1>

    <hr />

    <Query
      query={GET_ALL_LOCATION_BLOGS}
    >
      {({ loading, error, data }) => {
        if (loading) return <h3>Loading...</h3>;
        if (error) return <h3 style={{ color: 'red' }}>Error! ${error.message}</h3>;

        return (
          data.getAllLocationBlogs.length > 0 ? (
            <div>
              <h3>List of All Location Blogs ({data.getAllLocationBlogs.length})</h3>

              <table className='table'>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Author</th>
                    <th>Info</th>
                    <th>Likes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.getAllLocationBlogs.map(({ _id, author, info, likedByCount }) => (
                    <tr key={_id}>
                      <td>{_id}</td>
                      <td>{author.userName}</td>
                      <td>{info}</td>
                      <td>{likedByCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <h3>There are no Location Blogs!</h3>
        );
                
        /*
        return data.getAllLocationBlogs.map(({ _id, author, info, likedByCount }) => (
          <div key={_id}>
            <p>{`${_id} | ${author.userName} | ${info} | ${likedByCount} `}</p>
          </div>
        ));
        */
      }}
    </Query>
  </div>
);

export default GetAllLocationBlogs;
