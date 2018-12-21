import React, { Component } from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const FIND_LOCATION_BLOGS_BY_AUTHOR = gql`
query findLocationBlogsByAuthor($authorId: ID!) {
  findLocationBlogsByAuthor(authorId: $authorId) {
    _id
    author {
      userName
    }
    info
    likedByCount
  }
}
`;

class FindAuthorLocationBlogs extends Component {
  state = { authorId: null };

  handleSubmit = async (event) => {
    event.preventDefault();
    event.persist();

    await this.setState(() => ({
      authorId: event.target.input.value
    }));

    event.target.reset();
  };

  render() {
    return (
      <div className='text-center'>
        <h1>Find Location Blogs By Author</h1>

        <hr />

        <form className='form-inline justify-content-center' onSubmit={this.handleSubmit}>
          <input type='text' className='form-control' id='input' placeholder='Author ID' required />
          <button className='btn btn-primary ml-2' type='submit'>Find Location Blogs By Author</button>
        </form>

        {this.state.authorId !== null ? (
          <Query
            query={FIND_LOCATION_BLOGS_BY_AUTHOR}
            variables={{ authorId: this.state.authorId }}
          >
          
            {({ loading, error, data }) => {
              if (loading) return <h3 className='mt-2'>Loading...</h3>;
              if (error) return <h3 className='mt-2' style={{ color: 'red' }}>Error! ${error.message}</h3>;

              data = data.findLocationBlogsByAuthor;
              if (data === null) return <h3 className='mt-2' style={{ color: 'red' }}>Location Blogs by this Author not found!</h3>;

              return (
                data.length > 0 ? (
                  <div>
                    <h3 className='mt-2'>List of All Location Blogs by Author ({data.length})</h3>

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
                      {data.map(({ _id, author, info, likedByCount }) => (
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
                ) : <h3 className='mt-2'>There are no Location Blogs by this Author!</h3>
              );
            }}
          </Query>
        ) : null}
      </div>
    );
  }
}

export default FindAuthorLocationBlogs;
