const mongoose = require('mongoose');
const LocationBlog = require('../models/LocationBlog');
const userFacade = require('./userFacade');

async function addLocationBlog(author, info, longitude, latitude) {
  const user = await userFacade.findById(author._id);
  if (user === null) {
    throw Error(`Author ID doesn't exist!`);
  }

  return new LocationBlog({ author, info, pos: { longitude, latitude } }).save();
}

async function likeLocationBlog(blogId, authorId) {
  const locationBlog = await findOneById(blogId);
  const user = await userFacade.findById(authorId);
  if (locationBlog === null || user === null) {
    throw Error(`${locationBlog === null ? 'Blog ID' : 'Author ID'} doesn't exist!`);
  }

  // The indexOf() method returns the first index at which a given element can be
  // found in the array, or -1 if it is not present.
  // If the authorId is found, then indexOf() will return the index, which could be
  // index 0 and up. If so, it means that the author has already liked the blog.
  if (locationBlog.likedBy.indexOf(authorId) >= 0) { // !== -1
    throw Error('You have already liked this blog!');
  }
  locationBlog.likedBy.push(authorId);

  return locationBlog.save();
}

async function getLikeCount(blogId) {
  const locationBlog = await findOneById(blogId);
  return locationBlog === null ? 0 : locationBlog.likedByCount;
}

function getAllLocationBlogs(populate) {
  if (populate) {
    return LocationBlog.find({}).populate('author').populate({ path: 'likedBy', select: 'userName email' }).exec();
  }
  return LocationBlog.find({}).exec();
}

function getAllSlugs() {
  return LocationBlog.find({}).select({ 'slug': 1 }).exec().then((data) => data.map((s) => s.slug));
}

function findOneById(blogId, populate) {
  if (!mongoose.Types.ObjectId.isValid(blogId)) return null; // If not a valid ID, then return null (also to prevent CastError).
  if (populate) {
    return LocationBlog.findById(blogId).populate('author').populate({ path: 'likedBy', select: 'userName email' }).exec();
  }
  return LocationBlog.findById(blogId).exec();
}

function findAllByAuthor(authorId, populate) {
  if (findOneById(authorId) !== null) {
    if (populate) {
      // return LocationBlog.find({}).where({ 'author': authorId }).populate('author').populate({ path: 'likedBy', select: 'userName email' }).exec();
      return LocationBlog.find({ 'author': authorId }).populate('author').populate({ path: 'likedBy', select: 'userName email' }).exec();
    }
    // return LocationBlog.find({}).where({ 'author': authorId }).exec();
    return LocationBlog.find({ 'author': authorId }).exec();
  }
  return null;
}

async function findOneSlugById(slugId) {
  let slug;
  await LocationBlog.find({}).select({ 'slug': 1 }).exec()
    .then((data) => data.filter((s) => { 
      if (s.slug === slugId) {
        slug = s.slug;
      }
    }));
  return slug;
}

function updateLocationBlog(locationBlog) {
  if (findOneById(locationBlog._id) !== null) {
    // locationBlog = The updated locationBlog. new: true = Return the updated document. 
    // findByIdAndUpdate() triggers middleware: findOneAndUpdate() - see LocationBlog.js (https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate)
    return LocationBlog.findByIdAndUpdate(locationBlog._id, locationBlog, { new: true }).exec();
  }
  return null;
}

function deleteLocationBlog(locationBlogId) {
  if (findOneById(locationBlogId) !== null) {
    return LocationBlog.findByIdAndDelete(locationBlogId).exec();
  }
  return null;
}

module.exports = {
  addLocationBlog,
  likeLocationBlog,
  getLikeCount,
  getAllLocationBlogs,
  getAllSlugs,
  findOneById,
  findAllByAuthor,
  findOneSlugById,
  updateLocationBlog,
  deleteLocationBlog
};
