import React, { Component } from 'react';
import { Mutation, Query } from 'react-apollo';
import gql from 'graphql-tag';

const FIND_USER_BY_ID = gql`
query findUserById($userId: ID!) {
  findUserById(userId: $userId) {
    _id
    firstName
    lastName
    userName
    email
    job {
      type
      company
      companyUrl
    }
  }
}
`;

const UPDATE_USER = gql`
mutation updateUser($userId: ID!, $input: UpdateUserInput!) {
  updateUser(userId: $userId, input: $input) {
    _id
    firstName
    lastName
    userName
    email
  }
}
`;

class UpdateUser extends Component {
  state = { userId: null };

  handleSubmit = (event) => {
    event.preventDefault();
    event.persist();

    this.setState(() => ({
      userId: event.target.input.value 
    }));
  };

  render() {          
    if (this.state.userId === null) {
      return <FetchUser handleSubmit={this.handleSubmit} />
    }
    else {
      return (
        <Query
          query={FIND_USER_BY_ID}
          variables={{ userId: this.state.userId }}
        >
          {({ loading, error, data }) => {
            if (loading) return <FetchUser handleSubmit={this.handleSubmit} loading />
            if (error) return <FetchUser handleSubmit={this.handleSubmit} error={error} />
            if (data.findUserById === null) return <FetchUser handleSubmit={this.handleSubmit} notFound />
            
            return <UpdateUserInput data={data.findUserById} />
          }}
        </Query>
      );
    }
  }
};

const FetchUser = (props) => {
  return (
    <div className='text-center'>
      <h1>Update User</h1>

      <hr />

      <form className='col-md-4 offset-md-4 form-inline' onSubmit={props.handleSubmit}>
        <input type='text' className='form-control' id='input' placeholder='User ID' required />
        <button className='btn btn-primary ml-2' type='submit'>Fetch User</button>
      </form>

      {
        props.loading ? <h3 className='mt-2'>Loading...</h3>
        : props.error ? <h3 className='mt-2' style={{ color: 'red' }}>Error! ${props.error.message}</h3>
        : props.notFound ? <h3 className='mt-2' style={{ color: 'red' }}>User not found!</h3>
        : null
      }
    </div>
  );
}

class UpdateUserInput extends Component {
  state = { updatedUser: null };

  render() {
    const user = this.props.data;
    let firstName, lastName, userName, password, email;

    return (
      <Mutation
        mutation={UPDATE_USER}
        onCompleted={(data) => this.setState({ updatedUser: data.updateUser })}
      >
        {(updateUser, { loading, error }) => (
          <div className='text-center'>
            <h1>Update User</h1>

            <hr />

            <form className='col-md-4 offset-md-4'
              onSubmit={e => {
                e.preventDefault();
                updateUser({ 
                  variables: {
                    userId: user._id,
                    input: {
                      firstName: firstName.value,
                      lastName: lastName.value,
                      userName: userName.value,
                      // If a password has been entered, then send the value, 
                      // otherwise send nothing (password remains the same).
                      password: password.value.length > 0 ? password.value : undefined,
                      email: email.value,
                      // Don't alter the assigned jobs (no functionality to edit jobs in this component).
                      job: user.job
                  }}
                });
              }}
            >

              <input 
                className='form-control' 
                type='text'
                disabled
                defaultValue={user._id}
              />

              <input 
                className='form-control mt-1' 
                type='text'
                placeholder='First Name'
                ref={node => {
                  firstName = node;
                }}
                defaultValue={user.firstName}
              />

              <input 
                className='form-control mt-1' 
                type='text'
                placeholder='Last Name'
                ref={node => {
                  lastName = node;
                }}
                defaultValue={user.lastName}
              />

              <input 
                className='form-control mt-1' 
                type='text'
                placeholder='User Name'
                ref={node => {
                  userName = node;
                }}
                defaultValue={user.userName}
              />

              <input 
                className='form-control mt-1' 
                type='password'
                placeholder='Password'
                ref={node => {
                  password = node;
                }}
              />

              <input 
                className='form-control mt-1' 
                type='email'
                placeholder='Email'
                ref={node => {
                  email = node;
                }}
                defaultValue={user.email}
              />

              <button className='btn btn-primary mt-2' type='submit'>Update User</button>
            </form>

            {
              loading ? <h3 className='mt-2'>Loading...</h3>
              : error ? <h3 className='mt-2' style={{ color: 'red' }}>Error! ${error.message}</h3> : null
            }

            {this.state.updatedUser !== null ? (
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
                    <td>{this.state.updatedUser._id}</td>
                    <td>{this.state.updatedUser.firstName}</td>
                    <td>{this.state.updatedUser.lastName}</td>
                    <td>{this.state.updatedUser.userName}</td>
                    <td>{this.state.updatedUser.email}</td>
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

export default UpdateUser;
