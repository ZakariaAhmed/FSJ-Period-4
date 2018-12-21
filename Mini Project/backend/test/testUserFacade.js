const mongoose = require('mongoose');
const expect = require('chai').expect;

const dbSetup = require('../utils/dbSetup');
const bcrypt = require('../utils/bcrypt');
const User = require('../models/User');
const userFacade = require('../facades/userFacade');

describe('Testing the User Facade', function() {

  // Set the timeout for each test case.
  this.timeout(require('../utils/settings').MOCHA_TEST_TIMEOUT);

  // Connect to the Test DB upon initialization.
  before(async function() {
    await dbSetup(require('../utils/settings').TEST_DB_URI);
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

  describe('Positive User Tests', function() {

    it('should check if mongoose.Types.ObjectId.isValid() returns null upon an invalid ObjectId', async function() {
      const user = await userFacade.findById('InvalidObjectId');
      expect(user).to.be.null;
    });
	
    it('should find all users (Devran Coskun, Deniz Coskun and Derya Coskun)', async function() {
      const users = await userFacade.getAllUsers();
      expect(users).to.not.be.null;
      expect(users).to.be.an('array');
      expect(users).to.have.lengthOf(3);
    });

    it('should find Devran Coskun by username', async function() {
      const user = await userFacade.findByUserName('Dewrano');
      expect(user).to.not.be.null;
      expect(user).to.be.an('object');
      expect(user).to.include({ firstName: 'Devran', lastName: 'Coskun', userName: 'Dewrano', email: 'devran-coskun@live.dk' });
      expect(await bcrypt.comparePassword('test123', user.password)).to.be.true; // Password (test BCrypt as well).
    });

    it('should find Devran Coskun by email', async function() {
      const user = await userFacade.findByEmail('devran-coskun@live.dk');
      expect(user).to.not.be.null;
      expect(user).to.be.an('object');
      expect(user).to.include({ firstName: 'Devran', lastName: 'Coskun', userName: 'Dewrano', email: 'devran-coskun@live.dk' });
      expect(await bcrypt.comparePassword('test123', user.password)).to.be.true; // Password (test BCrypt as well).
    });

    it('should add Test Account', async function() {
      const user = await userFacade.addUser('Test', 'Account', 'test_acc', 'test', 'test@live.dk');
      expect(user).to.not.be.null;
      expect(user).to.be.an('object');
      expect(user).to.include({ firstName: 'Test', lastName: 'Account', userName: 'test_acc', email: 'test@live.dk' });
      expect(await bcrypt.comparePassword('test', user.password)).to.be.true; // Password (test BCrypt as well).

      const users = await userFacade.getAllUsers();
      expect(users).to.not.be.null;
      expect(users).to.be.an('array');
      expect(users).to.have.lengthOf(4);
    });
    
    it('should find Test Account by ID', async function() {
      // Every time this file is run, new users are generated, which means new IDs are also generated every time.
      // Create the user and then find the user by retrieving the ID afterwards.
      const newUser = await userFacade.addUser('Test', 'Account', 'test_acc', 'test', 'test@live.dk');
      const user = await userFacade.findById(newUser._id); // By ID.
      expect(user).to.not.be.null;
      expect(user).to.be.an('object');
      expect(user).to.include({ firstName: 'Test', lastName: 'Account', userName: 'test_acc', email: 'test@live.dk' });
      expect(await bcrypt.comparePassword('test', user.password)).to.be.true; // Password (test BCrypt as well).
    });

    it('should check that job is assigned to Devran Coskun upon creation', async function() {
      const user = await userFacade.findByUserName('Dewrano');
      expect(user.job).to.not.be.null;
      expect(user.job).to.be.an('array');
      expect(user.job).to.have.lengthOf(1);
      expect(user.job[0].type).to.equal('Private');
      expect(user.job[0].company).to.equal('DC A/S');
      expect(user.job[0].companyUrl).to.equal('https://www.devrancoskun.dk');
    });

    it('should add two extra jobs to Devran Coskun', async function() {
      let user = await userFacade.findByUserName('Dewrano');
      const jobList = [
        { type: 'Public', company: 'DC A/S', companyUrl: 'https://www.devrancoskun.dk' },
        { type: 'Tutor', company: 'Cphbusiness', companyUrl: 'https://www.cphbusiness.dk' }
      ];
      user = await userFacade.addJobToUser(user, jobList);

      expect(user.job).to.not.be.null;
      expect(user.job).to.be.an('array');
      expect(user.job).to.have.lengthOf(3);

      expect(user.job[0].type).to.equal('Private');
      expect(user.job[0].company).to.equal('DC A/S');
      expect(user.job[0].companyUrl).to.equal('https://www.devrancoskun.dk');

      expect(user.job[1].type).to.equal('Public');
      expect(user.job[1].company).to.equal('DC A/S');
      expect(user.job[1].companyUrl).to.equal('https://www.devrancoskun.dk');

      expect(user.job[2].type).to.equal('Tutor');
      expect(user.job[2].company).to.equal('Cphbusiness');
      expect(user.job[2].companyUrl).to.equal('https://www.cphbusiness.dk');
    });

    it('should confirm that no jobs are assigned to Deniz Coskun upon creation', async function() {
      const user = await userFacade.findByUserName('Denzo');
      expect(user.job).to.not.be.null;
      expect(user.job).to.be.empty;
    });

    it('should add a job to Deniz Coskun', async function() {
      let user = await userFacade.findByUserName('Denzo');
      const job = { type: 'Student', company: 'Grantofteskolen', companyUrl: 'https://www.grantofteskolen.dk' };
      user = await userFacade.addJobToUser(user, job);

      expect(user.job).to.not.be.null;
      expect(user.job).to.be.an('array');
      expect(user.job).to.have.lengthOf(1);

      expect(user.job[0].type).to.equal('Student');
      expect(user.job[0].company).to.equal('Grantofteskolen');
      expect(user.job[0].companyUrl).to.equal('https://www.grantofteskolen.dk');
    });

    it('should change the lastUpdated date after an update', async function() {
      let user = await userFacade.findByUserName('Dewrano');
      const prevLastUpdated = user.lastUpdated;
      user = await userFacade.addJobToUser(user, 'a', 'b', 'c');
      expect(user.lastUpdated).to.be.above(prevLastUpdated);
    });
    
    it('should update Devran Coskun\'s name to "Hello World"', async function() {
      const user = await userFacade.findByUserName('Dewrano');
      user.firstName = 'Hello';
      user.lastName = 'World';
      const updatedUser = await userFacade.updateUser(user);
      expect(updatedUser.firstName).to.equal('Hello');
      expect(updatedUser.lastName).to.equal('World');
      expect(updatedUser.lastUpdated).to.be.above(user.lastUpdated);
    });
    
    it('should delete Devran Coskun', async function() {
      let users = await userFacade.getAllUsers();
      expect(users).to.have.lengthOf(3);

      let user = await userFacade.findByUserName('Dewrano');
      await userFacade.deleteUser(user._id);

      users = await userFacade.getAllUsers();
      expect(users).to.have.lengthOf(2);

      user = await userFacade.findByUserName('Dewrano');
      expect(user).to.be.null;
    });
  
  });
  
  describe('Negative User Tests', function() {
	  
    it('should not find any users as well as returning an empty array', async function() {
      await User.deleteMany({});
      const users = await userFacade.getAllUsers();
      expect(users).to.not.be.null;
      expect(users).to.be.an('array');
      expect(users).to.be.empty;
    });

    it('should not find an account that does not exist by ID as well as returning null', async function() {
      const user = await userFacade.findById('3bbbbd8b9a7b832dc2514f02'); // Completely random ID.
      expect(user).to.be.null;
    });

    it('should not find an account that does not exist by username as well as returning null', async function() {
      const user = await userFacade.findByUserName('Random');
      expect(user).to.be.null;
    });

    it('should not find an account that does not exist by email as well as returning null', async function() {
      const user = await userFacade.findByEmail('random@live.dk');
      expect(user).to.be.null;
    });

    it('should not add an account with a userName (unique) that already exists as well as throwing an Error', async function() {
      try {
        await userFacade.addUser('Devran', 'Coskun', 'Dewrano', 'test123', 'email@live.dk');
      }
      catch (err) {
        expect(err.name).to.equal('Error');
        expect(err.message).to.equal('This username or email already exists!');
      }
    });

    it('should not add an account with an email (unique) that already exists as well as throwing an Error', async function() {
      try {
        await userFacade.addUser('Devran', 'Coskun', 'Username', 'test123', 'devran-coskun@live.dk');
      }
      catch (err) {
        expect(err.name).to.equal('Error');
        expect(err.message).to.equal('This username or email already exists!');
      }
    });

    it('should not add an account with both userName & email (unique fields) that already exist as well as throwing an Error', async function() {
      try {
        await userFacade.addUser('Devran', 'Coskun', 'Dewrano', 'test123', 'devran-coskun@live.dk');
      }
      catch (err) {
        expect(err.name).to.equal('Error');
        expect(err.message).to.equal('This username or email already exists!');
      }
    });

    it('should not update an account that does not exist as well as returning null', async function() {
      // Completely random ID.
      const user = await userFacade.updateUser({ _id: '3bbbbd8b9a7b832dc2514f02', firstName: 'Test', lastName: 'Account', userName: 'test_acc', password: 'test', email: 'test_acc@test.dk' });
      expect(user).to.be.null;
    });

    it('should not update userName (unique field) to an already existing userName as well as throwing an Error', async function() {
      try {
        const user = await userFacade.findByUserName('Dewrano');
        user.userName = 'Denzo';
        await userFacade.updateUser(user);
      }
      catch (err) {
        expect(err.name).to.equal('Error');
        expect(err.message).to.equal('This username or email already exists!');
      }
    });
    
    it('should not update email (unique field) to an already existing email as well as throwing an Error', async function() {
      try {
        const user = await userFacade.findByUserName('Dewrano');
        user.email = 'deniz-coskun@live.dk';
        await userFacade.updateUser(user);
      }
      catch (err) {
        expect(err.name).to.equal('Error');
        expect(err.message).to.equal('This username or email already exists!');
      }
    });

    it('should not update both userName & email (unique fields) to already existing userName & email values as well as throwing an Error', async function() {
      try {
        const user = await userFacade.findByUserName('Dewrano');
        user.userName = 'Denzo';
        user.email = 'deniz-coskun@live.dk';
        await userFacade.updateUser(user);
      }
      catch (err) {
        expect(err.name).to.equal('Error');
        expect(err.message).to.equal('This username or email already exists!');
      }
    });

    it('should not delete an account that does not exist as well as returning null', async function() {
      const user = await userFacade.deleteUser('3bbbbd8b9a7b832dc2514f02'); // Completely random ID.
      expect(user).to.be.null;
    });
	
  });

});
