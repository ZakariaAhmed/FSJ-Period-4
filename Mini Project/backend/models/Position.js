var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const EXPIRES = 60 * 60 * 24 * 365; // 1 year.

var PositionSchema = new Schema({
  user: { type: Schema.ObjectId, ref: 'User', required: true },
  created: { type: Date, expires: EXPIRES, default: Date.now },
  loc: {
    'type': { type: String, enum: 'Point', default: 'Point' },
    coordinates: { type: [Number] }
  }
});
PositionSchema.index({ loc: '2dsphere' }, { 'background': true });

module.exports = mongoose.model('Position', PositionSchema);
