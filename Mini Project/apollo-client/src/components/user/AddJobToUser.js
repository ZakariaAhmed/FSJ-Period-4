import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const UPDATE_USER = gql`
mutation addJobToUser($userId: ID!, $input: [JobInput!]) {
  addJobToUser(userId: $userId, input: $input) {
    _id
    userName
    job {
      type
      company
      companyUrl
    }
  }
}
`;

class AddJobToUser extends Component {
  state = { user: undefined };

  render() {
    let userId, type, company, companyUrl;

    return (
      <Mutation
        mutation={UPDATE_USER}
        onCompleted={(data) => this.setState({ user: data.addJobToUser })}
      >
        {(addJobToUser, { loading, error }) => (
          <div className='text-center'>
            <h1>Add Job To User</h1>

            <hr />

            <form className='col-md-4 offset-md-4'
              onSubmit={e => {
                e.preventDefault();
                addJobToUser({ 
                  variables: {
                    userId: userId.value,
                    input: {
                      type: type.value,
                      company: company.value,
                      companyUrl: companyUrl.value
                  }}
                });
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

              <input 
                className='form-control mt-1' 
                type='text'
                placeholder='Type'
                required 
                ref={node => {
                  type = node;
                }}
              />

              <input 
                className='form-control mt-1' 
                type='text'
                placeholder='Company'
                required 
                ref={node => {
                  company = node;
                }}
              />

              <input 
                className='form-control mt-1' 
                type='url'
                placeholder='Company URL'
                required 
                ref={node => {
                  companyUrl = node;
                }}
              />

              <button className='btn btn-primary mt-2' type='submit'>Add Job To User</button>
            </form>

            {
              loading ? <h3 className='mt-2'>Loading...</h3>
              : error ? <h3 className='mt-2' style={{ color: 'red' }}>Error! ${error.message}</h3> : null
            }

            {this.state.user === null 
              ? <h3 className='mt-2' style={{ color: 'red' }}>User does not exist!</h3>
              : this.state.user !== undefined ? (
                <div>
                  <br />
                  
                  <h4>
                    Job List for {this.state.user.userName} <br />
                    ID: {this.state.user._id}
                  </h4>

                  <table className='table mt-3 w-50 mx-auto'>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Company</th>
                        <th>Company URL</th>
                      </tr>
                    </thead>
                    <tbody>  
                      {this.state.user.job.map((job, index) => (
                        <tr key={index}>
                          <td>{job.type}</td>
                          <td>{job.company}</td>
                          <td>{job.companyUrl}</td>
                        </tr>           
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
          </div>
        )}
      </Mutation>
    );
  }
};

export default AddJobToUser;
