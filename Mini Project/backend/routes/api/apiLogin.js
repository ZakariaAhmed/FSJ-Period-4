var express = require('express');
var router = express.Router();

const login = require('../../facades/loginFacade');

router.post('/login', async function(req, res, next) {
  /*
  { 
    "userName": "Dewrano", 
    "password": "test123", 
    "longitude": 12.409005314111708, 
    "latitude": 55.7847898805561, 
    "distance": 1
  }
  */

  try {
    const data = req.body;
    const friends = await login(data.userName, data.password, data.longitude, data.latitude, data.distance, data.pushToken);
    res.json(friends);
  }
  catch (err) {
    res.status(403).json(err);
  }
});

module.exports = router;
