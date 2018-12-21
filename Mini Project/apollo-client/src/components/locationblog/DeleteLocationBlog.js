import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const DELETE_LOCATION_BLOG = gql`
mutation deleteLocationBlog($blogId: ID!) {
  deleteLocationBlog(blogId: $blogId) {
    _id
    info
    author
    pos {
      longitude
      latitude
    }
    likedByCount
  }
}
`;

class DeleteLocationBlog extends Component {
  state = { locationBlog: undefined };

  render() {
    let locationBlogId;

    return (
      <Mutation
        mutation={DELETE_LOCATION_BLOG}
        onCompleted={(data) => this.setState({ locationBlog: data.deleteLocationBlog })}
      >
        {(deleteLocationBlog, { loading, error }) => (
          <div className='text-center'>
            <h1>Delete Location Blog</h1>

            <hr />

            <form className='col-md-4 offset-md-4'
              onSubmit={e => {
                e.preventDefault();
                deleteLocationBlog({ 
                  variables: {
                    blogId: locationBlogId.value 
                  }
                });
                locationBlogId.value = '';
              }}
            >

              <input 
                className='form-control' 
                type='text'
                placeholder='Location Blog ID'
                required 
                ref={node => {
                  locationBlogId = node;
                }}
              />

              <button className='btn btn-primary mt-2' type='submit'>Delete Location Blog</button>
            </form>

            {
              loading ? <h3 className='mt-2'>Loading...</h3> 
              : error ? <h3 className='mt-2' style={{ color: 'red' }}>Error! ${error.message}</h3> : null
            } 

            {this.state.locationBlog === null 
              ? <h3 className='mt-2' style={{ color: 'red' }}>Location Blog does not exist!</h3>
              : this.state.locationBlog !== undefined ? (
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
}

export default DeleteLocationBlog;
