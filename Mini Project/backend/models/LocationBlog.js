var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LocationBlogSchema = new Schema({
  info: { type: String, required: true },
  pos: {
    longitude: { type: Number, required: true },
    latitude: { type: Number, required: true }
  },
  // Non-embedding - this represents a one-to-many relation with a reference on the many side.
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }], // likedBy: [Schema.Types.ObjectId],
  created: { type: Date, default: Date.now },
  lastUpdated: Date
});

LocationBlogSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// findOneAndUpdate middleware is triggered by: findByIdAndUpdate(). Link: https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
// See updateLocationBlog() method in locationBlogFacade.js.
LocationBlogSchema.pre('findOneAndUpdate', function() {
  // Update the lastUpdated field on the _update object.
  this._update.lastUpdated = new Date();
});

// This will not be persisted in the database.
// This is used to access a Location Blog via the URL.
LocationBlogSchema.virtual('slug').get(function() {
  return '/locationblogs/' + this._id;
});

LocationBlogSchema.virtual('likedByCount').get(function() {
  return this.likedBy.length;
});

module.exports = mongoose.model('LocationBlog', LocationBlogSchema);
