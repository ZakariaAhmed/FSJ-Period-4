import React, { Component } from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const FIND_USER_BY_ID = gql`
query findUserById($userId: ID!) {
  findUserById(userId: $userId) {
    _id
    firstName
    lastName
    userName
    email
  }
}
`;

const FIND_USER_BY_USERNAME = gql`
query findUserByUserName($userName: String!) {
  findUserByUserName(userName: $userName) {
    _id
    firstName
    lastName
    userName
    email
  }
}
`;

const FIND_USER_BY_EMAIL = gql`
query findUserByEmail($email: EmailAddress!) {
  findUserByEmail(email: $email) {
    _id
    firstName
    lastName
    userName
    email
  }
}
`;

class FindUser extends Component {
  state = { selectedOption: null, value: '' };

  handleSubmit = async (event) => {
    event.preventDefault();
    event.persist();

    await this.setState(() => ({
      selectedOption: event.target.option.value,
      value: event.target.input.value 
    }));

    event.target.reset();
  };

  render() {
    return (
      <div className='text-center'>
        <h1>Find User</h1>

        <hr />

        <form className='form-inline justify-content-center' onSubmit={this.handleSubmit}>
          <input type='hidden' name='option' value='ID' />
          <input type='text' className='form-control' id='input' placeholder='ID' required />
          <button className='btn btn-primary ml-2' type='submit'>Find User</button>
        </form>

        <strong>OR</strong>

        <form className='form-inline justify-content-center' onSubmit={this.handleSubmit}>
          <input type='hidden' name='option' value='userName' />
          <input type='text' className='form-control' id='input' placeholder='User Name' required />
          <button className='btn btn-primary ml-2' type='submit'>Find User</button>
        </form>

        <strong>OR</strong>
        
        <form className='form-inline justify-content-center' onSubmit={this.handleSubmit}>
          <input type='hidden' name='option' value='email' />
          <input type='email' className='form-control' id='input' placeholder='Email' required />
          <button className='btn btn-primary ml-2' type='submit'>Find User</button>
        </form>
      
        {this.state.selectedOption !== null ? (
          <Query
            query={this.state.selectedOption === 'ID' 
              ? FIND_USER_BY_ID : this.state.selectedOption === 'userName' 
              ? FIND_USER_BY_USERNAME : FIND_USER_BY_EMAIL
            }
            variables={
              this.state.selectedOption === 'ID' 
              ? { userId: this.state.value } : this.state.selectedOption === 'userName' 
              ? { userName: this.state.value } : { email: this.state.value }
            }
          >
            {({ loading, error, data }) => {
              if (loading) return <h3 className='mt-2'>Loading...</h3>;
              if (error) return <h3 className='mt-2' style={{ color: 'red' }}>Error! ${error.message}</h3>;

              data = 
                this.state.selectedOption === 'ID' 
                ? data.findUserById : this.state.selectedOption === 'userName' 
                ? data.findUserByUserName : data.findUserByEmail
              ;

              if (data === null) return <h3 className='mt-2' style={{ color: 'red' }}>User not found!</h3>;

              return (
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
                      <td>{data._id}</td>
                      <td>{data.firstName}</td>
                      <td>{data.lastName}</td>
                      <td>{data.userName}</td>
                      <td>{data.email}</td>
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

export default FindUser;
