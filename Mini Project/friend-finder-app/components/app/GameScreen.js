import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Location, Permissions } from 'expo';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import DropdownAlert from 'react-native-dropdownalert';

import facade from '../facades/apiFacade';

export default class Game extends React.Component {
  static navigationOptions = {
    headerTitle: `Game Room`
  };

  constructor(props) {
    super(props);

    const params = this.props.navigation.state.params;
    this.state = {
      isLoading: true,
      gameArea: [],
      players: [],
      polygonCenter: null,
      location: params.location, 
      // Comment above line and uncomment the following line to test outside Game Area & Alerts.
      // location: { longitude: 12.243919372558594, latitude: 55.90633153141064 },
      address: params.address,
      markerDescription: params.markerDescription,
      distance: params.distance,
      radius: params.radius,
      errorMessage: null,
      flex: 0 // Small hack to enable Google Control buttons.
    };
  }

  async componentDidMount() {
    const location = this.state.location;
    await this.isPlayerInArea(location);

    // Fetch Game Area.
    const gameArea = await facade.fetchGameData('gameArea');
    const coordinates = gameArea.polygon.coordinates[0];

    // Fetch Nearby Players.
    const radius = this.state.radius;
    let { players } = await facade.fetchGameData('findNearbyPlayers', { location, radius });
    // Remove the user (they have a special marker).
    players = players.filter((player) => player.userName !== facade.userName);

    // Create a new polygon that is accepted by MapView, which
    // requires objects of latitude and longitude.
    // Note: We swap lon and lat values.
    const polygon = gameArea.polygon.coordinates[0].map((point) => {
      return { latitude: point[1], longitude: point[0] };
    });

    const polygonCenter = getPolygonCenterPoint(coordinates);

    this.setState({ isLoading: false, gameArea: polygon, players, polygonCenter });
  }

  getLocationAsync = async () => {
    const { locationServicesEnabled } = await Location.getProviderStatusAsync();
    if (!locationServicesEnabled) {
      return this.setState({
        errorMessage: 'Location services are disabled.\nPlease enable location and reload the app.'
      });
    }
    else {
      this.setState({ errorMessage: null  });

      const { status } = await Permissions.askAsync(Permissions.LOCATION);
      if (status !== 'granted') {
        return this.setState({ 
          errorMessage: 'Permission to access location was denied.\nPlease reload the app and allow permission.' 
        });
      }
  
      let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
      location = { latitude: location.coords.latitude, longitude: location.coords.longitude };

      let address = await Location.reverseGeocodeAsync(location);
      address = { postalCode: address[0].postalCode, city: address[0].city, street: address[0].street, name: address[0].name };
  
      let markerDescription = (address.street && address.name)
        ? markerDescription = `${address.postalCode} ${address.city} | ${address.street} ${address.name}`
        : markerDescription = `${address.postalCode} ${address.city}`;
      
      await this.isPlayerInArea(location);

      this.setState({ address, location, markerDescription, isLoading: false });
    }
  }

  centerOnGameArea = async () => {
    this.map.animateToRegion({
      latitude: this.state.polygonCenter[1],
      longitude: this.state.polygonCenter[0],
      latitudeDelta: 0.1000,
      longitudeDelta: 0.5000
    }, 1000);
  }

  isPlayerInArea = async (location) => {
    const { status } = await facade.fetchGameData('isPlayerInArea', { location });
    if (status) {
      const alertMessage = 
          'You are inside the Game Area!\n' +
          'To update, check your live position.';

      this.dropdownAlert.alertWithType('success', `Game Room`, alertMessage);
    }
    else {
      const alertMessage = 
          'You are NOT inside the Game Area!\n' +
          'To update, check your live position.';

      this.dropdownAlert.alertWithType('error', `Game Room`, alertMessage);
    }
  }

  distanceToUser = async (e) => {
    const markerUserName = e.nativeEvent.id;
    const markerLocation = e.nativeEvent.coordinate;

    const location = this.state.location;
    let { distance } = await facade.fetchGameData('distanceToUser', { location, userName: markerUserName });
    // Convert from meters to km, and trim down to 1 decimal, and round.
    distance = (distance / 1000).toFixed(1);

    const alertMessage =
      `You are currently ${distance} km away from ${markerUserName}!\n` +
      `A line to your friend has been drawn.`;
    this.dropdownAlert.alertWithType('success', `Distance`, alertMessage);

    const lineCoordinates = [ this.state.location, markerLocation ];

    this.setState({ drawLine: true, lineCoordinates });
  }

  removePolyline = () => {
    if (this.state.drawLine) {
      this.setState({ drawLine: false, lineCoordinates: [] });
    }
  }

  _onMapReady = () => this.setState({ flex: 1 }); // Small hack to enable Google Control buttons.

  render() {
    return (
      <View style={styles.container}>
        {this.state.isLoading ? (
            <View style={styles.containerText}>
              <ActivityIndicator size='large' color='#387EF5' />
            </View>
          ) : (
            <View style={styles.container}>
              <MapView
                ref={map => { this.map = map }}
                provider='google'
                style={{ flex: this.state.flex }}
                // Use initialRegion instead of region to prevent navigating to user position after clicking a marker.
                initialRegion={{
                  latitude: this.state.location.latitude,
                  longitude: this.state.location.longitude,
                  latitudeDelta: 0.1000,
                  longitudeDelta: 0.5000
                }}
                onMapReady={this._onMapReady}
                showsUserLocation={true}
              >
                <Marker
                  coordinate={this.state.location}
                  title='Position'
                  description={this.state.markerDescription}
                />

                <Polygon 
                  coordinates={this.state.gameArea}
                  strokeWidth={1}
                  fillColor='rgba(128, 153, 177, 0.5)' 
                />

                {this.state.players.length > 0 ? (
                    this.state.players.map((player, index) => (
                      <Marker
                        key={index}
                        coordinate={{ latitude: player.latitude, longitude: player.longitude }}
                        title={player.userName}
                        pinColor='lightblue'
                        identifier={player.userName}
                        onPress={((e) => this.distanceToUser(e))}
                      />
                    ))
                  ) : null
                }

                {this.state.drawLine ? (
                    <Polyline
                      coordinates={this.state.lineCoordinates}
                      strokeWidth={3}
                      strokeColor='#000'
                    />
                  ) : null
                }
            </MapView>

            <TouchableOpacity style={styles.buttonContainer} onPress={this.getLocationAsync}>
              <Text style={styles.buttonText}>Check Live Position</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonContainer} onPress={this.centerOnGameArea}>
              <Text style={styles.buttonText}>Show Game Area</Text>
            </TouchableOpacity>
          </View>
          )
        }

        <DropdownAlert 
          ref={ref => this.dropdownAlert = ref} 
          useNativeDriver 
          successImageSrc={null}
          closeInterval={3000} 
          showCancel={true}
          cancelBtnImageStyle={{ padding: 8, marginTop: 8, width: 36, height: 36, alignSelf: 'center' }}
        />
      </View>
    );
  }
}

function getPolygonCenterPoint(arr) {
    var x = arr.map ((x) => x[0]);
    var y = arr.map ((y) => y[1]);
    var cx = (Math.min (...x) + Math.max (...x)) / 2;
    var cy = (Math.min (...y) + Math.max (...y)) / 2;
    return [cx, cy];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  containerText: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonContainer: {
    backgroundColor: '#387EF5',
    margin: 3,
    padding: 5
  },
  buttonText: {
    fontSize: 22,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold'
  },
});
