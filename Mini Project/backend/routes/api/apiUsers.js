var express = require('express');
var router = express.Router();

const userFacade = require('../../facades/userFacade');

router.get('/', async function(req, res, next) {
  const users = await userFacade.getAllUsers();
  if (users === null) return res.json([]);
  res.json(users);
});

router.get('/id/:id', async function(req, res, next) {
  const user = await userFacade.findById(req.params.id);
  if (user === null) return res.json({});
  res.json(user);
});

router.get('/username/:userName', async function(req, res, next) {
  const user = await userFacade.findByUserName(req.params.userName);
  if (user === null) return res.json({});
  res.json(user);
});

router.get('/email/:email', async function(req, res, next) {
  const user = await userFacade.findByEmail(req.params.email);
  if (user === null) return res.json({});
  res.json(user);
});

router.post('/', async function(req, res, next) {
  /*
  {
    "firstName": "Test", 
    "lastName": "Account", 
    "userName": "test_acc", 
    "password": "test", 
    "email": "test@live.dk",
    "job": [
      {
        "type": "Private",
        "company": "Test A/S",
        "companyUrl": "https://www.test.dk"
      }
    ]
  }
  */

  try {
    const user = req.body;
    await userFacade.addUser(user.firstName, user.lastName, user.userName, user.password, user.email, user.job ? user.job : []);
    res.json(user);
  }
  catch (err) {
    res.json(err.toString()); // err.message
  }
});

router.post('/addjob/:id', async function(req, res, next) {
  /*
  {
    "type": "Private",
    "company": "Test A/S",
    "companyUrl": "https://www.test.dk"
  }

  // More than 1 job.
  [
    {
      "type": "Private",
      "company": "Test A/S",
      "companyUrl": "https://www.test.dk"
    },
    {
      "type": "Public",
      "company": "Test A/S",
      "companyUrl": "https://www.test.dk"
    },
  ]
  */

  let user = await userFacade.findById(req.params.id);
  if (user === null) return res.json({});
  const jobList = req.body;
  user = await userFacade.addJobToUser(user, jobList);
  res.json(user);
});

router.put('/:id', async function(req, res, next) {
  /*
  {
    "firstName": "Test", 
    "lastName": "Account", 
    "userName": "test_acc", 
    "password": "test", 
    "email": "test@live.dk",
    "job": [
      {
        "type": "Private",
        "company": "Test A/S",
        "companyUrl": "https://www.test.dk"
      }
    ]
  }
  */

  try {
    const userDetails = req.body;
    userDetails._id = req.params.id;
    const user = await userFacade.updateUser(userDetails);
    if (user === null) return res.json({});
    res.json(user);
  }
  catch (err) {
    res.json(err.toString()); // err.message
  }
});

router.delete('/:id', async function(req, res, next) {
  const user = await userFacade.deleteUser(req.params.id);
  if (user === null) return res.json({});
  res.json(user);
});

module.exports = router;
