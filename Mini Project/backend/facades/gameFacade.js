const Position = require('../models/Position');
const User = require('../models/User');

async function isPlayerInArea(lon, lat) {
  const point = { 'type': 'Point', coordinates: [ lon, lat ] };
  const count = await Position.find({
    polygon: {
      $geoIntersects: {
        $geometry: point
      }
    }
  }).countDocuments().exec(); // countDocuments() will return either 1 or 0, depending on if the point exists in the polygon.

  return count > 0 ? true : false;
}

async function findNearbyPlayers(lon, lat, rad) {
  const point = { 'type': 'Point', coordinates: [ lon, lat ] };
  let players = await Position.find({
    loc: {
      $near: {
        $geometry: point,
        $maxDistance: rad
      }
    }
  }, { _id: 0, created: 0, __v: 0 }
  ).populate('user', { userName: 1, _id: 0 }).exec();

  players = players.map((element) => {
    const userName = element.user.userName;
    const lon = element.loc.coordinates[0];
    const lat = element.loc.coordinates[1];
    return { userName, longitude: lon, latitude: lat };
  });

  return { players };
}

async function distanceToUser(lon, lat, userName) {
  const user = await User.findOne({ userName }).exec();
  if (user === null) {
    throw { msg: 'User not found', statusCode: 404 };
  }

  const point = { 'type': 'Point', coordinates: [ lon, lat ] };
  const result = await Position.aggregate([ // aggregate pipeline is needed to retrieve the distance.
    {
      $geoNear: { // $geoNear gives the distance from the point (opposed to $near).
        near: point,
        distanceField: 'distance', // The distance field.
        spherical: true // As a 2dsphere index has been set (see Position.js), then 'spherical' must be true.
      }
    }, 
    {
      $match: {
        user: user._id // Only retrieve the given user.
      }
    }, 
    {
      $project: {
        // Exclude the _id field and only include the distance (this will exclude all other fields other than _id).
        _id : 0,
        distance: 1
      }
    }
  ]).exec();

  return { distance: result[0].distance, to: userName };
}

async function getGameArea() {
  const polygon = await Position.findOne({}).where('polygon').exists().select({ polygon: 1, _id: 0 }).exec();
  return polygon.toObject();
}

module.exports = {
  isPlayerInArea,
  findNearbyPlayers,
  distanceToUser,
  getGameArea
};
