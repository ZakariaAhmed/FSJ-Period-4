import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Notifications } from 'expo';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';
import { SimpleLineIcons, Ionicons } from '@expo/vector-icons'; // https://expo.github.io/vector-icons/
import DropdownAlert from 'react-native-dropdownalert';
import Dialog from 'react-native-dialog';

import facade from '../facades/apiFacade';

export default class Home extends React.Component {
  static navigationOptions = ({ navigation }) => {
    // Initialize params to be an empty object upon component load (this is to prevent errors with undefined).
    const { params = {} } = navigation.state;

    return {
      headerTitle: `${facade.userName}`, // Show the userName in the header.
      headerLeft: null,
      headerRight: (
        <View style={{ flexDirection: 'row' }}>
          <Ionicons
            style={{ paddingRight: 30 }}
            name='logo-game-controller-b'
            size={36}
            color='white'
            onPress={() => params.showDialog()}
          />

          <SimpleLineIcons
            style={{ paddingRight: 15 }}
            name='logout'
            size={32}
            color='white'
            onPress={() => params.logout()}
          />
        </View>
      )
    }
  };

  constructor(props) {
    super(props);

    const params = this.props.navigation.state.params;
    this.state = {
      location: params.location,
      address: params.address,
      markerDescription: params.markerDescription,
      distance: params.distance,
      drawLine: false,
      lineCoordinates: [],
      dialogVisible: false,
      dialogError: null,
      radius: 0,
      flex: 0 // Small hack to enable Google Control buttons.
    };
  }

  componentDidMount() {
    this.props.navigation.setParams({ logout: this.logout, showDialog: this.showDialog }); // Bind this.

    const alertMessage =
      `You have successfully logged in!\n` +
      `Found ${facade.friends.length} ${(facade.friends.length !== 1 ? 'friends' : 'friend')} ` +
      `within a distance of ${this.state.distance / 1000} km!`;
    this.dropdownSuccessAlert.alertWithType('success', `Welcome ${facade.userName}`, alertMessage);

    // Listen to notifications.
    this._notificationSubscription = Notifications.addListener(this.handleNotification);
  }

  componentWillUnmount() {
    this._notificationSubscription.remove();
  }

  logout = () => {
    facade.logout();
    this.props.navigation.navigate('Welcome');
  }

  handleNotification = (notification) => {
    const userName = notification.data.userName;
    this.dropdownInfoAlert.alertWithType('info', `${userName} is now online!`, '');
  };

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
    this.dropdownSuccessAlert.alertWithType('success', `Distance`, alertMessage);

    const lineCoordinates = [ this.state.location, markerLocation ];

    this.setState({ drawLine: true, lineCoordinates });
  }

  removePolyline = () => {
    if (this.state.drawLine) {
      this.setState({ drawLine: false, lineCoordinates: [] });
    }
  }

  showDialog = () => {
    this.setState({ dialogVisible: true, dialogError: null });
  };

  closeDialog = () => {
    this.setState({ dialogVisible: false, dialogError: null });
  };

  navigateToGameRoom = () => {
    const radius = Number(this.state.radius * 1000);
    
    if (!Number.isFinite(radius) || radius === 0) {
      return this.setState({ dialogError: 'Radius required.' });
    }

    this.props.navigation.state.params.radius = radius;
    this.props.navigation.navigate('Game', this.props.navigation.state.params);
    this.closeDialog();
  }

  _onMapReady = () => this.setState({ flex: 1 }); // Small hack to enable Google Control buttons.

  render() {
    return (
      <View style={styles.container}>
        <MapView
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

          <Circle
            center={{ latitude: this.state.location.latitude, longitude: this.state.location.longitude }}
            radius={this.state.distance}
            strokeWidth={1}
            strokeColor='#387EF5'
            fillColor='rgba(230, 240, 255, 0.5)'
          />

          <Marker
            coordinate={this.state.location}
            title='Position'
            description={this.state.markerDescription}
            onPress={(() => this.removePolyline())}
          />

          {facade.friends.map((friend, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: friend.latitude, longitude: friend.longitude }}
              title={friend.userName}
              pinColor='lightblue'
              identifier={friend.userName}
              onPress={((e) => this.distanceToUser(e))}
            />
          ))}

          {this.state.drawLine ? (
              <Polyline
                coordinates={this.state.lineCoordinates}
                strokeWidth={3}
                strokeColor='#000'
              />
            ) : null
          }
        </MapView>

        <Dialog.Container visible={this.state.dialogVisible}>
          <Dialog.Title>Game Room</Dialog.Title>

          <Dialog.Description>
            You're about to enter the Game Room.
            Enter a radius to see nearby players.
          </Dialog.Description>

          <Dialog.Input
            style={{ textAlign: 'center', fontSize: 18 }}
            label={this.state.dialogError ? this.state.dialogError : null}
            placeholder='Enter Radius Value (km) ...'
            placeholderTextColor='gray'
            returnKeyType='send'
            keyboardType='numeric'
            autoFocus
            onSubmitEditing={() => this.navigateToGameRoom()}
            onChangeText={(text) => this.setState({ radius: text })}
          />

          <Dialog.Button 
            label='Cancel' 
            bold 
            onPress={this.closeDialog} 
          />

          <Dialog.Button 
            label='Enter Game Room' 
            bold 
            onPress={this.navigateToGameRoom}
          />
        </Dialog.Container>

        <DropdownAlert
          ref={ref => this.dropdownSuccessAlert = ref}
          useNativeDriver
          successImageSrc={null}
          closeInterval={5000}
          showCancel={true}
          cancelBtnImageStyle={{ padding: 8, marginTop: 8, width: 36, height: 36, alignSelf: 'center' }}
        />

        <DropdownAlert
          ref={ref => this.dropdownInfoAlert = ref}
          useNativeDriver
          closeInterval={3000}
          showCancel={true}
          titleStyle={{ marginTop: 2, fontSize: 16, textAlign: 'left', fontWeight: 'bold', color: 'white', backgroundColor: 'transparent' }}
          imageStyle={{ padding: 2, marginTop: 2, width: 36, height: 36, alignSelf: 'center' }}
          cancelBtnImageStyle={{ padding: 2, marginTop: 2, width: 36, height: 36, alignSelf: 'center' }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
});
