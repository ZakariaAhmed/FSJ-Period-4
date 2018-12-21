import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const DELETE_USER = gql`
mutation deleteUser($userId: ID!) {
  deleteUser(userId: $userId) {
    _id
    firstName
    lastName
    userName
    email
  }
}
`;

class DeleteUser extends Component {
  state = { user: undefined };

  render() {
    let userId;

    return (
      <Mutation
        mutation={DELETE_USER}
        onCompleted={(data) => this.setState({ user: data.deleteUser })}
      >
        {(deleteUser, { loading, error }) => (
          <div className='text-center'>
            <h1>Delete User</h1>

            <hr />

            <form className='col-md-4 offset-md-4'
              onSubmit={e => {
                e.preventDefault();
                deleteUser({ 
                  variables: {
                    userId: userId.value 
                  }
                });
                userId.value = '';
              }}
            >

              <input 
                className='form-control' 
                type='text'
                placeholder='User ID'
                required 
                ref={node => {
                  userId = node;
                }}
              />

              <button className='btn btn-primary mt-2' type='submit'>Delete User</button>
            </form>

            {
              loading ? <h3 className='mt-2'>Loading...</h3> 
              : error ? <h3 className='mt-2' style={{ color: 'red' }}>Error! ${error.message}</h3> : null
            }

            {this.state.user === null 
              ? <h3 className='mt-2' style={{ color: 'red' }}>User does not exist!</h3>
              : this.state.user !== undefined ? (
                <table className='table mt-3'>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>User Name</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>  
                    <tr>
                      <td>{this.state.user._id}</td>
                      <td>{this.state.user.firstName}</td>
                      <td>{this.state.user.lastName}</td>
                      <td>{this.state.user.userName}</td>
                      <td>{this.state.user.email}</td>
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

export default DeleteUser;
