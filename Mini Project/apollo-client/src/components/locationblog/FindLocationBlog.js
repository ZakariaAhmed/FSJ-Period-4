import React, { Component } from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const FIND_LOCATION_BLOG_BY_ID = gql`
query findLocationBlogById($blogId: ID!) {
  findLocationBlogById(blogId: $blogId) {
    _id
    author {
      userName
    }
    info
    likedByCount
  }
}
`;

class FindLocationBlog extends Component {
  state = { blogId: null };

  handleSubmit = async (event) => {
    event.preventDefault();
    event.persist();

    await this.setState(() => ({
      blogId: event.target.input.value
    }));

    event.target.reset();
  };

  render() {
    return (
      <div className='text-center'>
        <h1>Find Location Blog</h1>

        <hr />

        <form className='form-inline justify-content-center' onSubmit={this.handleSubmit}>
          <input type='text' className='form-control' id='input' placeholder='Location Blog ID' required />
          <button className='btn btn-primary ml-2' type='submit'>Find Location Blog</button>
        </form>

        {this.state.blogId !== null ? (
          <Query
            query={FIND_LOCATION_BLOG_BY_ID}
            variables={{ blogId: this.state.blogId }}
          >
          
            {({ loading, error, data }) => {
              if (loading) return <h3 className='mt-2'>Loading...</h3>;
              if (error) return <h3 className='mt-2' style={{ color: 'red' }}>Error! ${error.message}</h3>;

              data = data.findLocationBlogById;
              if (data === null) return <h3 className='mt-2' style={{ color: 'red' }}>Location Blog not found!</h3>;

              return (
                <table className='table mt-3'>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Author</th>
                      <th>Info</th>
                      <th>Likes</th>
                    </tr>
                  </thead>
                  <tbody>  
                    <tr>
                      <td>{data._id}</td>
                      <td>{data.author.userName}</td>
                      <td>{data.info}</td>
                      <td>{data.likedByCount}</td>
                    </tr>
                  </tbody>
                </table>
              );
            }}
          </Query>
        ) : null}
      </div>
    );
  }
}

export default FindLocationBlog;
