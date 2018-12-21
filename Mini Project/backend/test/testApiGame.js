const mongoose = require('mongoose');
const expect = require('chai').expect;
const http = require('http');
const request = require('request-promise-native'); // request-promise-native (instead of request) returns ES6 promises, allowing the usage of the syntactic sugar of async/await.

const app = require('../app');
const dbSetup = require('../utils/dbSetup');
const User = require('../models/User');
const LocationBlog = require('../models/LocationBlog');
const Position = require('../models/Position');

const SERVER_TEST_PORT = require('../utils/settings').SERVER_TEST_PORT;
const API_URL = require('../utils/settings').GEO_API_URL;
var server = null;

describe('Testing REST API for /geoapi endpoints', function() {

  // Set the timeout for each test case.
  this.timeout(require('../utils/settings').MOCHA_TEST_TIMEOUT);

  // Connect to the Test DB and Test Server upon initialization.
  before(async function() {
    await dbSetup(require('../utils/settings').TEST_DB_URI);

    server = await http.createServer(app);
    await server.listen(SERVER_TEST_PORT, () => console.log(`Test Server successfully running on port: ${SERVER_TEST_PORT}`));
  });

  // Setup the database in a known state (3 users + 3 blogs) before EACH test.
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
    const positions = await Promise.all([
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

    const polygon = { type: 'Polygon', coordinates: [[
      [ 12.305996417999268, 55.927801658639915 ],
      [ 12.065423727035522, 55.84415691131587 ], 
      [ 12.295981049537659, 55.64604199191243 ],
      [ 12.570955753326416, 55.79525321778807 ],
      [ 12.305996417999268, 55.927801658639915 ]]] };
    await Position.collection.insertOne({ polygon });
  });

  // Disconnect from the Test DB and Test Server upon closure.
  after(async function() {
    // These two lines are needed to allow watch mode in Mocha.
    mongoose.models = {};
    mongoose.modelSchemas = {};
    await mongoose.connection.close();
    await server.close();
  });

  describe('Connection', function() {

    it('should confirm successful database connection', function() {
      // 0: disconnected    1: connected    2: connecting    3: disconnecting
      expect(mongoose.connection.readyState).to.equal(1);
    });

    it('should confirm successful server connection', function() {
      expect(server.listening).to.be.true;
    });
    
  });
  
  describe('Testing /isPlayerInArea/:lon/:lat', function() {

    it('should return true if player is in area', async function() {
      const url = `${API_URL}/isPlayerInArea/12.243361473083496/55.90604285727672`;
      const res = await request({ url, method: 'GET', json: true });
      expect(res.status).to.be.true;
    });

    it('should return false if player is NOT in area', async function() {
      const url = `${API_URL}/isPlayerInArea/12.243919372558594/55.90633153141064`;
      const res = await request({ url, method: 'GET', json: true });
      expect(res.status).to.be.false;
    });

  });

  describe('Testing /findNearbyPlayers/:long/:lat/:rad', function() {

    it('should return Dewrano within 100 radius', async function() {
      const url = `${API_URL}/findNearbyPlayers/12.409005314111708/55.7847898805561/100`;
      const res = await request({ url, method: 'GET', json: true });
      expect(res.players).to.be.an('array');
      expect(res.players).to.have.lengthOf(1);
      expect(res.players[0]).to.have.property('userName', 'Dewrano');
    });
    
    it('should return Dewrano and Deryam within 3000 radius', async function() {
      const url = `${API_URL}/findNearbyPlayers/12.409005314111708/55.7847898805561/3000`;
      const res = await request({ url, method: 'GET', json: true });
      expect(res.players).to.be.an('array');
      expect(res.players).to.have.lengthOf(2);
      expect(res.players[0]).to.have.property('userName', 'Dewrano');
      expect(res.players[1]).to.have.property('userName', 'Deryam');
    });

    it('should return Dewrano, Deryam and Denzo within 13700 radius', async function() {
      const url = `${API_URL}/findNearbyPlayers/12.409005314111708/55.7847898805561/13700`;
      const res = await request({ url, method: 'GET', json: true });
      expect(res.players).to.be.an('array');
      expect(res.players).to.have.lengthOf(3);
      expect(res.players[0]).to.have.property('userName', 'Dewrano');
      expect(res.players[1]).to.have.property('userName', 'Deryam');
      expect(res.players[2]).to.have.property('userName', 'Denzo');
    });

    it('should return no players', async function() {
      const url = `${API_URL}/findNearbyPlayers/12/55/100`;
      const res = await request({ url, method: 'GET', json: true });
      expect(res.players).to.be.an('array');
      expect(res.players).to.be.empty;
    });

  });

  describe('Testing /distanceToUser/:lon/:lat/:userName', function() {

    it('should return Dewrano with a distance of 0 meters (same point)', async function() {
      const url = `${API_URL}/distanceToUser/12.409005314111708/55.7847898805561/Dewrano`;
      const res = await request({ url, method: 'GET', json: true });
      expect(res).to.include({ 'distance': 0, 'to': 'Dewrano' });
    });

    it('should return Deryam with a distance of 2963.5038857243976 meters (approx. 2.9 km)', async function() {
      const url = `${API_URL}/distanceToUser/12.409005314111708/55.7847898805561/Deryam`;
      const res = await request({ url, method: 'GET', json: true });
      expect(res).to.include({ 'distance': 2963.5038857243976, 'to': 'Deryam' });
    });

    it('should return Denzo with a distance of 13673.807128696099 meters (approx. 13.7 km)', async function() {
      const url = `${API_URL}/distanceToUser/12.409005314111708/55.7847898805561/Denzo`;
      const res = await request({ url, method: 'GET', json: true });
      expect(res).to.include({ 'distance': 13673.807128696099, 'to': 'Denzo' });
    });

    it('should return 404 status code and "User not found" with a non-existing name', async function() {
      const url = `${API_URL}/distanceToUser/12.409005314111708/55.7847898805561/Random`;
      // resolveWithFullResponse: true = Get the full response instead of just the body (status code etc. can then be retrieved).
      // simple: false = Get a rejection only if the request failed for technical reasons, which means requests might succeed, 
      // but status code e.g. a 404 when a user isn't found.
      const res = await request({ url, method: 'GET', json: true, resolveWithFullResponse: true, simple: false });
      expect(res.statusCode).to.equal(404);
      expect(res.body).to.include({ 'msg': 'User not found', 'statusCode': 404 });
    });

  });

  describe('Testing /getGameArea', function() {

    it('should return a polygon with coordinates over the game area', async function() {
      const url = `${API_URL}/getGameArea`;
      const res = await request({ url, method: 'GET', json: true });

      expect(res.polygon).to.be.an('object');
      expect(res.polygon).to.include({ 'type': 'Polygon' });

      expect(res.polygon.coordinates).to.be.an('array');
      expect(res.polygon.coordinates[0]).to.have.lengthOf(5);
      expect(res.polygon.coordinates).to.deep.equal([[
        [ 12.305996417999268, 55.927801658639915 ],
        [ 12.065423727035522, 55.84415691131587 ],
        [ 12.295981049537659, 55.64604199191243 ],
        [ 12.570955753326416, 55.79525321778807 ],
        [ 12.305996417999268, 55.927801658639915 ]]]);
    });

  });

});
