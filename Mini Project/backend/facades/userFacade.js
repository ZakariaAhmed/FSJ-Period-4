const mongoose = require('mongoose');
const User = require('../models/User');

async function addUser(firstName, lastName, userName, password, email, job) {
  // Find user if either userName or email matches (both unique fields).
  const user = await User.findOne({ $or: [{ userName }, { email }] }).exec();
  if (user) {
    throw Error('This username or email already exists!');
  }

  return new User({ firstName, lastName, userName, password, email, job }).save();
}

function addJobToUser(user, jobList) {
  if (Array.isArray(jobList)) {
    jobList.forEach((job) => {
      const { type, company, companyUrl } = job;
      user.job.push({ type, company, companyUrl });
    });
  }
  else {
    const { type, company, companyUrl } = jobList;
    user.job.push({ type, company, companyUrl });
  }
  // user = The updated user. new: true = Return the updated document. 
  // findByIdAndUpdate() triggers middleware: findOneAndUpdate() - see User.js (https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate)
  return User.findByIdAndUpdate(user._id, user, { new: true }).exec();
  // return user.save();
}

function getAllUsers() {
  return User.find({}).exec();
}

function findById(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null; // If not a valid ID, then return null (also to prevent CastError).
  return User.findById(userId).exec();
}

function findByUserName(userName) {
  return User.findOne({ userName }).exec();
}

function findByEmail(email) {
  return User.findOne({ email }).exec();
}

async function updateUser(user) {
  if (await findById(user._id) !== null) {
    // Find user if either userName OR email matches (both unique fields).
    // Exlude the user's own ID with $ne (not equal), because if the user does not change username/email,
    // then the if-statement below will be true, as they exist.
    const findUser = await User.findOne({ _id: { $ne: user._id }, $or: [{ userName: user.userName }, { email: user.email }] }).exec();
    if (findUser) {
      throw Error('This username or email already exists!');
    }

    // user = The updated user. new: true = Return the updated document. 
    // findByIdAndUpdate() triggers middleware: findOneAndUpdate() - see User.js (https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate)
    return User.findByIdAndUpdate(user._id, user, { new: true }).exec();
  }
  return null;
}

async function deleteUser(userId) {
  if (await findById(userId) !== null) {
    return User.findByIdAndDelete(userId).exec();
  }
  return null;
}

module.exports = {
  addUser,
  addJobToUser,
  getAllUsers,
  findById,
  findByUserName,
  findByEmail,
  updateUser,
  deleteUser
};
