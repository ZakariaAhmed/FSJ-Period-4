const mongoose = require('mongoose');
const expect = require('chai').expect;
const http = require('http');
const request = require('request-promise-native'); // request-promise-native (instead of request) returns ES6 promises, allowing the usage of the syntactic sugar of async/await.

const app = require('../app');
const dbSetup = require('../utils/dbSetup');
const LocationBlog = require('../models/LocationBlog');
const locationBlogFacade = require('../facades/locationBlogFacade');
const User = require('../models/User');
const userFacade = require('../facades/userFacade');

const SERVER_TEST_PORT = require('../utils/settings').SERVER_TEST_PORT;
const API_URL = require('../utils/settings').API_URL;
var server = null;

describe('Testing REST API for /locationblogs endpoints', function() {

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
    await User.collection.drop();
    await LocationBlog.collection.drop();
    await User.deleteMany({});
    await LocationBlog.deleteMany({});
    const users = await Promise.all([
      new User({ firstName: 'Devran', lastName: 'Coskun', userName: 'Dewrano', password: 'test123', email: 'devran-coskun@live.dk', job: { type: 'Private', company: 'DC A/S', companyUrl: 'https://www.devrancoskun.dk' } }).save(),
      new User({ firstName: 'Deniz', lastName: 'Coskun', userName: 'Denzo', password: 'test456', email: 'deniz-coskun@live.dk' }).save(),
      new User({ firstName: 'Derya', lastName: 'Coskun', userName: 'Deryam', password: 'test789', email: 'derya-coskun@live.dk', job: { type: 'Public', company: 'DC ApS', companyUrl: 'https://www.deryacoskun.dk' } }).save()
    ]);
    await Promise.all([
      // Add two blogs to Deniz and one to Derya.
      new LocationBlog({ author: users[1]._id, info: 'Cool LocationBlog', pos: { longitude: 123, latitude: 456 }}).save(),
      new LocationBlog({ author: users[2]._id, info: 'Another Cool LocationBlog', pos: { longitude: 456, latitude: 789 }}).save(),
      new LocationBlog({ author: users[2]._id, info: 'The Coolest LocationBlog', pos: { longitude: 789, latitude: 123 }}).save()
    ]);
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
  
  describe('Positive LocationBlog Tests', function() {

    it('should find all Location Blogs (non-populated on "author")', async function() {
      const res = await request({ url: `${API_URL}/locationblogs`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('array');
      expect(res).to.have.lengthOf(3);

      // Assert that 'author' (user) is not populated - it is a string containing the author's id,
      // and not an object (which is what it would be if 'author' was to be populated - it would contain the author's details).
      expect(res[0].author).to.be.a('string');
      expect(res[0].author).to.not.be.an('object');
    });

    it('should find all Location Blogs (populated on "author")', async function() {
      const res = await request({ url: `${API_URL}/locationblogs/populate`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('array');
      expect(res).to.have.lengthOf(3);

      // Assert that 'author' (user) IS populated - it is an object containing the author's details,
      // and not a string (which is what it would be if 'author' wasn't populated - it would contain the author's id).
      expect(res[0].author).to.be.an('object');
      expect(res[0].author).to.not.be.a('string');
    });

    it('should find all slugs', async function() {
      const res = await request({ url: `${API_URL}/locationblogs/slugs`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('array');
      expect(res).to.have.lengthOf(3);

      const locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      expect(res[0]).to.equal(`/locationblogs/${locationBlogs[0]._id}`);
      expect(res[1]).to.equal(`/locationblogs/${locationBlogs[1]._id}`);
      expect(res[2]).to.equal(`/locationblogs/${locationBlogs[2]._id}`);

      // This test also covers findOneSlugById().
      const slug1 = await locationBlogFacade.findOneSlugById(res[0]);
      expect(res[0]).to.equal(slug1);

      const slug2 = await locationBlogFacade.findOneSlugById(res[1]);
      expect(res[1]).to.equal(slug2);

      const slug3 = await locationBlogFacade.findOneSlugById(res[2]);
      expect(res[2]).to.equal(slug3);
    });

    it('should add "Test LocationBlog" to Devran Coskun', async function() {
      const user = await userFacade.findByUserName('Dewrano');

      const locationBlog = {
        "info": "Test LocationBlog", 
        "longitude": "1751", 
        "latitude": "2750" 
      };

      const res = await request({ url: `${API_URL}/locationblogs/${user._id}`, method: 'POST', json: true, body: locationBlog });
      expect(res).to.not.be.null;
      expect(res).to.be.an('object');
      expect(res.info).to.equal('Test LocationBlog');
      expect(res.pos.longitude).to.equal(1751);
      expect(res.pos.latitude).to.equal(2750);
      
      // Assert that the location blog has been added to the database.
      const locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      expect(locationBlogs).to.not.be.null;
      expect(locationBlogs).to.be.an('array');
      expect(locationBlogs).to.have.lengthOf(4);
    });

    it('should find "Test LocationBlog" by ID (non-populated on "author")', async function() {
      const user = await userFacade.findByUserName('Dewrano');

      // Every time this file is run, new LocationBlogs are generated, which means new IDs are also generated every time.
      // Create the location blog and then find the location blog by retrieving the ID afterwards.
      const locationBlog = await locationBlogFacade.addLocationBlog(user, 'Test LocationBlog', 1751, 2750);

      const res = await request({ url: `${API_URL}/locationblogs/${locationBlog._id}`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('object');
      expect(res.info).to.equal('Test LocationBlog');
      expect(res.pos.longitude).to.equal(1751);
      expect(res.pos.latitude).to.equal(2750);
      
      // Assert that 'author' (user) is not populated - it is a string containing the author's id,
      // and not an object (which is what it would be if 'author' was to be populated - it would contain the author's details).
      expect(res.author).to.be.a('string');
      expect(res.author).to.not.be.an('object');
    });

    it('should find "Test LocationBlog" by ID (populated on "author")', async function() {
      const user = await userFacade.findByUserName('Dewrano');

      // Every time this file is run, new LocationBlogs are generated, which means new IDs are also generated every time.
      // Create the location blog and then find the location blog by retrieving the ID afterwards.
      const locationBlog = await locationBlogFacade.addLocationBlog(user, 'Test LocationBlog', 1751, 2750);

      const res = await request({ url: `${API_URL}/locationblogs/${locationBlog._id}/populate`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('object');
      expect(res.info).to.equal('Test LocationBlog');
      expect(res.pos.longitude).to.equal(1751);
      expect(res.pos.latitude).to.equal(2750);
      
      // Assert that 'author' (user) IS populated - it is an object containing the author's details,
      // and not a string (which is what it would be if 'author' wasn't populated - it would contain the author's id).
      expect(res.author).to.be.an('object');
      expect(res.author).to.not.be.a('string');
    });

    it('should find all Location Blogs by Author/User (non-populated on "author")', async function() {
      const userPromises = [
        userFacade.findByUserName('Dewrano'),
        userFacade.findByUserName('Denzo'),
        userFacade.findByUserName('Deryam')
      ];
      
      const users = await Promise.all(userPromises).then(Promise.resolve());

      // First user (Devran Coskun). Assert that user has zero location blogs (see beforeEach).
      const user1LocationBlogs = await request({ url: `${API_URL}/locationblogs/author/${users[0]._id}`, method: 'GET', json: true });
      expect(user1LocationBlogs).to.not.be.null;
      expect(user1LocationBlogs).to.be.an('array');

      // Second user (Deniz Coskun). Assert that user has one location blog (see beforeEach).
      const user2LocationBlogs = await request({ url: `${API_URL}/locationblogs/author/${users[1]._id}`, method: 'GET', json: true });
      expect(user2LocationBlogs).to.not.be.null;
      expect(user2LocationBlogs).to.be.an('array');
      expect(user2LocationBlogs).to.have.lengthOf(1);
      expect(user2LocationBlogs[0].info).to.equal('Cool LocationBlog');
      expect(user2LocationBlogs[0].pos.longitude).to.equal(123);
      expect(user2LocationBlogs[0].pos.latitude).to.equal(456);
      
      // Assert that 'author' (user) is not populated - it is a string containing the author's id,
      // and not an object (which is what it would be if 'author' was to be populated - it would contain the author's details).
      expect(user2LocationBlogs[0].author).to.be.a('string');
      expect(user2LocationBlogs[0].author).to.not.be.an('object');

      // Third user (Derya Coskun). Assert that user has three location blogs (see beforeEach).
      const user3LocationBlogs = await request({ url: `${API_URL}/locationblogs/author/${users[2]._id}`, method: 'GET', json: true });
      expect(user3LocationBlogs).to.not.be.null;
      expect(user3LocationBlogs).to.be.an('array');
      expect(user3LocationBlogs).to.have.lengthOf(2);
      // This user has more than one location blog, which means that more than one Promise has been resolved,
      // but we do not know which Promise resolved first. There's simply no certainty in which order a Promise resolves.
      // Therefore, map() is used in conjunction with satisfy() to loop through every location blog, 
      // and check whether the value is from the first LocationBlog or the other.
      user3LocationBlogs.map((locationBlog) => {
        expect(locationBlog.info).to.satisfy(function(info) {
          return info === 'Another Cool LocationBlog' || info === 'The Coolest LocationBlog';
        });
        expect(locationBlog.pos.longitude).to.satisfy(function(longitude) {
          return longitude === 456 || longitude === 789;
        });
        expect(locationBlog.pos.latitude).to.satisfy(function(latitude) {
          return latitude === 789 || latitude === 123;
        });
      });
      // Assert that 'author' (user) is not populated - it is a string containing the author's id,
      // and not an object (which is what it would be if 'author' was to be populated - it would contain the author's details).
      expect(user3LocationBlogs[0].author).to.be.a('string');
      expect(user3LocationBlogs[0].author).to.not.be.an('object');
      expect(user3LocationBlogs[1].author).to.be.a('string');
      expect(user3LocationBlogs[1].author).to.not.be.an('object');
    });

    it('should find all Location Blogs by Author/User (populated on "author")', async function() {
      const userPromises = [
        userFacade.findByUserName('Dewrano'),
        userFacade.findByUserName('Denzo'),
        userFacade.findByUserName('Deryam')
      ];
      
      const users = await Promise.all(userPromises).then(Promise.resolve());

      // First user (Devran Coskun). Assert that user has zero location blogs (see beforeEach).
      const user1LocationBlogs = await request({ url: `${API_URL}/locationblogs/author/${users[0]._id}/populate`, method: 'GET', json: true });
      expect(user1LocationBlogs).to.not.be.null;
      expect(user1LocationBlogs).to.be.an('array');

      // Second user (Deniz Coskun). Assert that user has one location blog (see beforeEach).
      const user2LocationBlogs = await request({ url: `${API_URL}/locationblogs/author/${users[1]._id}/populate`, method: 'GET', json: true });
      expect(user2LocationBlogs).to.not.be.null;
      expect(user2LocationBlogs).to.be.an('array');
      expect(user2LocationBlogs).to.have.lengthOf(1);
      expect(user2LocationBlogs[0].info).to.equal('Cool LocationBlog');
      expect(user2LocationBlogs[0].pos.longitude).to.equal(123);
      expect(user2LocationBlogs[0].pos.latitude).to.equal(456);
      
      // Assert that 'author' (user) IS populated - it is an object containing the author's details,
      // and not a string (which is what it would be if 'author' wasn't populated - it would contain the author's id).
      expect(user2LocationBlogs[0].author).to.be.an('object');
      expect(user2LocationBlogs[0].author).to.not.be.a('string');

      // Third user (Derya Coskun). Assert that user has three location blogs (see beforeEach).
      const user3LocationBlogs = await request({ url: `${API_URL}/locationblogs/author/${users[2]._id}/populate`, method: 'GET', json: true });
      expect(user3LocationBlogs).to.not.be.null;
      expect(user3LocationBlogs).to.be.an('array');
      expect(user3LocationBlogs).to.have.lengthOf(2);
      // This user has more than one location blog, which means that more than one Promise has been resolved,
      // but we do not know which Promise resolved first. There's simply no certainty in which order a Promise resolves.
      // Therefore, map() is used in conjunction with satisfy() to loop through every location blog, 
      // and check whether the value is from the first LocationBlog or the other.
      user3LocationBlogs.map((locationBlog) => {
        expect(locationBlog.info).to.satisfy(function(info) {
          return info === 'Another Cool LocationBlog' || info === 'The Coolest LocationBlog';
        });
        expect(locationBlog.pos.longitude).to.satisfy(function(longitude) {
          return longitude === 456 || longitude === 789;
        });
        expect(locationBlog.pos.latitude).to.satisfy(function(latitude) {
          return latitude === 789 || latitude === 123;
        });
      });
      // Assert that 'author' (user) IS populated - it is an object containing the author's details,
      // and not a string (which is what it would be if 'author' wasn't populated - it would contain the author's id).
      expect(user3LocationBlogs[0].author).to.be.an('object');
      expect(user3LocationBlogs[0].author).to.not.be.a('string');
      expect(user3LocationBlogs[1].author).to.be.an('object');
      expect(user3LocationBlogs[1].author).to.not.be.a('string');
    });

    it('should allow user to like their own Location Blog', async function() {
      const user = await userFacade.findByUserName('Denzo');
      const userLocationBlogs = await locationBlogFacade.findAllByAuthor(user._id);
      expect(userLocationBlogs[0].likedBy).to.be.an('array');
      expect(userLocationBlogs[0].likedBy).to.be.empty;
      
      const res = await request({ url: `${API_URL}/locationblogs/likes/${userLocationBlogs[0]._id}/${user._id}`, method: 'PUT', json: true });
      expect(res.likedBy).to.have.lengthOf(1);
      expect(res.likedBy[0]).to.equal(user._id.toString());
    });

    it('should allow user to like a Location Blog written by a different user', async function() {
      const user1 = await userFacade.findByUserName('Dewrano'); // User1 that will like User2's Location Blog.
      const user2 = await userFacade.findByUserName('Denzo'); // User2's blog that will be liked by User1.
      const user2LocationBlogs = await locationBlogFacade.findAllByAuthor(user2._id);
      expect(user2LocationBlogs[0].likedBy).to.be.an('array');
      expect(user2LocationBlogs[0].likedBy).to.be.empty;

      const res = await request({ url: `${API_URL}/locationblogs/likes/${user2LocationBlogs[0]._id}/${user1._id}`, method: 'PUT', json: true });
      expect(res.likedBy).to.have.lengthOf(1);
      expect(res.likedBy[0]).to.equal(user1._id.toString());
    });

    it('should allow multiple users to like the same Location Blog', async function() {
      const user1 = await userFacade.findByUserName('Dewrano'); // User1 that will like user3's Location Blog.
      const user2 = await userFacade.findByUserName('Deryam'); // User2 that will like user3's Location Blog.
      const user3 = await userFacade.findByUserName('Denzo'); // User3's blog that will be liked by user1 and user2.
      const user3LocationBlogs = await locationBlogFacade.findAllByAuthor(user3._id);
      expect(user3LocationBlogs[0].likedBy).to.be.an('array');
      expect(user3LocationBlogs[0].likedBy).to.be.empty;

      // User 1 liking user3's Location Blog.
      const locationBlog1 = await request({ url: `${API_URL}/locationblogs/likes/${user3LocationBlogs[0]._id}/${user1._id}`, method: 'PUT', json: true });
      expect(locationBlog1.likedBy).to.have.lengthOf(1);
      expect(locationBlog1.likedBy[0]).to.equal(user1._id.toString());

      // User 2 liking user3's Location Blog.
      const locationBlog2 = await request({ url: `${API_URL}/locationblogs/likes/${user3LocationBlogs[0]._id}/${user2._id}`, method: 'PUT', json: true });
      expect(locationBlog2.likedBy).to.have.lengthOf(2); // Now 2.
      expect(locationBlog2.likedBy[1]).to.equal(user2._id.toString());
    });

    it('should show count as \'0\' for zero likes', async function() {
      const locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      const res = await request({ url: `${API_URL}/locationblogs/likes/count/${locationBlogs[1]._id}`, method: 'GET', json: true });
      expect(res).to.be.an('object');
      expect(res.likeCount).to.equal(0);
    });

    it('should show a correct number for likes', async function() {
      const users = await userFacade.getAllUsers();
      const locationBlogs = await locationBlogFacade.getAllLocationBlogs();

      await locationBlogFacade.likeLocationBlog(locationBlogs[0]._id, users[0]._id);
      const res1 = await request({ url: `${API_URL}/locationblogs/likes/count/${locationBlogs[0]._id}`, method: 'GET', json: true });
      expect(res1).to.be.an('object');
      expect(res1.likeCount).to.equal(1);

      await locationBlogFacade.likeLocationBlog(locationBlogs[0]._id, users[1]._id);
      const res2 = await request({ url: `${API_URL}/locationblogs/likes/count/${locationBlogs[0]._id}`, method: 'GET', json: true });
      expect(res2).to.be.an('object');
      expect(res2.likeCount).to.equal(2);
    });

    it('should update "Cool LocationBlog" info to "Best LocationBlog"', async function() {
      const user = await userFacade.findByUserName('Denzo');
      const locationBlogs = await locationBlogFacade.findAllByAuthor(user._id);

      locationBlogs[0].info = 'Best LocationBlog';
      const res = await request({ url: `${API_URL}/locationblogs/${locationBlogs[0]._id}`, method: 'PUT', json: true, body: locationBlogs[0] });
      expect(res.info).to.equal('Best LocationBlog');
      expect(new Date(res.lastUpdated)).to.be.above(locationBlogs[0].lastUpdated);
    });
    
    it('should delete "Cool LocationBlog"', async function() {
      let locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      expect(locationBlogs).to.have.lengthOf(3);

      const user = await userFacade.findByUserName('Denzo');
      let userLocationBlogs = await locationBlogFacade.findAllByAuthor(user._id);
      await request({ url: `${API_URL}/locationblogs/${userLocationBlogs[0]._id}`, method: 'DELETE', json: true });

      locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      expect(locationBlogs).to.have.lengthOf(2);

      userLocationBlogs = await locationBlogFacade.findAllByAuthor(user._id);
      expect(userLocationBlogs).to.be.empty;
    });
    
  });

  describe('Negative LocationBlog Tests', function() {

    it('should not find any Location Blogs as well as returning an empty array', async function() {
      await LocationBlog.deleteMany({});

      const res = await request({ url: `${API_URL}/locationblogs`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('array');
      expect(res).to.be.empty;
    });
    
    it('should not find any slugs as well as returning an empty array', async function() {
      await LocationBlog.deleteMany({});

      const res = await request({ url: `${API_URL}/locationblogs/slugs`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('array');
      expect(res).to.be.empty;
    });

    it('should not find any Location Blogs by a specified user as well as returning an empty array', async function() {
      // First user (Devran Coskun) has zero location blogs (see beforeEach).
      const user = await userFacade.findByUserName('Dewrano');
      const res = await request({ url: `${API_URL}/locationblogs/author/` + user._id, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('array');
      expect(res).to.be.empty;
    });

    it('should not find a Location Blog that does not exist by ID as well as returning an empty object', async function() {
      const res = await request({ url: `${API_URL}/locationblogs/3bbbbd8b9a7b832dc2514f02`, method: 'GET', json: true }); // Completely random ID.
      expect(res).to.be.an('object');
      expect(res).to.be.empty;
    });

    it('should not allow the same user to like a blog more than once as well as throwing an Error and returning the error message', async function() {
      const user1 = await userFacade.findByUserName('Dewrano'); // User1 that will like User2's Location Blog.
      const user2 = await userFacade.findByUserName('Denzo'); // User2's blog that will be liked by User1.
      const user2LocationBlogs = await locationBlogFacade.findAllByAuthor(user2._id);

      // Like the blog.
      await request({ url: `${API_URL}/locationblogs/likes/${user2LocationBlogs[0]._id}/${user1._id}`, method: 'PUT', json: true });

      // Like the same blog - this is not allowed.
      const res = await request({ url: `${API_URL}/locationblogs/likes/${user2LocationBlogs[0]._id}/${user1._id}`, method: 'PUT', json: true });
      expect(res).to.equal('Error: You have already liked this blog!');
    });

    it('should not update a Location Blog that does not exist as well as returning an empty object', async function() {
      // Completely random ID.
      const res = await request({ url: `${API_URL}/locationblogs/3bbbbd8b9a7b832dc2514f02`, method: 'PUT', json: true, body: { info: 'Best LocationBlog' } });
      expect(res).to.be.an('object');
      expect(res).to.be.empty;
    });

    it('should not delete a Location Blog that does not exist as well as returning an empty object', async function() {
      // Completely random ID.
      const res = await request({ url: `${API_URL}/locationblogs/3bbbbd8b9a7b832dc2514f02`, method: 'DELETE', json: true });
      expect(res).to.be.an('object');
      expect(res).to.be.empty;
    });

  });

});
