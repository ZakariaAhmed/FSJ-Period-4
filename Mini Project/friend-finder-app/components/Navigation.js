import { createStackNavigator } from 'react-navigation';

import WelcomeScreen from './WelcomeScreen';
import LoginScreen from './auth/LoginScreen';
import HomeScreen from './app/HomeScreen';
import GameScreen from './app/GameScreen';

export default createStackNavigator(
  { 
    Welcome: WelcomeScreen,
    Login: LoginScreen,
    Home: HomeScreen,
    Game: GameScreen
  },
  {
    initialRouteName: 'Welcome',
    navigationOptions: {
      headerStyle: {
        backgroundColor: '#387EF5'
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold'
      }
    }
  }
);
