import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const ADD_LOCATION_BLOG = gql`
mutation addLocationBlog($input: LocationBlogInput!) {
  addLocationBlog(input: $input) {
    _id
    author
    info
    pos {
      longitude
      latitude
    }
  }
}
`;

class AddLocationBlog extends Component {
  state = { locationBlog: null };

  render() {
    let author, info, longitude, latitude;

    return (
      <Mutation
        mutation={ADD_LOCATION_BLOG}
        onCompleted={(data) => this.setState({ locationBlog: data.addLocationBlog })}
      >
        {/* {addLocationBlog => ( */}
        {(addLocationBlog, { loading, error }) => (
          <div className='text-center'>
            <h1>Add Location Blog</h1>

            <hr />

            <form className='col-md-4 offset-md-4'
              onSubmit={e => {
                e.preventDefault();
                addLocationBlog({ 
                  variables: { 
                    input: {
                      author: author.value,
                      info: info.value,
                      longitude: Number(longitude.value),
                      latitude: Number(latitude.value)
                  }}
                });
                /*
                author.value = '';
                info.value = '';
                longitude.value = '';
                latitude.value = '';
                */
              }}
            >

              <input 
                className='form-control' 
                type='text'
                placeholder='Author ID'
                required 
                ref={node => {
                  author = node;
                }}
              />

              <textarea 
                className='form-control mt-1' 
                rows='4' 
                cols='50'
                placeholder='Info'
                required 
                ref={node => {
                  info = node;
                }}
              />

              <input 
                className='form-control mt-1' 
                type='number'
                placeholder='Longitude'
                step='any'
                required 
                ref={node => {
                  longitude = node;
                }}
              />

              <input 
                className='form-control mt-1' 
                type='number'
                placeholder='Latitude'
                step='any'
                required 
                ref={node => {
                  latitude = node;
                }}
              />

              <button className='btn btn-primary mt-2' type='submit'>Add Location Blog</button>
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
                  </tr>
                </thead>
                <tbody>  
                  <tr>
                    <td>{this.state.locationBlog._id}</td>
                    <td>{this.state.locationBlog.author}</td>
                    <td>{this.state.locationBlog.info}</td>
                    <td>{this.state.locationBlog.pos.longitude}</td>
                    <td>{this.state.locationBlog.pos.latitude}</td>
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

export default AddLocationBlog;
