var mongoose = require('mongoose');

const DB_URI = require('./settings').DEV_DB_URI;
let connectionStr = null;

function connect(dbUriString) {
  setConnectionStr(dbUriString ? dbUriString : DB_URI);
  // This returns a promise (used for testing purposes).
  return mongoose.connect(getConnectionStr(), { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false });
}

function getConnectionStr() {
  return connectionStr;
}

function setConnectionStr(conStr) {
  connectionStr = conStr;
}

// Instead of 'on', 'once' is used to only call the event handlers once,
// otherwise they will keep on executing whenever we run a test case.
mongoose.connection.once('connected', function() {
  console.log('Mongoose connection open to ' + getConnectionStr());
});

mongoose.connection.once('error', function(err) {
  console.log('Mongoose connection error: ' + err);
});

module.exports = connect;
