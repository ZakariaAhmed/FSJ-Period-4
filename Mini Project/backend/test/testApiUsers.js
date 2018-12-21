const mongoose = require('mongoose');
const expect = require('chai').expect;
const http = require('http');
const request = require('request-promise-native'); // request-promise-native (instead of request) returns ES6 promises, allowing the usage of the syntactic sugar of async/await.

const app = require('../app');
const dbSetup = require('../utils/dbSetup');
const bcrypt = require('../utils/bcrypt');
const User = require('../models/User');
const userFacade = require('../facades/userFacade');

const SERVER_TEST_PORT = require('../utils/settings').SERVER_TEST_PORT;
const API_URL = require('../utils/settings').API_URL;
var server = null;

describe('Testing REST API for /users endpoints', function() {

  // Set the timeout for each test case.
  this.timeout(require('../utils/settings').MOCHA_TEST_TIMEOUT);

  // Connect to the Test DB and Test Server upon initialization.
  before(async function() {
    await dbSetup(require('../utils/settings').TEST_DB_URI);

    server = await http.createServer(app);
    await server.listen(SERVER_TEST_PORT, () => console.log(`Test Server successfully running on port: ${SERVER_TEST_PORT}`));
  });

  // Setup the database in a known state (3 users) before EACH test.
  beforeEach(async function() {
    await User.collection.drop();
    await User.deleteMany({});
    await Promise.all([
      new User({ firstName: 'Devran', lastName: 'Coskun', userName: 'Dewrano', password: 'test123', email: 'devran-coskun@live.dk', job: { type: 'Private', company: 'DC A/S', companyUrl: 'https://www.devrancoskun.dk' } }).save(),
      new User({ firstName: 'Deniz', lastName: 'Coskun', userName: 'Denzo', password: 'test456', email: 'deniz-coskun@live.dk' }).save(),
      new User({ firstName: 'Derya', lastName: 'Coskun', userName: 'Deryam', password: 'test789', email: 'derya-coskun@live.dk', job: { type: 'Public', company: 'DC ApS', companyUrl: 'https://www.deryacoskun.dk' } }).save(),
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
  
  describe('Positive User Tests', function() {

    it('should find all users (Devran Coskun, Deniz Coskun and Derya Coskun)', async function() {
      const res = await request({ url: `${API_URL}/users`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('array');
      expect(res).to.have.lengthOf(3);
    });
    
    it('should find Devran Coskun by username', async function() {
      const res = await request({ url: `${API_URL}/users/username/Dewrano`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('object');
      expect(res).to.include({ firstName: 'Devran', lastName: 'Coskun', userName: 'Dewrano', email: 'devran-coskun@live.dk' });
      expect(await bcrypt.comparePassword('test123', res.password)).to.be.true; // Password (test BCrypt as well).
    });

    it('should find Devran Coskun by email', async function() {
      const res = await request({ url: `${API_URL}/users/email/devran-coskun@live.dk`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('object');
      expect(res).to.include({ firstName: 'Devran', lastName: 'Coskun', userName: 'Dewrano', email: 'devran-coskun@live.dk' });
      expect(await bcrypt.comparePassword('test123', res.password)).to.be.true; // Password (test BCrypt as well).
    });

    it('should add Test Account', async function() {
      const user = {
        "firstName": "Test", 
        "lastName": "Account", 
        "userName": "test_acc", 
        "password": "test", 
        "email": "test@live.dk"
      };

      const res = await request({ url: `${API_URL}/users`, method: 'POST', json: true, body: user });
      expect(res).to.deep.equal(user);

      // Assert that the account has in fact been added to the database.
      const testUser = await userFacade.findByEmail(user.email);
      expect(testUser).to.not.be.null;
      expect(testUser).to.be.an('object');
      expect(testUser).to.include({ firstName: 'Test', lastName: 'Account', userName: 'test_acc', email: 'test@live.dk' });
      expect(await bcrypt.comparePassword('test', testUser.password)).to.be.true; // Password (test BCrypt as well).

      const users = await userFacade.getAllUsers();
      expect(users).to.not.be.null;
      expect(users).to.be.an('array');
      expect(users).to.have.lengthOf(4);
    });

    it('should find Test Account by ID', async function() {
      // Every time this file is run, new users are generated, which means new IDs are also generated every time.
      // Create the user and then find the user by retrieving the ID afterwards.
      const testUser = await userFacade.addUser('Test', 'Account', 'test_acc', 'test', 'test@live.dk');

      const res = await request({ url: `${API_URL}/users/id/${testUser._id}`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('object');
      expect(res).to.include({ firstName: 'Test', lastName: 'Account', userName: 'test_acc', email: 'test@live.dk' });
      expect(await bcrypt.comparePassword('test', res.password)).to.be.true; // Password (test BCrypt as well).
    });

    it('should add a job to Deniz Coskun', async function() {
      // Every time this file is run, new users are generated, which means new IDs are also generated every time.
      // Retrieve the user and then use the user id to add a job to the user afterwards.
      const user = await userFacade.findByUserName('Denzo');

      const job =   {
        "type": "Private",
        "company": "Test A/S",
        "companyUrl": "https://www.test.dk"
      };
    
      const res = await request({ url: `${API_URL}/users/addjob/${user._id}`, method: 'POST', json: true, body: job });
      expect(res.job[0]).to.include(job);

      // Assert that the job has in fact been added to the user in the database.
      const testUser = await userFacade.findByEmail(user.email);

      expect(testUser.job).to.not.be.null;
      expect(testUser.job).to.be.an('array');
      expect(testUser.job).to.have.lengthOf(1);    

      expect(testUser.job[0].type).to.equal('Private');
      expect(testUser.job[0].company).to.equal('Test A/S');
      expect(testUser.job[0].companyUrl).to.equal('https://www.test.dk');
    });

    it('should update Devran Coskun\'s name to "Hello World"', async function() {
      const user = await userFacade.findByUserName('Dewrano');
      user.firstName = 'Hello';
      user.lastName = 'World';
      const res = await request({ url: `${API_URL}/users/${user._id}`, method: 'PUT', json: true, body: user });
      expect(res.firstName).to.equal('Hello');
      expect(res.lastName).to.equal('World');
      expect(new Date(res.lastUpdated)).to.be.above(user.lastUpdated);
    });
    
    it('should delete Devran Coskun', async function() {
      let users = await userFacade.getAllUsers();
      expect(users).to.have.lengthOf(3);

      let user = await userFacade.findByUserName('Dewrano');
      await request({ url: `${API_URL}/users/${user._id}`, method: 'DELETE', json: true });

      users = await userFacade.getAllUsers();
      expect(users).to.have.lengthOf(2);

      user = await userFacade.findByUserName('Dewrano');
      expect(user).to.be.null;
    });

  });

  describe('Negative User Tests', function() {

    it('should not find any users as well as returning an empty array', async function() {
      await User.deleteMany({});

      const res = await request({ url: `${API_URL}/users`, method: 'GET', json: true });
      expect(res).to.not.be.null;
      expect(res).to.be.an('array');
      expect(res).to.be.empty;
    });
    
    it('should not find an account that does not exist by ID as well as returning an empty object', async function() {
      // Completely random ID.
      const res = await request({ url: `${API_URL}/users/id/3bbbbd8b9a7b832dc2514f02`, method: 'GET', json: true });
      expect(res).to.be.an('object');
      expect(res).to.be.empty;
    });

    it('should not find an account that does not exist by username as well as returning an empty object', async function() {
      const res = await request({ url: `${API_URL}/users/username/Random`, method: 'GET', json: true });
      expect(res).to.be.an('object');
      expect(res).to.be.empty;
    });
    
    it('should not find an account that does not exist by email as well as returning an empty object', async function() {
      const res = await request({ url: `${API_URL}/users/email/random@live.dk`, method: 'GET', json: true });
      expect(res).to.be.an('object');
      expect(res).to.be.empty;
    });

    it('should not add an account with a username (unique) that already exists as well as throwing an Error', async function() {
      // An already existing account.
      const user = {
        "firstName": "Devran", 
        "lastName": "Coskun", 
        "userName": "Dewrano", 
        "password": "test123", 
        "email": "devran-coskun@live.dk",
      };
      
      const res = await request({ url: `${API_URL}/users`, method: 'POST', json: true, body: user });
      expect(res).to.equal('Error: This username or email already exists!');
    });

    it('should not update an account that does not exist as well as returning null', async function() {
      // Completely random ID.
      const res = await request({ url: `${API_URL}/users/3bbbbd8b9a7b832dc2514f02`, method: 'PUT', json: true, body: { firstName: 'Test', lastName: 'Account', userName: 'test_acc', password: 'test', email: 'test_acc@test.dk' } });
      expect(res).to.be.an('object');
      expect(res).to.be.empty;
    });

    it('should not update userName (unique field) to an already existing userName as well as throwing an Error', async function() {
      const user = await userFacade.findByUserName('Dewrano');
      user.userName = 'Denzo';
      const res = await request({ url: `${API_URL}/users/${user._id}`, method: 'PUT', json: true, body: user });
      expect(res).to.equal('Error: This username or email already exists!');
    });

    it('should not delete an account that does not exist as well as returning an empty object', async function() {
      // Completely random ID.
      const res = await request({ url: `${API_URL}/users/3bbbbd8b9a7b832dc2514f02`, method: 'DELETE', json: true });
      expect(res).to.be.an('object');
      expect(res).to.be.empty;
    });
   
  });

});
