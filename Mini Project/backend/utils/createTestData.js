require('./dbSetup')();

const User = require('../models/User');
const Position = require('../models/Position');
const LocationBlog = require('../models/LocationBlog');

// Utility Function to create Users.
function userCreator(firstName, lastName, userName, password, email, type, company, companyUrl) {
  // Second object is to demonstrate embedding.
  // const job = [{ type, company, companyUrl }, { type, company, companyUrl }];
  const job = [{ type, company, companyUrl }];
  const userDetail = { firstName, lastName, userName, password, email, job };
  const user = new User(userDetail);
  return user.save();
}

// Utility Function to create Positions.
function positionCreator(userId, longitude, latitude, dateInFuture) {
  const positionDetail = { user: userId, loc: { coordinates: [ longitude, latitude ] } };
  if (dateInFuture) { // For test data.
    // Prevent positions from being deleted.
    positionDetail.created = '2022-09-25T20:40:21.899Z';
  }
  const position = new Position(positionDetail);
  return position.save();
}

// Utility Function to create LocationBlogs.
function locationBlogCreator(author, info, longitude, latitude) {
  const locationBlogDetail = { author, info, pos: { longitude, latitude } };
  const locationBlog = new LocationBlog(locationBlogDetail);
  return locationBlog.save();
}

// Here we will setup users, positions and location blogs.
async function createTestData() {
  // Drop collections.
  await User.collection.drop();
  await Position.collection.drop();
  await LocationBlog.collection.drop();

  // Ensure that all previous users are deleted along with their relations before we continue by using async/await.
  await User.deleteMany({});
  await Position.deleteMany({});
  await LocationBlog.deleteMany({});

  const userPromises = [
    // userCreator(firstName, lastName, userName, password, email, type, company, companyUrl)
    userCreator('Devran', 'Coskun', 'Dewrano', 'test123', 'devran-coskun@live.dk', 'Private', 'DC Company', 'https://www.devrancoskun.dk'),
    userCreator('Deniz', 'Coskun', 'Denzo', 'test123', 'deniz-coskun@live.dk', 'Private', 'DC Company', 'https://www.denizcoskun.dk'),
    userCreator('Derya', 'Coskun', 'Deryam', 'test123', 'derya-coskun@live.dk', 'Private', 'DC Company', 'https://www.deryacoskun.dk')
  ];
  const users = await Promise.all(userPromises);

  const positionPromises = [
    // positionCreator(userId, longitude, latitude, dateInFuture)
    // true = This position will not be deleted (expired) after the set time (1 minute).
    positionCreator(users[0]._id, 12.409005314111708, 55.7847898805561, true),
    positionCreator(users[1]._id, 12.202776297926903, 55.825470793835926, true),
    positionCreator(users[2]._id, 12.378473058342932, 55.80513979634884, true)
  ];  
  const positions = await Promise.all(positionPromises);

  const locationBlogPromises = [
    // locationBlogCreator(author, info, longitude, latitude)
    locationBlogCreator(users[0]._id, 'Cool Place', positions[0].loc.coordinates[0], positions[0].loc.coordinates[1]),
    locationBlogCreator(users[1]._id, 'Another Cool Place', positions[1].loc.coordinates[0], positions[1].loc.coordinates[1]),
    locationBlogCreator(users[2]._id, 'The Coolest Place', positions[2].loc.coordinates[0], positions[2].loc.coordinates[1]),
  ];
  const locationBlogs = await Promise.all(locationBlogPromises);

  // Add a few likes for "Cool Place".
  const locationBlogFacade = require('../facades/locationBlogFacade');
  await locationBlogFacade.likeLocationBlog(locationBlogs[0]._id, users[1]._id); // Liked by Deniz.
  await locationBlogFacade.likeLocationBlog(locationBlogs[0]._id, users[2]._id); // Liked by Derya.
  // const likeCount = await locationBlogFacade.getLikeCount(locationBlogs[0]._id);
  // console.log(`Likes for: ${locationBlogs[0].info} (count: ${likeCount})`);

  /*
  // console.log(users);
  // console.log(positions);
  // console.log(locationBlogs);
  // console.log(locationBlogs.map((s) => s.slug));
  */

  const polygon = { type: 'Polygon', coordinates: [[
    [ 12.305996417999268, 55.927801658639915 ],
    [ 12.065423727035522, 55.84415691131587 ], 
    [ 12.295981049537659, 55.64604199191243 ],
    [ 12.570955753326416, 55.79525321778807 ],
    [ 12.305996417999268, 55.927801658639915 ]]] 
  };
  await Position.collection.insertOne({ polygon });
  // console.log(polygon.type, polygon.coordinates);
}

createTestData();
