var express = require('express');
var router = express.Router();

const gameFacade = require('../../facades/gameFacade');

router.get('/isPlayerInArea/:lon/:lat', async function(req, res, next) {
  const lon = Number(req.params.lon);
  const lat = Number(req.params.lat);

  const isInside = await gameFacade.isPlayerInArea(lon, lat);
  const msg = isInside ? 'Point was inside the tested polygon' 
                       : 'Point was NOT inside tested polygon';

  const result = { 'status': isInside, msg }; // Boolean(isInside).
  res.json(result);
});

router.get('/findNearbyPlayers/:lon/:lat/:rad', async function(req, res, next) {
  const lon = Number(req.params.lon);
  const lat = Number(req.params.lat);
  const rad = Number(req.params.rad);

  const result = await gameFacade.findNearbyPlayers(lon, lat, rad);
  res.json(result);
});

router.get('/distanceToUser/:lon/:lat/:userName', async function(req, res, next)  {
  const lon = Number(req.params.lon);
  const lat = Number(req.params.lat);
  const userName = req.params.userName;

  try {
    const distance = await gameFacade.distanceToUser(lon, lat, userName);
    res.json(distance);
  }
  catch (err) {
    res.status(404).json(err);
  }
});

router.get('/getGameArea', async function(req, res, next) {
  const result = await gameFacade.getGameArea();
  res.json(result);
});

module.exports = router;
