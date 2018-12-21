const mongoose = require('mongoose');
const expect = require('chai').expect;

const dbSetup = require('../utils/dbSetup');
const LocationBlog = require('../models/LocationBlog');
const locationBlogFacade = require('../facades/locationBlogFacade');
const User = require('../models/User');
const userFacade = require('../facades/userFacade');

describe('Testing the LocationBlog Facade', function() {

  // Set the timeout for each test case.
  this.timeout(require('../utils/settings').MOCHA_TEST_TIMEOUT);

  // Connect to the Test DB upon initialization.
  before(async function() {
    await dbSetup(require('../utils/settings').TEST_DB_URI);
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

  describe('Positive LocationBlog Tests', function() {

    it('should check if mongoose.Types.ObjectId.isValid() returns null upon an invalid ObjectId', async function() {
      const locationBlog = await locationBlogFacade.findOneById('InvalidObjectId');
      expect(locationBlog).to.be.null;
    });
	  
    it('should find all Location Blogs (non-populated on "author")', async function() {
      const locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      expect(locationBlogs).to.not.be.null;
      expect(locationBlogs).to.be.an('array');
      expect(locationBlogs).to.have.lengthOf(3);

      // Assert that 'author' (user) is not populated - it is an object containing the author's id and Mongoose data
      // with a size of 2, and not 5 (which is what it would be if 'author' was to be populated).
      expect(Object.keys(locationBlogs[0].author)).to.have.lengthOf(2); // Checking the first element is sufficient.
      expect(Object.keys(locationBlogs[0].author)).to.not.have.lengthOf(5);
    });

    it('should find all Location Blogs (populated on "author")', async function() {
      const locationBlogs = await locationBlogFacade.getAllLocationBlogs(true);
      expect(locationBlogs).to.not.be.null;
      expect(locationBlogs).to.be.an('array');
      expect(locationBlogs).to.have.lengthOf(3);

      // Assert that 'author' (user) IS populated - it is an object containing the author with a size of 5,
      // and not 2 (which is what it would be if 'author' wasn't populated).
      expect(Object.keys(locationBlogs[0].author)).to.have.lengthOf(5); // Checking the first element is sufficient.
      expect(Object.keys(locationBlogs[0].author)).to.not.have.lengthOf(2);
    });

    it('should find all slugs and then confirm every slug by retrieving them respectively', async function() {
      const locationBlogSlugs = await locationBlogFacade.getAllSlugs();
      expect(locationBlogSlugs).to.not.be.null;
      expect(locationBlogSlugs).to.be.an('array');
      expect(locationBlogSlugs).to.have.lengthOf(3);

      const locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      expect(locationBlogSlugs[0]).to.equal(`/locationblogs/${locationBlogs[0]._id}`);
      expect(locationBlogSlugs[1]).to.equal(`/locationblogs/${locationBlogs[1]._id}`);
      expect(locationBlogSlugs[2]).to.equal(`/locationblogs/${locationBlogs[2]._id}`);

      // This test also covers findOneSlugById().
      const slug1 = await locationBlogFacade.findOneSlugById(locationBlogSlugs[0]);
      expect(locationBlogSlugs[0]).to.equal(slug1);

      const slug2 = await locationBlogFacade.findOneSlugById(locationBlogSlugs[1]);
      expect(locationBlogSlugs[1]).to.equal(slug2);

      const slug3 = await locationBlogFacade.findOneSlugById(locationBlogSlugs[2]);
      expect(locationBlogSlugs[2]).to.equal(slug3);
    });

    it('should add the ID to the end of the slug', async function() {
      const user = await userFacade.findByUserName('Dewrano');
      await locationBlogFacade.addLocationBlog(user, 'Test LocationBlog', 1751, 2750);
      const locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      expect(locationBlogs[3].slug).to.equal(`/locationblogs/${locationBlogs[3]._id}`);
    });

    it('should add "Test LocationBlog" to Devran Coskun', async function() {
      const user = await userFacade.findByUserName('Dewrano');
      const locationBlog = await locationBlogFacade.addLocationBlog(user, 'Test LocationBlog', 1751, 2750);
      expect(locationBlog).to.not.be.null;
      expect(locationBlog).to.be.an('object');
      expect(locationBlog.info).to.equal('Test LocationBlog');
      expect(locationBlog.pos.longitude).to.equal(1751);
      expect(locationBlog.pos.latitude).to.equal(2750);
      
      const locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      expect(locationBlogs).to.not.be.null;
      expect(locationBlogs).to.be.an('array');
      expect(locationBlogs).to.have.lengthOf(4);
    });
    
    it('should find "Test LocationBlog" by ID (non-populated on "author")', async function() {
      const user = await userFacade.findByUserName('Dewrano');
      // Every time this file is run, new LocationBlogs are generated, which means new IDs are also generated every time.
      // Create the location blog and then find the location blog by retrieving the ID afterwards.
      const newLocationBlog = await locationBlogFacade.addLocationBlog(user, 'Test LocationBlog', 1751, 2750);
      const locationBlog = await locationBlogFacade.findOneById(newLocationBlog._id); // By ID.
      expect(locationBlog).to.not.be.null;
      expect(locationBlog).to.be.an('object');
      expect(locationBlog.info).to.equal('Test LocationBlog');
      expect(locationBlog.pos.longitude).to.equal(1751);
      expect(locationBlog.pos.latitude).to.equal(2750);

      // Assert that 'author' (user) is not populated - it is an object containing the author's id and Mongoose data
      // with a size of 2, and not 5 (which is what it would be if 'author' was to be populated).
      expect(Object.keys(locationBlog.author)).to.have.lengthOf(2);
      expect(Object.keys(locationBlog.author)).to.not.have.lengthOf(5);
    });

    it('should find "Test LocationBlog" by ID (populated on "author")', async function() {
      const user = await userFacade.findByUserName('Dewrano');
      // Every time this file is run, new LocationBlogs are generated, which means new IDs are also generated every time.
      // Create the location blog and then find the location blog by retrieving the ID afterwards.
      const newLocationBlog = await locationBlogFacade.addLocationBlog(user, 'Test LocationBlog', 1751, 2750);
      const locationBlog = await locationBlogFacade.findOneById(newLocationBlog._id, true); // By ID. true = populate 'author' (user).
      expect(locationBlog).to.not.be.null;
      expect(locationBlog).to.be.an('object');
      expect(locationBlog.info).to.equal('Test LocationBlog');
      expect(locationBlog.pos.longitude).to.equal(1751);
      expect(locationBlog.pos.latitude).to.equal(2750);

      // Assert that 'author' (user) IS populated - it is an object containing the author with a size of 5,
      // and not 2 (which is what it would be if 'author' wasn't populated).
      expect(Object.keys(locationBlog.author)).to.have.lengthOf(5);
      expect(Object.keys(locationBlog.author)).to.not.have.lengthOf(2);
    });

    it('should find all Location Blogs by Author/User (non-populated on "author")', async function() {
      // First user (Devran Coskun). Assert that user has zero location blogs (see beforeEach).
      const user1 = await userFacade.findByUserName('Dewrano');
      const user1LocationBlogs = await locationBlogFacade.findAllByAuthor(user1._id);
      expect(user1LocationBlogs).to.not.be.null;
      expect(user1LocationBlogs).to.be.an('array');
      expect(user1LocationBlogs).to.be.empty;

      // Second user (Deniz Coskun). Assert that user has one location blog (see beforeEach).
      const user2 = await userFacade.findByUserName('Denzo');
      const user2LocationBlogs = await locationBlogFacade.findAllByAuthor(user2._id);
      expect(user2LocationBlogs).to.not.be.null;
      expect(user2LocationBlogs).to.be.an('array');
      expect(user2LocationBlogs).to.have.lengthOf(1);
      expect(user2LocationBlogs[0].info).to.equal('Cool LocationBlog');
      expect(user2LocationBlogs[0].pos.longitude).to.equal(123);
      expect(user2LocationBlogs[0].pos.latitude).to.equal(456);
      // Assert that 'author' (user) is not populated - it is an object containing the author's id and Mongoose data
      // with a size of 2, and not 5 (which is what it would be if 'author' was to be populated).
      expect(Object.keys(user2LocationBlogs[0].author)).to.have.lengthOf(2);
      expect(Object.keys(user2LocationBlogs[0].author)).to.not.have.lengthOf(5);

      // Third user (Derya Coskun). Assert that user has three location blogs (see beforeEach).
      const user3 = await userFacade.findByUserName('Deryam');
      const user3LocationBlogs = await locationBlogFacade.findAllByAuthor(user3._id);
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
      // Assert that 'author' (user) is not populated - it is an object containing the author's id and Mongoose data
      // with a size of 2, and not 5 (which is what it would be if 'author' was to be populated).
      expect(Object.keys(user3LocationBlogs[0].author)).to.have.lengthOf(2);
      expect(Object.keys(user3LocationBlogs[0].author)).to.not.have.lengthOf(5);
      expect(Object.keys(user3LocationBlogs[1].author)).to.have.lengthOf(2);
      expect(Object.keys(user3LocationBlogs[1].author)).to.not.have.lengthOf(5);
    });

    it('should find all Location Blogs by Author/User (populated on "author")', async function() {
      // First user (Devran Coskun). Assert that user has zero location blogs (see beforeEach).
      const user1 = await userFacade.findByUserName('Dewrano');
      const user1LocationBlogs = await locationBlogFacade.findAllByAuthor(user1._id, true); // true = populate 'author' (user).
      expect(user1LocationBlogs).to.not.be.null;
      expect(user1LocationBlogs).to.be.an('array');
      expect(user1LocationBlogs).to.be.empty;

      // Second user (Deniz Coskun). Assert that user has one location blog (see beforeEach).
      const user2 = await userFacade.findByUserName('Denzo');
      const user2LocationBlogs = await locationBlogFacade.findAllByAuthor(user2._id, true); // true = populate 'author' (user).
      expect(user2LocationBlogs).to.not.be.null;
      expect(user2LocationBlogs).to.be.an('array');
      expect(user2LocationBlogs).to.have.lengthOf(1);
      expect(user2LocationBlogs[0].info).to.equal('Cool LocationBlog');
      expect(user2LocationBlogs[0].pos.longitude).to.equal(123);
      expect(user2LocationBlogs[0].pos.latitude).to.equal(456);
      // Assert that 'author' (user) IS populated - it is an object containing the author with a size of 5,
      // and not 2 (which is what it would be if 'author' wasn't populated).
      expect(Object.keys(user2LocationBlogs[0].author)).to.have.lengthOf(5);
      expect(Object.keys(user2LocationBlogs[0].author)).to.not.have.lengthOf(2);

      // Third user (Derya Coskun). Assert that user has three location blogs (see beforeEach).
      const user3 = await userFacade.findByUserName('Deryam');
      const user3LocationBlogs = await locationBlogFacade.findAllByAuthor(user3._id, true); // true = populate 'author' (user).
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
      // Assert that 'author' (user) is not populated - it is an object containing the author's id and Mongoose data
      // with a size of 2, and not 5 (which is what it would be if 'author' was to be populated).
      expect(Object.keys(user3LocationBlogs[0].author)).to.have.lengthOf(5);
      expect(Object.keys(user3LocationBlogs[0].author)).to.not.have.lengthOf(2);
      expect(Object.keys(user3LocationBlogs[1].author)).to.have.lengthOf(5);
      expect(Object.keys(user3LocationBlogs[1].author)).to.not.have.lengthOf(2);
    });

    it('should allow user to like their own Location Blog', async function() {
      const user = await userFacade.findByUserName('Denzo');
      const userLocationBlogs = await locationBlogFacade.findAllByAuthor(user._id);
      expect(userLocationBlogs[0].likedBy).to.be.an('array');
      expect(userLocationBlogs[0].likedBy).to.be.empty;
      const locationBlog = await locationBlogFacade.likeLocationBlog(userLocationBlogs[0]._id, user._id);
      expect(locationBlog.likedBy).to.have.lengthOf(1);
      expect(locationBlog.likedBy[0]._id).to.equal(user._id);
    });

    it('should allow user to like a Location Blog written by a different user', async function() {
      const user1 = await userFacade.findByUserName('Dewrano'); // User1 that will like User2's Location Blog.
      const user2 = await userFacade.findByUserName('Denzo'); // User2's blog that will be liked by User1.
      const user2LocationBlogs = await locationBlogFacade.findAllByAuthor(user2._id);
      expect(user2LocationBlogs[0].likedBy).to.be.an('array');
      expect(user2LocationBlogs[0].likedBy).to.be.empty;
      const locationBlog = await locationBlogFacade.likeLocationBlog(user2LocationBlogs[0]._id, user1._id);
      expect(locationBlog.likedBy).to.have.lengthOf(1);
      expect(locationBlog.likedBy[0]._id).to.equal(user1._id);
    });

    it('should allow multiple users to like the same Location Blog', async function() {
      const user1 = await userFacade.findByUserName('Dewrano'); // User1 that will like user3's Location Blog.
      const user2 = await userFacade.findByUserName('Deryam'); // User2 that will like user3's Location Blog.
      const user3 = await userFacade.findByUserName('Denzo'); // User3's blog that will be liked by user1 and user2.
      const user3LocationBlogs = await locationBlogFacade.findAllByAuthor(user3._id);
      expect(user3LocationBlogs[0].likedBy).to.be.an('array');
      expect(user3LocationBlogs[0].likedBy).to.be.empty;
      // User 1 liking user3's Location Blog.
      const locationBlog1 = await locationBlogFacade.likeLocationBlog(user3LocationBlogs[0]._id, user1._id);
      expect(locationBlog1.likedBy).to.have.lengthOf(1);
      expect(locationBlog1.likedBy[0]._id).to.equal(user1._id);
      // User 2 liking user3's Location Blog.
      const locationBlog2 = await locationBlogFacade.likeLocationBlog(user3LocationBlogs[0]._id, user2._id);
      expect(locationBlog2.likedBy).to.have.lengthOf(2); // Now 2.
      expect(locationBlog2.likedBy[1]._id).to.equal(user2._id);
    });

    it('should show count as \'0\' for zero likes', async function() {
      const locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      const likeCount = await locationBlogFacade.getLikeCount(locationBlogs[0]._id);
      expect(likeCount).to.be.a('number');
      expect(likeCount).to.equal(0);
    });

    it('should show a correct number for likes', async function() {
      const users = await userFacade.getAllUsers();
      const locationBlogs = await locationBlogFacade.getAllLocationBlogs();

      await locationBlogFacade.likeLocationBlog(locationBlogs[0]._id, users[0]._id);
      const likeCount1 = await locationBlogFacade.getLikeCount(locationBlogs[0]._id);
      expect(likeCount1).to.be.a('number');
      expect(likeCount1).to.equal(1);

      await locationBlogFacade.likeLocationBlog(locationBlogs[0]._id, users[1]._id);
      const likeCount2 = await locationBlogFacade.getLikeCount(locationBlogs[0]._id);
      expect(likeCount2).to.be.a('number');
      expect(likeCount2).to.equal(2);
    });

    it('should change the lastUpdated date after an update', async function() {
      const user = await userFacade.findByUserName('Denzo');
      const locationBlogs = await locationBlogFacade.findAllByAuthor(user._id);

      let locationBlog = locationBlogs[0];
      const prevLastUpdated = locationBlog.lastUpdated;
      locationBlog = await locationBlogFacade.addLocationBlog(user, 'info', 1, 2);
      expect(locationBlog.lastUpdated).to.be.above(prevLastUpdated);
    });

    it('should update "Cool LocationBlog" info to "Best LocationBlog"', async function() {
      const user = await userFacade.findByUserName('Denzo');
      const locationBlogs = await locationBlogFacade.findAllByAuthor(user._id);

      locationBlogs[0].info = 'Best LocationBlog';
      const updatedLocationBlog = await locationBlogFacade.updateLocationBlog(locationBlogs[0]);
      expect(updatedLocationBlog.info).to.equal('Best LocationBlog');
      expect(updatedLocationBlog.lastUpdated).to.be.above(locationBlogs[0].lastUpdated);
    });
    
    it('should delete "Cool LocationBlog"', async function() {
      let locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      expect(locationBlogs).to.have.lengthOf(3);

      const user = await userFacade.findByUserName('Denzo');
      let userLocationBlogs = await locationBlogFacade.findAllByAuthor(user._id);
      await locationBlogFacade.deleteLocationBlog(userLocationBlogs[0]._id);

      locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      expect(locationBlogs).to.have.lengthOf(2);

      userLocationBlogs = await locationBlogFacade.findAllByAuthor(user._id);
      expect(userLocationBlogs).to.be.empty;
    });

  });
  
  describe('Negative LocationBlog Tests', function() { 

    it('should not find any Location Blogs as well as returning an empty array', async function() {
      await LocationBlog.deleteMany({});
      const locationBlogs = await locationBlogFacade.getAllLocationBlogs();
      expect(locationBlogs).to.not.be.null;
      expect(locationBlogs).to.be.an('array');
      expect(locationBlogs).to.be.empty;
    });

    it('should not find any slugs as well as returning an empty array', async function() {
      await LocationBlog.deleteMany({});
      const locationBlogSlugs = await locationBlogFacade.getAllSlugs();
      expect(locationBlogSlugs).to.not.be.null;
      expect(locationBlogSlugs).to.be.an('array');
      expect(locationBlogSlugs).to.be.empty;
    });
	
	  it('should not find any Location Blogs by a specified user as well as returning an empty array', async function() {
      // First user (Devran Coskun) has zero location blogs (see beforeEach).
      const user = await userFacade.findByUserName('Dewrano');
      const locationBlogs = await locationBlogFacade.findAllByAuthor(user._id);
      expect(locationBlogs).to.not.be.null;
      expect(locationBlogs).to.be.an('array');
      expect(locationBlogs).to.be.empty;
    });

    it('should not find a Location Blog that does not exist by ID as well as returning null', async function() {
      const locationBlog = await locationBlogFacade.findOneById('3bbbbd8b9a7b832dc2514f02'); // Completely random ID.
      expect(locationBlog).to.be.null;
    });

    it('should not find a slug that does not exist by ID as well as returning undefined', async function() {
      const locationBlogSlug = await locationBlogFacade.findOneSlugById('3bbbbd8b9a7b832dc2514f02'); // Completely random ID.
      expect(locationBlogSlug).to.be.undefined;
    });
    
    it('should not allow the same user to like a blog more than once as well as throwing an Error and returning the error message', async function() {
      try {
        const user1 = await userFacade.findByUserName('Dewrano'); // User1 that will like User2's Location Blog.
        const user2 = await userFacade.findByUserName('Denzo'); // User2's blog that will be liked by User1.
        const user2LocationBlogs = await locationBlogFacade.findAllByAuthor(user2._id);
        await locationBlogFacade.likeLocationBlog(user2LocationBlogs[0]._id, user1._id);
        // Like the same blog - this is not allowed.
        await locationBlogFacade.likeLocationBlog(user2LocationBlogs[0]._id, user1._id);
      }
      catch (err) {
        expect(err.name).to.equal('Error');
        expect(err.message).to.equal('You have already liked this blog!');
      }
    });

    it('should not update a Location Blog that does not exist as well as returning null', async function() {
      // Completely random ID.
      const locationBlog = await locationBlogFacade.updateLocationBlog({ id: '3bbbbd8b9a7b832dc2514f02', info: 'Best LocationBlog' });
      expect(locationBlog).to.be.null;
    });

    it('should not delete a Location Blog that does not exist as well as returning null', async function() {
      const locationBlog = await locationBlogFacade.deleteLocationBlog('3bbbbd8b9a7b832dc2514f02'); // Completely random ID.
      expect(locationBlog).to.be.null;
    });
	
  });

});
