import React, { Component } from 'react';
import { Image, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import facade from '../facades/apiFacade';

export default class Login extends Component {
  static navigationOptions = {
    headerTitle: 'Login'
  };

  state = {
    // Pre-defined state data to allow easier login and testing.
    userName: 'Dewrano', 
    password: 'test123',
    distance: 15,
    errorMessage: null
  };

  login = async () => {
    const userName = this.state.userName,
          password = this.state.password,
          // Convert to meters. This is required for the circle in the MapView and due to
          // the backend only accepting meters (MongoDB takes meters for the geometry queries).
          distance = Number(this.state.distance * 1000);

    if (userName.trim() === '') {
      return this.setState({ errorMessage: 'User Name required.' });
    }
    if (password.trim() === '') {
      return this.setState({ errorMessage: 'Password required.' });
    }
    if (!Number.isFinite(distance) || distance === 0) {
      return this.setState({ errorMessage: 'Distance required.' });
    }

    try {
      const { location } = this.props.navigation.state.params;

      await facade.login(userName, password, location, distance);

      this.props.navigation.state.params.distance = distance;
      this.props.navigation.navigate('Home', this.props.navigation.state.params);
    }
    catch (err) {
      this.setState({ errorMessage: err });
    }
  }

  render() {
    return (
      <KeyboardAvoidingView style={styles.container} behavior='padding' keyboardVerticalOffset={60}>
        <Text style={styles.title}>Welcome to Friend Finder!</Text>

        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require('../../assets/react.png')} 
          />
        </View>

        <Text style={styles.text}>Please login to see your friends.</Text>
        <View style={styles.formContainer}>
          <View>
            <TextInput
              style={[styles.input, { borderBottomWidth: 0 }]}
              placeholder='User Name'
              placeholderTextColor='gray'
              returnKeyType='next'
              autoCapitalize='none'
              autoCorrect={false}
              onSubmitEditing={() => this.passwordInput.focus()}
              onChangeText={(text) => this.setState({ userName: text })}
            />

            <TextInput
              style={styles.input}
              placeholder='Password'
              placeholderTextColor='gray'
              returnKeyType='next'
              secureTextEntry
              ref={(input) => this.passwordInput = input}
              onSubmitEditing={() => this.distanceInput.focus()}
              onChangeText={(text) => this.setState({ password: text })}
            />

            <TextInput
              style={styles.input}
              placeholder='Distance (km) to look for friends'
              placeholderTextColor='gray'
              returnKeyType='send'
              keyboardType='numeric'
              ref={(input) => this.distanceInput = input}
              onSubmitEditing={() => this.login()}
              onChangeText={(text) => this.setState({ distance: text })}
            />

            <TouchableOpacity style={styles.buttonContainer} onPress={this.login}>
              <Text style={styles.buttonText}>LOGIN</Text>
            </TouchableOpacity>
          </View>
        </View>
                    
        <Text style={styles.errorText}>{this.state.errorMessage}</Text>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center'
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    color: 'black'
  },
  text: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 20,
    color: 'black'
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 200,
    height: 200
  },
  formContainer: {
    alignItems: 'center'
  },
  input: {
    height: 50,
    width: 250,
    backgroundColor: '#fff',
    color: 'black',
    textAlign: 'center',
    borderColor: 'lightgray',
    borderWidth: 1
  },
  buttonContainer: {
    backgroundColor: '#387EF5',
    marginTop: 10,
    paddingVertical: 15
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold'
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    color: 'red'
  },
});
