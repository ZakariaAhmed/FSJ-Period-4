import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const ADD_USER = gql`
mutation addUser($input: UserInput!) {
  addUser(input: $input) {
    _id
    firstName
    lastName
    userName
    email
  }
}
`;

class AddUser extends Component {
  state = { user: null };

  render() {
    let firstName, lastName, userName, password, email;

    return (
      <Mutation
        mutation={ADD_USER}
        onCompleted={(data) => this.setState({ user: data.addUser })}
      >
        {/* {addUser => ( */}
        {(addUser, { loading, error }) => (
          <div className='text-center'>
            <h1>Add User</h1>

            <hr />

            <form className='col-md-4 offset-md-4'
              onSubmit={e => {
                e.preventDefault();
                addUser({ 
                  variables: { 
                    input: {
                      firstName: firstName.value,
                      lastName: lastName.value,
                      userName: userName.value,
                      password: password.value,
                      email: email.value,
                      job: []
                  }}
                });
                /*
                firstName.value = '';
                lastName.value = '';
                userName.value = '';
                password.value = '';
                email.value = '';
                */
              }}
            >

              <input 
                className='form-control' 
                type='text'
                placeholder='First Name'
                required 
                ref={node => {
                  firstName = node;
                }}
              />

              <input 
                className='form-control mt-1' 
                type='text'
                placeholder='Last Name'
                required 
                ref={node => {
                  lastName = node;
                }}
              />

              <input 
                className='form-control mt-1' 
                type='text'
                placeholder='User Name'
                required 
                ref={node => {
                  userName = node;
                }}
              />

              <input 
                className='form-control mt-1' 
                type='password'
                placeholder='Password'
                required 
                ref={node => {
                  password = node;
                }}
              />

              <input 
                className='form-control mt-1' 
                type='email'
                placeholder='Email'
                required 
                ref={node => {
                  email = node;
                }}
              />

              <button className='btn btn-primary mt-2' type='submit'>Add User</button>
            </form>

            {
              loading ? <h3 className='mt-2'>Loading...</h3>
              : error ? <h3 className='mt-2' style={{ color: 'red' }}>Error! ${error.message}</h3> : null
            }

            {this.state.user !== null ? (
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

export default AddUser;
