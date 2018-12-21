import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Location, Permissions } from 'expo';
import MapView, { Marker } from 'react-native-maps';
import { AntDesign } from '@expo/vector-icons'; // https://expo.github.io/vector-icons/

export default class Welcome extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      headerTitle: 'Friend Finder',
      headerRight: (
        (params !== undefined) ? (
          <AntDesign
            style={{ paddingRight: 15 }}
            name='login'
            size={32}
            color='white'
            onPress={() => navigation.navigate('Login', params)}
          />
        ) : null
      )
    }
  };

  state = {
    isLoading: true,
    location: null,
    address: null,
    markerDescription: null,
    errorMessage: null,
    flex: 0 // Small hack to enable Google Control buttons.
  };

  componentDidMount() {
    this.checkPermissionsAsync();
  }

  checkPermissionsAsync = async () => {
    const { locationServicesEnabled } = await Location.getProviderStatusAsync();
    if (!locationServicesEnabled) {
      return this.setState({
        errorMessage: 'Location services are disabled.\nPlease enable location and reload the app.'
      });
    }
    else {
      this.setState({ errorMessage: null });

      const locationStatus = await Permissions.askAsync(Permissions.LOCATION);
      if (locationStatus.status !== 'granted') {
        return this.setState({ 
          errorMessage: 'Permission to access location was denied.\nPlease reload the app and allow permission.' 
        });
      }

      const notificationStatus = await Permissions.getAsync(Permissions.NOTIFICATIONS);
      if (notificationStatus.status !== 'granted') {
        return this.setState({ 
          errorMessage: 'Permission to enable notifications was denied.\nPlease allow permission and reload the app.' 
        });
      }

      // All permissions are granted, and location can now be retrieved.
      await this.getLocationAsync();
    }
  }

  getLocationAsync = async () => {
    let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
    location = { latitude: location.coords.latitude, longitude: location.coords.longitude };

    let address = await Location.reverseGeocodeAsync(location);
    address = { postalCode: address[0].postalCode, city: address[0].city, street: address[0].street, name: address[0].name };

    let markerDescription = (address.street && address.name)
      ? markerDescription = `${address.postalCode} ${address.city} | ${address.street} ${address.name}`
      : markerDescription = `${address.postalCode} ${address.city}`;
    
    this.props.navigation.setParams({ address, location, markerDescription });
    this.setState({ address, location, markerDescription, isLoading: false });
  }

  reloadApp = () => this.checkPermissionsAsync();

  _onMapReady = () => this.setState({ flex: 1 }); // Small hack to enable Google Control buttons.

  render() {
    return (
      <View style={styles.container}>
        {this.state.errorMessage ? (
          <View style={styles.containerText}>
            <Text style={styles.errorText}>{this.state.errorMessage}</Text>

            <TouchableOpacity style={styles.reloadButton} onPress={() => this.reloadApp()}>
              <Text style={styles.reloadButtonText}>RELOAD</Text>
            </TouchableOpacity>
          </View>
        ) : (
            this.state.isLoading ? (
              <View style={styles.containerText}>
                <ActivityIndicator size='large' color='#387EF5' />
              </View>
            ) : (
              <MapView
                provider='google'
                style={{ flex: this.state.flex }}
                region={{
                  latitude: this.state.location.latitude,
                  longitude: this.state.location.longitude,
                  latitudeDelta: 0.0500,
                  longitudeDelta: 0.0500
                }}
                onMapReady={this._onMapReady}
                showsUserLocation={true}
              >
                <Marker
                  coordinate={this.state.location}
                  title='Position'
                  description={this.state.markerDescription}
                />
              </MapView>
            )
          )
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
    // paddingTop: (Platform.OS === 'ios') ? 0 : Constants.statusBarHeight
  },
  containerText: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center'
  },
	reloadButton: {
    backgroundColor: 'black',
    elevation: 5,
    borderRadius: 10,
    marginTop: 10
	},
	reloadButtonText: {
    color: 'white',
    textAlign: 'center',
    padding: 10,
    fontWeight: '500'
	}
});
