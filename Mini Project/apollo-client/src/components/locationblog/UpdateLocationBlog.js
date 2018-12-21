import React, { Component } from 'react';
import { Mutation, Query } from 'react-apollo';
import gql from 'graphql-tag';

const FIND_LOCATION_BLOG_BY_ID = gql`
query findLocationBlogById($blogId: ID!) {
  findLocationBlogById(blogId: $blogId) {
    _id
    author {
      _id
    }
    info
    pos {
      longitude
      latitude
    }
  }
}
`;

const UPDATE_LOCATION_BLOG = gql`
mutation updateLocationBlog($blogId: ID!, $input: UpdateLocationBlogInput!) {
  updateLocationBlog(blogId: $blogId, input: $input) {
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

class UpdateLocationBlog extends Component {
  state = { blogId: null };

  handleSubmit = (event) => {
    event.preventDefault();
    event.persist();

    this.setState(() => ({
      blogId: event.target.input.value 
    }));
  };

  render() {          
    if (this.state.blogId === null) {
      return <FetchLocationBlog handleSubmit={this.handleSubmit} />
    }
    else {
      return (
        <Query
          query={FIND_LOCATION_BLOG_BY_ID}
          variables={{ blogId: this.state.blogId }}
        >
          {({ loading, error, data }) => {
            if (loading) return <FetchLocationBlog handleSubmit={this.handleSubmit} loading />
            if (error) return <FetchLocationBlog handleSubmit={this.handleSubmit} error={error} />
            if (data.findLocationBlogById === null) return <FetchLocationBlog handleSubmit={this.handleSubmit} notFound />
            
            return <UpdateLocationBlogInput data={data.findLocationBlogById} />
          }}
        </Query>
      );
    }
  }
};

const FetchLocationBlog = (props) => {
  return (
    <div className='text-center'>
      <h1>Update Location Blog</h1>

      <hr />

      <form className='col-md-6 offset-md-4 form-inline' onSubmit={props.handleSubmit}>
        <input type='text' className='form-control' id='input' placeholder='Location Blog ID' required />
        <button className='btn btn-primary ml-2' type='submit'>Fetch Location Blog</button>
      </form>

      {
        props.loading ? <h3 className='mt-2'>Loading...</h3>
        : props.error ? <h3 className='mt-2' style={{ color: 'red' }}>Error! ${props.error.message}</h3>
        : props.notFound ? <h3 className='mt-2' style={{ color: 'red' }}>Location Blog not found!</h3>
        : null
      }
    </div>
  );
}

class UpdateLocationBlogInput extends Component {
  state = { updatedLocationBlog: null };

  render() {
    const locationBlog = this.props.data;
    let info, longitude, latitude;

    return (
      <Mutation
        mutation={UPDATE_LOCATION_BLOG}
        onCompleted={(data) => this.setState({ updatedLocationBlog: data.updateLocationBlog })}
      >
        {(updateLocationBlog, { loading, error }) => (
          <div className='text-center'>
            <h1>Update Location Blog</h1>

            <hr />

            <form className='col-md-4 offset-md-4'
              onSubmit={e => {
                e.preventDefault();
                updateLocationBlog({ 
                  variables: {
                    blogId: locationBlog._id,
                    input: {
                      info: info.value,
                      longitude: Number(longitude.value),
                      latitude: Number(latitude.value)
                  }}
                });
              }}
            >

              <strong>Location Blog ID</strong>
              <input 
                className='form-control' 
                type='text'
                disabled
                defaultValue={locationBlog._id}
              />

              <strong>Author ID</strong>
              <input 
                className='form-control' 
                type='text'
                disabled
                defaultValue={locationBlog.author._id}
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
                defaultValue={locationBlog.info}
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
                defaultValue={locationBlog.pos.longitude}
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
                defaultValue={locationBlog.pos.latitude}
              />

              <button className='btn btn-primary mt-2' type='submit'>Update Location Blog</button>
            </form>

            {
              loading ? <h3 className='mt-2'>Loading...</h3>
              : error ? <h3 className='mt-2' style={{ color: 'red' }}>Error! ${error.message}</h3> : null
            }

            {this.state.updatedLocationBlog !== null ? (
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
                      <td>{this.state.updatedLocationBlog._id}</td>
                      <td>{this.state.updatedLocationBlog.author}</td>
                      <td>{this.state.updatedLocationBlog.info}</td>
                      <td>{this.state.updatedLocationBlog.pos.longitude}</td>
                      <td>{this.state.updatedLocationBlog.pos.latitude}</td>
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

export default UpdateLocationBlog;
