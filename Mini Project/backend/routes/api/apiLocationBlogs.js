var express = require('express');
var router = express.Router();

const locationBlogFacade = require('../../facades/locationBlogFacade');
const userFacade = require('../../facades/userFacade');

router.get('/', async function(req, res, next) {
  const locationBlogs = await locationBlogFacade.getAllLocationBlogs();
  if (locationBlogs === null) return res.json([]);
  res.json(locationBlogs);
});

router.get('/populate', async function(req, res, next) {
  const locationBlogs = await locationBlogFacade.getAllLocationBlogs(true);
  if (locationBlogs === null) return res.json([]);
  res.json(locationBlogs);
});

router.get('/slugs', async function(req, res, next) {
  const locationBlogSlugs = await locationBlogFacade.getAllSlugs();
  if (locationBlogSlugs === null) return res.json([]);
  res.json(locationBlogSlugs);
});

router.get('/:id', async function(req, res, next) {
  const locationBlog = await locationBlogFacade.findOneById(req.params.id);
  if (locationBlog === null) return res.json({});
  res.json(locationBlog);
});

router.get('/:id/populate', async function(req, res, next) {
  const locationBlog = await locationBlogFacade.findOneById(req.params.id, true);
  if (locationBlog === null) return res.json({});
  res.json(locationBlog);
});

router.get('/author/:authorId', async function(req, res, next) {
  const locationBlogs = await locationBlogFacade.findAllByAuthor(req.params.authorId);
  if (locationBlogs === null) return res.json([]);
  res.json(locationBlogs);
});

router.get('/author/:authorId/populate', async function(req, res, next) {
  const locationBlogs = await locationBlogFacade.findAllByAuthor(req.params.authorId, true);
  if (locationBlogs === null) return res.json([]);
  res.json(locationBlogs);
});

router.post('/:authorId', async function(req, res, next) {
  /*
  {
    "info": "Test LocationBlog", 
    "longitude": "1751", 
    "latitude": "2750" 
  }
  */

  const user = await userFacade.findById(req.params.authorId);
  if (user === null) return res.json({});
  let locationBlog = req.body;
  locationBlog = await locationBlogFacade.addLocationBlog(user, locationBlog.info, locationBlog.longitude, locationBlog.latitude);
  res.json(locationBlog);
});

router.put('/likes/:id/:authorId', async function(req, res, next) {
  try {
    const locationBlog = await locationBlogFacade.likeLocationBlog(req.params.id, req.params.authorId);
    res.json(locationBlog);
  }
  catch (err) {
    res.json(err.toString()); // err.message
  }
});

router.get('/likes/count/:id', async function(req, res, next) {
  const likeCount = await locationBlogFacade.getLikeCount(req.params.id);
  res.json({ likeCount });
});

router.put('/:id', async function(req, res, next) {
  /*
  {
    "info": "Test LocationBlog", 
    "longitude": "1751", 
    "latitude": "2750" 
  }
  */

  const locationBlogDetails = req.body;
  locationBlogDetails._id = req.params.id;
  const locationBlog = await locationBlogFacade.updateLocationBlog(locationBlogDetails);
  if (locationBlog === null) return res.json({});
  res.json(locationBlog);
});

router.delete('/:id', async function(req, res, next) {
  const locationBlog = await locationBlogFacade.deleteLocationBlog(req.params.id);
  if (locationBlog === null) return res.json({});
  res.json(locationBlog);
});

module.exports = router;
