var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const LocationBlog = require('../models/LocationBlog');
const bcrypt = require('../utils/bcrypt');

// An example of embedding.
var JobSchema = new Schema({
  type: String,
  company: String,
  companyUrl: String
});

var UserSchema = new Schema({
  firstName: String,
  lastName: String,
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  job: [JobSchema], // Observe embedding.
  pushToken: { type: String, default: null },
  created: { type: Date, default: Date.now },
  lastUpdated: Date,
});

UserSchema.pre('save', async function() {
  // Hash and salt the password.
  this.password = await bcrypt.hashPassword(this.password);
  this.lastUpdated = new Date();
});

// findOneAndUpdate middleware is triggered by: findByIdAndUpdate(). Link: https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
// See updateUser() method in userFacade.js.
UserSchema.pre('findOneAndUpdate', async function() {
  // Update the lastUpdated field on the _update object.
  this._update.lastUpdated = new Date();

  // Only hash and salt the password if a new password has been entered.
  if (this._update.password) {
    this._update.password = await bcrypt.hashPassword(this._update.password);
  }
});

// findOneAndDelete middleware is triggered by: findOneAndDelete(). Link: https://mongoosejs.com/docs/api.html#model_Model.findOneAndDelete
// See deleteUser() method in userFacade.js.
// Delete all location blogs created by the user as well as removing the user's likes from location blogs.
UserSchema.post('findOneAndDelete', async function(user) {
  await LocationBlog.deleteMany({ author: user._id }).exec();
  await LocationBlog.updateMany({ $pull: { 'likedBy': user._id } });
});

module.exports = mongoose.model('User', UserSchema);
