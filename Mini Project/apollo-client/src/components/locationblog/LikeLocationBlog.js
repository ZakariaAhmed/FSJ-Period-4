import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const LIKE_LOCATION_BLOG = gql`
mutation likeLocationBlog($blogId: ID!, $authorId: ID!) {
  likeLocationBlog(blogId: $blogId, authorId: $authorId) {
    _id
    author
    info
    pos {
      longitude
      latitude
    }
    likedByCount
  }
}
`;

class LikeLocationBlog extends Component {
  state = { locationBlog: null };

  render() {
    let blogId, authorId;

    return (
      <Mutation
      mutation={LIKE_LOCATION_BLOG}
      onCompleted={(data) => this.setState({ locationBlog: data.likeLocationBlog })}
    >
      {(likeLocationBlog, { loading, error }) => (
        <div className='text-center'>
          <h1>Like Location Blog</h1>

          <hr />

          <form className='col-md-4 offset-md-4'
              onSubmit={e => {
                e.preventDefault();
                likeLocationBlog({ 
                  variables: { 
                    blogId: blogId.value,
                    authorId: authorId.value
                  }
                });
              }}
            >

              <input 
                className='form-control' 
                type='text'
                placeholder='Blog ID'
                required 
                ref={node => {
                  blogId = node;
                }}
              />

              <input 
                className='form-control' 
                type='text'
                placeholder='Author ID'
                required 
                ref={node => {
                  authorId = node;
                }}
              />

              <button className='btn btn-primary mt-2' type='submit'>Like Location Blog</button>
            </form>

            {
              loading ? <h3 className='mt-2'>Loading...</h3>
              : error ? <h3 className='mt-2' style={{ color: 'red' }}>Error! ${error.message}</h3> : null
            }

            {this.state.locationBlog !== null ? (
              <table className='table mt-3'>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Author</th>
                    <th>Info</th>
                    <th>Longitude</th>
                    <th>Latitude</th>
                    <th>Likes</th>
                  </tr>
                </thead>
                <tbody>  
                  <tr>
                    <td>{this.state.locationBlog._id}</td>
                    <td>{this.state.locationBlog.author}</td>
                    <td>{this.state.locationBlog.info}</td>
                    <td>{this.state.locationBlog.pos.longitude}</td>
                    <td>{this.state.locationBlog.pos.latitude}</td>
                    <td>{this.state.locationBlog.likedByCount}</td>
                  </tr>
                </tbody>
              </table>
            ) : null}
        </div>
      )}
    </Mutation>
    );
  }
};

export default LikeLocationBlog;
