import React, { Component } from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const LOGIN = gql`
query login($input: LoginInput!) {
  login(input: $input) {
    friends {
      userName
      latitude
      longitude
    }
  }
}
`;

class Login extends Component {
  state = { input: null };

  handleSubmit = (event) => {
    event.preventDefault();
    event.persist();

    const userName = event.target.userName.value;
    const password = event.target.password.value;
    const longitude = Number(event.target.longitude.value);
    const latitude = Number(event.target.latitude.value);
    // Convert the distance to meters.
    // This is required due to MongoDB only accepting meters for the geometry queries.
    const distance = Number(event.target.distance.value * 1000);
    
    this.setState(() => ({
      input: { userName, password, longitude, latitude, distance }
    }));
  };

  render() {
    return (
      <div className='text-center'>
        <h1>Login</h1>

        <hr />

        {this.state.input === null 
          ? <LoginInput handleSubmit={this.handleSubmit} />
          : (
            <Query
              query={LOGIN}
              variables={{ input: this.state.input }}
            >
            
              {({ loading, error, data }) => {
                if (loading) return <LoginInput handleSubmit={this.handleSubmit} loading />
                if (error) return <LoginInput handleSubmit={this.handleSubmit} error={error} />
                
                const user = this.state.input;
                const friends = data.login.friends;

                return (
                  <div>
                    <h2>Welcome, <i>{user.userName}</i> !</h2>
                    
                    <h3 id='current-pos'>Your current position</h3>
                    <b>Longitude</b>: {user.longitude} <br /> 
                    <b>Latitude</b>: {user.latitude}

                    <br /> <hr />

                    <FriendList user={user} friends={friends} />
                  </div>
                );
              }}
            </Query>
          )
        }
      </div>
    );
  }
}

const LoginInput = (props) => {
  return (
    <div>
      <form className='col-md-4 offset-md-4' onSubmit={props.handleSubmit}>
        <input type='text' className='form-control' name='userName' placeholder='Username' defaultValue='Dewrano' required />
        <input type='password' className='form-control' name='password' placeholder='Password' defaultValue='test123' required />
        <input type='number' className='form-control' name='longitude' placeholder='Longitude' defaultValue='12.409005314111708' required />
        <input type='number' className='form-control' name='latitude' placeholder='Latitude' defaultValue='55.7847898805561' required />
        <input type='number' className='form-control'name='distance' placeholder='Distance in km' step='0.01' min='0' defaultValue='15' required />

        <button className='btn btn-primary mt-2' type='submit'>Login</button>
      </form>

      {
        props.loading ? <h3 className='mt-2'>Loading...</h3>
        : props.error ? <h3 className='mt-2' style={{ color: 'red' }}>Error! ${props.error.message}</h3>
        : null
      }
    </div>
  );
}

const FriendList = (props) => {
  const user = props.user;
  const friends = props.friends;

  if (friends.length === 0) {
    return (
      <div>
        <h3 className='mb-0'>No friends nearby</h3>
        <h4>Distance: {user.distance / 1000} km</h4>
      </div>
    );
  }
  else {
    return (
      <div>
        <h3 className='mb-0'>Your friends</h3>
        <h4>Distance: {user.distance / 1000} km</h4>

        {friends.map((friend, index) => (
          <div key={index}>
            <b>User</b>: <span>{friend.userName}</span> <br />
            <b>Longitude</b>: <span>{friend.longitude}</span> <br />
            <b>Latitude</b>: <span>{friend.latitude}</span> <br />
            <br />
          </div>
        ))}
      </div>
    );
  }
}

export default Login;
