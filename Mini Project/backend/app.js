require('./utils/dbSetup')();

var express = require('express');
var createError = require('http-errors');
var cors = require('cors');
var logger = require('morgan');
var path = require('path');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');

var indexRouter = require('./routes/index');
var apiLoginRouter = require('./routes/api/apiLogin');
var apiUsersRouter = require('./routes/api/apiUsers');
var apiLocationBlogsRouter = require('./routes/api/apiLocationBlogs');
var apiGameRouter = require('./routes/api/apiGame');
var graphQLRouter = require('./routes/graphql/graphQL');

var app = express();

// View engine setup.
const viewEngine = 'pug'; // Use either 'pug' or 'ejs' as a view engine.
app.set('views', path.join(__dirname, 'views', viewEngine));
app.set('view engine', viewEngine);

// Pretty print.
app.set('json spaces', 2);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors()); // Enable all CORS requests.

app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  secret: 'secret_code',
  loggedIn: false,
  user: null,
  // Cookie Options.
  secure: true,
  maxAge: 30 * 60 * 1000 // 30 minutes.
}));

// Enable reverse proxy support (Droplet with nginx), which is needed for secure cookies.
app.set('trust proxy', 1);

// Check whether users are logged in, if not redirect to the login-page.
app.use(function (req, res, next) {
  // This effectively means that our REST API can be called by all (regardless of being logged in).
  // if (req.url.startsWith('/api') || req.url.startsWith('/geoapi') || req.url.startsWith('/graphql')) return next();
  if (req.url.includes('api') || req.url.includes('graphql')) return next();
  if (!req.session.loggedIn) {
    req.url = '/login';
  }
  else if (req.session.loggedIn && req.url.endsWith('login')) {
    return res.redirect(301, '/friend-finder');
  }
  next();
});

app.use('/', indexRouter);
app.use('/api', apiLoginRouter);
app.use('/api/users', apiUsersRouter);
app.use('/api/locationblogs', apiLocationBlogsRouter);
app.use('/geoapi', apiGameRouter);
app.use('/graphql', graphQLRouter);

// Catch 404 and forward to error handler.
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler.
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development.
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  
  // Render the error page.
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
