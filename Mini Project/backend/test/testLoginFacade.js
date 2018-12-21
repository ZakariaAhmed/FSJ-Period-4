const mongoose = require('mongoose');
const expect = require('chai').expect;

const dbSetup = require('../utils/dbSetup');
const User = require('../models/User');
const LocationBlog = require('../models/LocationBlog');
const Position = require('../models/Position');
const login = require('../facades/loginFacade');

describe('Testing the Login Facade', function() {

  // Set the timeout for each test case.
  this.timeout(require('../utils/settings').MOCHA_TEST_TIMEOUT);

  // Connect to the Test DB upon initialization.
  before(async function() {
    await dbSetup(require('../utils/settings').TEST_DB_URI);
  });

  // Setup the database in a known state (3 users + 3 blogs) before EACH test.
  var positions = [];
  beforeEach(async function() {
    // Only uncomment these below if you've made changes to the models, and need to rebuild.
    // Compared to other tests, these must be commented, as they also drop indexes, and they are required when using GeoJSON.
    // await User.collection.drop();
    // await Position.collection.drop();
    // await LocationBlog.collection.drop();
    await User.deleteMany({});
    await Position.deleteMany({});
    await LocationBlog.deleteMany({});
    const users = await Promise.all([
      new User({ firstName: 'Devran', lastName: 'Coskun', userName: 'Dewrano', password: 'test123', email: 'devran-coskun@live.dk', job: { type: 'Private', company: 'DC A/S', companyUrl: 'https://www.devrancoskun.dk' } }).save(),
      new User({ firstName: 'Deniz', lastName: 'Coskun', userName: 'Denzo', password: 'test456', email: 'deniz-coskun@live.dk' }).save(),
      new User({ firstName: 'Derya', lastName: 'Coskun', userName: 'Deryam', password: 'test789', email: 'derya-coskun@live.dk', job: { type: 'Public', company: 'DC ApS', companyUrl: 'https://www.deryacoskun.dk' } }).save()
    ]);
    // These positions should not be deleted (expired) after the set time (1 minute).
    const created = '2022-09-25T20:40:21.899Z';
    positions = await Promise.all([
      // Note: user[0] (Dewrano) is approx. 3.0 km away from user[2] (Deryam), and approx. 13,7 km away from user[1] (Denzo).
      new Position({ user: users[0]._id, loc: { coordinates: [ 12.409005314111708, 55.7847898805561 ] }, created }).save(),
      new Position({ user: users[1]._id, loc: { coordinates: [ 12.202776297926903, 55.825470793835926 ] }, created }).save(),
      new Position({ user: users[2]._id, loc: { coordinates: [ 12.378473058342932, 55.80513979634884 ] }, created }).save(),
    ]);
    const pos1 = positions[0].loc.coordinates;
    const pos2 = positions[1].loc.coordinates;
    const pos3 = positions[2].loc.coordinates;
    await Promise.all([
      new LocationBlog({ author: users[0]._id, info: 'Cool LocationBlog', pos: { longitude: pos1[0], latitude: pos1[1] }}).save(),
      new LocationBlog({ author: users[1]._id, info: 'Another Cool LocationBlog', pos: { longitude: pos2[0], latitude: pos2[1] }}).save(),
      new LocationBlog({ author: users[2]._id, info: 'The Coolest LocationBlog', pos: { longitude: pos3[0], latitude: pos3[1] }}).save()
    ]);
  });

  // Disconnect from the Test DB upon closure.
  after(async function() {
    // These two lines are needed to allow watch mode in Mocha.
    mongoose.models = {};
    mongoose.modelSchemas = {};
    await mongoose.connection.close();
  });

  describe('Connection', function() {

    it('should confirm successful database connection', function() {
      // 0: disconnected    1: connected    2: connecting    3: disconnecting
      expect(mongoose.connection.readyState).to.equal(1);
    });

  });

  describe('Positive Login Tests', function() {
    
    it('should allow Dewrano to login and find zero nearby friends', async function () {
      const pos = positions[0].loc.coordinates;
      const distance = 1000; // 1 km.
      const res = await login('Dewrano', 'test123', pos[0], pos[1], distance);
      expect(res.friends).to.be.an('array');
      expect(res.friends).to.be.empty;
    });

    it('should allow Dewrano to login and find one nearby friend', async function () {
      const pos = positions[0].loc.coordinates;
      const distance = 3000; // 3 km.
      const res = await login('Dewrano', 'test123', pos[0], pos[1], distance);
      expect(res.friends).to.be.an('array');
      expect(res.friends).to.have.lengthOf(1);
      // Dewrano is approx. 3.0 km away from Deryam.
      expect(res.friends[0]).to.have.property('userName', 'Deryam');
    });

    it('should allow Dewrano to login and find all (two) nearby friends', async function () {
      const pos = positions[0].loc.coordinates;
      const distance = 13700; // 13,7 km.
      const res = await login('Dewrano', 'test123', pos[0], pos[1], distance);
      expect(res.friends).to.be.an('array');
      expect(res.friends).to.have.lengthOf(2);
      // Dewrano is approx. 3.0 km away from Deryam, and approx. 13,7 km away from Denzo.
      expect(res.friends[0]).to.have.property('userName', 'Deryam');
      expect(res.friends[1]).to.have.property('userName', 'Denzo');
    });

  });

  describe('Negative Login Tests', function() {

    it('should throw an Error ("Wrong username or password") with a 403 status code', async function () {
      try {
        const pos = positions[0].loc.coordinates;
        const distance = 1000;
        await login('Dewrano', 'wrong_password', pos[0], pos[1], distance);
      } 
      catch (err) {
        expect(err).to.include({ 'msg': 'Wrong username or password', 'statusCode': 403 });
      }
    });

  });

});
