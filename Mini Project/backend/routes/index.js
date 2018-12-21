var express = require('express');
var router = express.Router();

const login = require('../facades/loginFacade');
const userFacade = require('../facades/userFacade');
const locationBlogFacade = require('../facades/locationBlogFacade');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Friend Finder', user: req.session.user, friends: req.session.friends })
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login' });
});

router.post('/login', async function(req, res, next) {
  try {
    const data = req.body;
    // Convert the distance to meters.
    // This is required due to MongoDB only accepting meters for the geometry queries.
    const friends = await login(data.userName, data.password, data.longitude, data.latitude, data.distance * 1000);
    const user = { userName: data.userName, longitude: data.longitude, latitude: data.latitude, distance: data.distance * 1000 };
    req.session = { loggedIn: true, user: user, friends: friends.friends };
    res.redirect(301, '/friend-finder');
  }
  catch (err) {
    res.render('login', { title: 'Login', error: err.msg });
  }
});

router.post('/logout', function(req, res, next) {
  req.session = null;
  res.redirect(301, '/friend-finder/login');
});

router.get('/users', async function(req, res, next) {
  const users = await userFacade.getAllUsers();
  res.render('users', { title: 'All Users', users });
});

router.get('/locationBlogs', async function(req, res, next) {
  const locationBlogs = await locationBlogFacade.getAllLocationBlogs(true);
  res.render('locationBlogs', { title: 'All Location Blogs', locationBlogs, userName: req.session.user.userName });
});

router.get('/addUser', async function(req, res, next) {
  res.render('addUser', { title: 'Add User' });
});

router.post('/addUser', async function(req, res, next) {
  try {
    const user = req.body;
    await userFacade.addUser(user.firstName, user.lastName, user.userName, user.password, user.email);
    res.render('addUser', { title: 'Add User', success: 'User added!' });
  }
  catch (err) {
    res.render('addUser', { title: 'Add User', error: err.toString() });
  }
});

router.get('/addLocationBlog', async function(req, res, next) {
  res.render('addLocationBlog', { title: 'Add Location Blog' });
});

router.post('/addLocationBlog', async function(req, res, next) {
  const user = await userFacade.findByUserName(req.session.user.userName);
  const locationBlog = req.body;
  await locationBlogFacade.addLocationBlog(user, locationBlog.info, locationBlog.longitude, locationBlog.latitude);
  res.render('addLocationBlog', { title: 'Add Location Blog', success: 'Location Blog added!' });
});

router.post('/likeLocationBlog', async function(req, res, next) {
  try {
    const user = await userFacade.findByUserName(req.body.author);

    const userId = user._id;
    const locationBlogId = req.body.blog;

    await locationBlogFacade.likeLocationBlog(locationBlogId, userId);
    const locationBlogs = await locationBlogFacade.getAllLocationBlogs(true);

    res.render('locationBlogs', { title: 'All Location Blogs', success: 'Liked Location Blog!', locationBlogs, userName: req.session.user.userName });
  }
  catch (err) {
    const locationBlogs = await locationBlogFacade.getAllLocationBlogs(true);
    res.render('locationBlogs', { title: 'All Location Blogs', error: err.toString(), locationBlogs, userName: req.session.user.userName });
  }
});

module.exports = router;
