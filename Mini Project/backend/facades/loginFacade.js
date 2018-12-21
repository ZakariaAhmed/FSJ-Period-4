const { Expo } = require('expo-server-sdk');
const User = require('../models/User');
const Position = require('../models/Position');

const bcrypt = require('../utils/bcrypt');

async function login(userName, password, longitude, latitude, distance, pushToken) {
  let user = await User.findOne({ userName: userName }).then(async function(user) {
    const match = await bcrypt.comparePassword(password, user.password);

    if (match) {
      return user;
    }
    else {
      throw { msg: 'Wrong username or password', statusCode: 403 };
    }
  });

  // Assign push token and update user if they don't have one, or if they've logged on a different device.
  if (user.pushToken === null || user.pushToken !== pushToken) {
    user = await User.findByIdAndUpdate(user._id, { $set: { pushToken } }, { new: true }).exec();
  }

  const position = await Position.findOneAndUpdate(
    { user: user._id },
    { loc: {
        type: 'Point',
        coordinates: [ longitude, latitude ]
      },
      created: Date.now(),
    }, { new: true, upsert: true }
  ).exec();

  let friends = await findFriends(position, distance);

  if (friends.length > 0) {
    // Notify friends via push notifications.
    await notifyFriends(user, friends);

    // Format the friends array, including removing a potential push token.
    friends = friends.map((element) => {
      const userName = element.user.userName;
      const lon = element.loc.coordinates[0];
      const lat = element.loc.coordinates[1];
      return { userName, longitude: lon, latitude: lat };
    });
  }

  return { friends };
}

function findFriends(position, distance) {
  return Position.find({
    user: { $ne: position.user._id }, // Exclude the user.
    loc: {
      $near: {
        $geometry: position.loc,
        $maxDistance: distance
      }
    }
  }, { _id: 0, created: 0, __v: 0 } // Omit the Position's _id, created and __v fields.
  ).populate('user', { userName: 1, pushToken: 1, _id: 0 }).exec(); // Omit everything, including the user's ID, but the username & push token.
  // ).populate({ path: 'user' , select: 'userName -_id' }).exec(); 
}

async function notifyFriends(user, friends) {
  const expo = new Expo();
  
  // Create the messages that you want to send to clients.
  const messages = [];
  for (let friend of friends) {
    const userName = user.userName;
    const { pushToken } = friend.user;

    // Skip friends that does not have a push token,
    // possibly due to them not using the app client.
    if (pushToken !== null) {
      if (pushToken === user.pushToken) {
        console.error(`The same push token ${pushToken} is assigned to the user and friend!`);
        continue;
      }

      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token!`);
        continue;
      }

      messages.push({
        to: pushToken,
        sound: 'default',
        body: `${userName} is now online!`,
        data: { userName }
      });
    }
  }

  // Only run if there are any messages.
  if (messages.length > 0) {
    const chunks = expo.chunkPushNotifications(messages);
    
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } 
      catch (error) {
        console.error(error);
      }
    };
  }
}

module.exports = login;
