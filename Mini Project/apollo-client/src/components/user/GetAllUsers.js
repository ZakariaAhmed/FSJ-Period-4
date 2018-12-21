import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const GET_ALL_USERS = gql`
{
  getAllUsers {
    _id
    firstName
    lastName
    userName
    email
  }
}
`;

const GetAllUsers = () => (
  <div className='text-center'>
    <h1>Get All Users</h1>
    
    <hr />

    <Query
      query={GET_ALL_USERS}
    >
      {({ loading, error, data }) => {
        if (loading) return <h3>Loading...</h3>;
        if (error) return <h3 style={{ color: 'red' }}>Error! ${error.message}</h3>;

        return (
          data.getAllUsers.length > 0 ? (
            <div>
              <h3>List of All Users ({data.getAllUsers.length})</h3>

              <table className='table'>
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
                  {data.getAllUsers.map(({ _id, firstName, lastName, userName, email }) => (
                    <tr key={_id}>
                      <td>{_id}</td>
                      <td>{firstName}</td>
                      <td>{lastName}</td>
                      <td>{userName}</td>
                      <td>{email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <h3>There are no Users!</h3>
        );

        /*
        return data.getAllUsers.map(({ _id, firstName, lastName, userName, email }) => (
          <div key={_id}>
            <p>{`${_id} | ${firstName} | ${lastName} | ${userName} | ${email}`}</p>
          </div>
        ));
        */
      }}
    </Query>
  </div>
);

export default GetAllUsers;
